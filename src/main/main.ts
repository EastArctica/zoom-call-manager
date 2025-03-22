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
import { Registry } from 'rage-edit';
import { parsePhoneNumber } from 'react-phone-number-input';
import path from 'path';
import { ZoomCallManagerMessage, ZoomCallManagerType } from '../shared/ipc';

async function setupAssociations() {
  // Windows registering of 'tel' is broken in electron and needs to be done this way
  if (process.platform === 'win32') {
    try {
      await Registry.set(
        'HKCU\\Software\\Zoom Call Manager\\Capabilities',
        'ApplicationName',
        'Zoom Call Manager',
      );
      await Registry.set(
        'HKCU\\Software\\Zoom Call Manager\\Capabilities',
        'ApplicationDescription',
        'Zoom Call Manager',
      );
      await Registry.set(
        'HKCU\\Software\\Zoom Call Manager\\Capabilities\\URLAssociations',
        'tel',
        'Zoom Call Manager.tel',
      );
      await Registry.set(
        'HKCU\\Software\\Classes\\Zoom Call Manager.tel\\DefaultIcon',
        '',
        process.execPath,
      );
      await Registry.set(
        'HKCU\\Software\\Classes\\Zoom Call Manager.tel\\shell\\open\\command',
        '',
        `"${process.execPath}" "%1"`,
      );
      await Registry.set(
        'HKCU\\Software\\RegisteredApplications',
        'Zoom Call Manager',
        'Software\\Zoom Call Manager\\Capabilities',
      );
    } catch (e) {
      dialog.showErrorBox(
        'An error occurred',
        `Failed to set registry keys for tel handler.\n\n${e}`,
      );
    }
  }

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

ipcMain.on('minimize', () => {
  BrowserWindow.getFocusedWindow()?.minimize();
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
async function deepLinkHandler(arg: string) {
  const url = new URL(arg);
  if (!['zoom-call-manager:', 'tel:', 'callto:'].includes(url.protocol)) {
    return;
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
      console.log(url);

      const phoneNumberStr = url.pathname;
      const parsedPhoneNumber = parsePhoneNumber(phoneNumberStr, 'US');
      if (parsedPhoneNumber) {
        const e164Number = parsedPhoneNumber.format('E.164');
        const matchingRule = findMatchingRule(
          e164Number,
          settings.mappingRules || [],
        );
        const zoomNumber = matchingRule?.zoomNumber || settings.defaultCallerId;
        // shell.openExternal(
        //   `zoomphonecall://${url.pathname}?callerid=${zoomNumber}`,
        // );

        // Save call to call log
        (settings.callLog ||= []).push({
          url: arg,
          to: e164Number,
          callerID: zoomNumber,
          matched: !!matchingRule,
          at: Date.now(),
        });
      } else {
        dialog.showErrorBox(
          'An error occurred',
          'Failed to parse phone number: ' +
            phoneNumberStr +
            '\nPassing directly through to zoom.',
        );
      }

      await writeSettings(settings);
      process.exit();
    }
  }
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

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    let lastArg = commandLine.pop() as string;
    deepLinkHandler(lastArg);

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
  deepLinkHandler(lastArg);

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
    .catch(console.log);
}
