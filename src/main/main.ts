/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import { readFile, writeFile } from 'fs/promises';
import { parsePhoneNumber } from 'react-phone-number-input';
import path from 'path';
import { ZoomCallManagerMessage, ZoomCallManagerType } from '../shared/ipc';
import Registry from 'rage-edit';
import { EPage } from '../shared/Page';
import { CallLogEntry } from '../renderer/context/SettingsContext';

async function setupAssociations() {
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient('tel', process.execPath, [
        path.resolve(process.argv[1]),
      ]);
      app.setAsDefaultProtocolClient('zoom-call-manager', process.execPath, [
        path.resolve(process.argv[1]),
      ]);
    }
  } else {
    app.setAsDefaultProtocolClient('tel');
    app.setAsDefaultProtocolClient('zoom-call-manager');
  }
}
setupAssociations();

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

// User settings
const USER_DATA_PATH = path.join(app.getPath('userData'), 'user_data.json');
async function readSettings() {
  try {
    const userData = await readFile(USER_DATA_PATH, 'utf-8');
    return JSON.parse(userData);
  } catch (e) {
    // This user data file is invalid, create a backup of it and create a new one
    const backupPath = path.join(
      app.getPath('userData'),
      `user_data_${Date.now()}.json`,
    );
    await writeFile(backupPath, JSON.stringify({}));
    void writeFile(USER_DATA_PATH, JSON.stringify({}));
    return {};
  }
}
ipcMain.on('read-settings', async (event, _arg) => {
  event.reply('read-settings', await readSettings());
});

async function writeSettings(settings: object) {
  await writeFile(USER_DATA_PATH, JSON.stringify(settings));
}
ipcMain.on('save-settings', async (_event, settings: object) => {
  await writeSettings(settings);
});

// zoom-call-manager url scheme
let zoomCodeURL: string | null = null;
ipcMain.on('zoom-call-manager', async (event, msg: ZoomCallManagerMessage) => {
  switch (msg.type) {
    case ZoomCallManagerType.REQUEST_ZOOM_CODE: {
      if (zoomCodeURL !== null) {
        event.reply('zoom-call-manager', {
          type: ZoomCallManagerType.RESPONSE_ZOOM_CODE,
          data: zoomCodeURL,
        } as ZoomCallManagerMessage);
      }
      break;
    }
  }
});

// Misc
ipcMain.on('minimize', () => {
  BrowserWindow.getFocusedWindow()?.minimize();
});
// Triggers a url association for the tel handler
ipcMain.on('associate-tel', async () => {
  await Registry.delete(
    'HKCU\\Software\\Microsoft\\Windows\\Shell\\Associations\\UrlAssociations\\tel\\UserChoice',
  );
  shell.openExternal('tel:');
});

// Check if the current app is the tel protocol handler
async function isCurrentTelHandler(): Promise<boolean> {
  try {
    const userChoice = await Registry.get(
      'HKCU\\Software\\Microsoft\\Windows\\Shell\\Associations\\UrlAssociations\\tel\\UserChoice',
      'ProgId',
    );

    return userChoice === 'Zoom Call Manager.tel';
  } catch (error) {
    console.error('Error checking tel handler:', error);
    return false;
  }
}

// IPC handler to check if the current app is the tel protocol handler
ipcMain.handle('check-tel-handler', async () => {
  return await isCurrentTelHandler();
});

// IPC handler to set the page in the main process
ipcMain.on('set-page', (event, page: EPage) => {
  event.sender.send('page-changed', page);
});

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug').default();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
      // devTools: true,
    },
    titleBarStyle: 'hidden',
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }

    // mainWindow.webContents.openDevTools();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  new AppUpdater();
};

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Note that this function does *not* assume that the argument is a valid deep link.
async function deepLinkHandler(arg: string): Promise<boolean> {
  const url = new URL(arg);
  if (!['zoom-call-manager:', 'tel:', 'callto:'].includes(url.protocol)) {
    return false;
  }

  if (url.pathname == '') {
    return false;
  }

  switch (url.protocol) {
    case 'zoom-call-manager:': {
      zoomCodeURL = arg;
      break;
    }
    case 'tel:': {
      const settings = await readSettings().catch((e) => {
        dialog.showErrorBox(
          'An error occurred',
          `Failed to read settings\n\n${e}`,
        );
      });

      const phoneNumberStr = decodeURIComponent(url.pathname);
      const parsedPhoneNumber = parsePhoneNumber(phoneNumberStr, 'US');
      if (parsedPhoneNumber) {
        const e164Number = parsedPhoneNumber.format('E.164');
        const matchingRule = findMatchingRule(
          e164Number,
          settings.mappingRules || [],
        );
        const zoomNumber = matchingRule?.zoomNumber || settings.defaultCallerId;
        shell.openExternal(
          `zoomphonecall://${encodeURIComponent(phoneNumberStr)}?callerid=${encodeURIComponent(zoomNumber)}`,
        );

        // Save call to call log
        (settings.callLog ||= []).push({
          url: arg,
          to: e164Number,
          callerID: zoomNumber,
          matched: !!matchingRule,
          matchID: matchingRule?.id,
          at: Date.now(),
        } as CallLogEntry);
      } else {
        dialog.showErrorBox(
          'An error occurred',
          'Failed to parse phone number: ' +
            phoneNumberStr +
            '\nPassing directly through to zoom.',
        );
      }

      await writeSettings(settings);
      return true;
    }
  }

  return false;
}

function findMatchingRule(
  phoneNumber: string,
  rules: Array<{
    pattern: string;
    zoomNumber: string;
    id: string;
    description: string;
  }>,
) {
  // Sort rules by specificity (longer patterns first to prioritize more specific matches)
  const sortedRules = [...rules].sort(
    (a, b) => b.pattern.length - a.pattern.length,
  );

  for (const rule of sortedRules) {
    // Convert the pattern to a regex
    // Replace * with .* to match any characters
    const patternRegex = new RegExp(
      '^' + rule.pattern.replace('+', '\\+') + '\\d*' + '$',
    );

    // Test if the phone number matches the pattern
    if (patternRegex.test(phoneNumber)) {
      return rule;
    }
  }

  return null;
}

async function main() {
  const gotTheLock = app.requestSingleInstanceLock();
  if (!gotTheLock) {
    console.error('Failed to get single instance lock.');
    app.quit();
  } else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
      let lastArg = commandLine.pop() as string;
      deepLinkHandler(lastArg).catch((e) => {
        console.error('Failed to parse deep link:', lastArg, e);
      });

      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();

        if (zoomCodeURL !== null) {
          mainWindow.webContents.send('zoom-call-manager', {
            type: ZoomCallManagerType.RESPONSE_ZOOM_CODE,
            data: zoomCodeURL,
          } as ZoomCallManagerMessage);
        }
      }
    });

    let lastArg = process.argv.pop() as string;
    const shouldExit = await deepLinkHandler(lastArg).catch((e) => {
      console.error('Failed to parse deep link:', lastArg, e);
    });
    if (shouldExit) {
      process.exit();
    }

    // Create mainWindow, load the rest of the app, etc...
    app
      .whenReady()
      .then(() => {
        createWindow();
        app.on('activate', () => {
          // On macOS it's common to re-create a window in the app when the
          // dock icon is clicked and there are no other windows open.
          if (mainWindow === null) createWindow();
        });
      })
      .catch(console.error);
  }
}

void main();
