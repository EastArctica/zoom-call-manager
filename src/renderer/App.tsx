import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import SidebarEntry from './components/SidebarEntry';
import {
  VscHome,
  VscQuestion,
  VscSettingsGear,
  VscNotebook,
  VscAccount,
} from 'react-icons/vsc';
import { useEffect, useState } from 'react';
import Page from './Pages/Page';
import HomePage from './Pages/HomePage';
import SettingsPage from './Pages/SettingsPage';
import CallLogPage from './Pages/CallLogPage';
import AboutPage from './Pages/AboutPage';
import LoginPage from './Pages/LoginPage';
import { ZoomCallManagerMessage, ZoomCallManagerType } from '../shared/ipc';
import {
  getAccessToken,
  refreshAccessToken,
  ZoomAccessTokenResponse,
} from '../shared/zoom';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { EPage } from '../shared/Page';

async function saveTokenInfo(tokenInfo: ZoomAccessTokenResponse) {
  return {
    zoomAccessToken: tokenInfo.access_token,
    zoomRefreshToken: tokenInfo.refresh_token,
    zoomTokenExpiration: Math.floor(Date.now() + tokenInfo.expires_in * 1000),
  };
}

function Main() {
  // FIXME: Skip login currently because zoom login does nothing at the moment.
  const [loggedIn, setLoggedIn] = useState(true);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(EPage.Login);
  const { settings, updateSettings, isLoading } = useSettings();

  // ipc handler for custom url-scheme
  useEffect(() => {
    if (loggedIn) return;
    window.electron.ipcRenderer.once(
      'zoom-call-manager',
      async (msg: ZoomCallManagerMessage) => {
        if (msg.type != ZoomCallManagerType.RESPONSE_ZOOM_CODE) {
          return;
        }

        const url = new URL(msg.data);
        const code = url.searchParams.get('code');
        if (!code) {
          alert('Invalid zoom code.');
          return;
        }

        const auth = await getAccessToken(code);
        if (!auth.access_token) {
          alert('Failed to get zoom access token');
          return;
        }

        const tokenInfo = await saveTokenInfo(auth);
        updateSettings(tokenInfo);
      },
    );
  }, []);

  window.electron.ipcRenderer.sendMessage('zoom-call-manager', {
    type: ZoomCallManagerType.REQUEST_ZOOM_CODE,
  } as ZoomCallManagerMessage);

  useEffect(() => {
    return window.electron.ipcRenderer.on('page-changed', (page: EPage) => {
      setPage(page);
    });
  }, []);

  // Keep checking settings to check if we've logged in
  useEffect(() => {
    if (settings.zoomRefreshToken) {
      setLoggedIn(true);
      setPage(EPage.Home);
    }
  }, [settings.zoomRefreshToken]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const hasRefreshToken =
          typeof settings.zoomRefreshToken === 'string' &&
          settings.zoomRefreshToken !== '';
        let isLoggedIn = hasRefreshToken;

        if (
          hasRefreshToken &&
          Date.now() > (settings.zoomTokenExpiration || 0)
        ) {
          // Access token is expired, refresh it
          const tokenInfo = await refreshAccessToken(
            settings.zoomRefreshToken as string,
          );
          if (tokenInfo) {
            isLoggedIn = false;
            const updatedTokenInfo = await saveTokenInfo(tokenInfo);
            updateSettings(updatedTokenInfo);
          }
        }

        setLoggedIn(isLoggedIn);
        setPage(isLoggedIn ? EPage.Home : EPage.Login);
      } catch (error) {
        console.error('Failed to check auth:', error);
        setLoggedIn(false);
        setPage(EPage.Login);
      } finally {
        // Set loading to false when done
        setLoading(false);
      }
    };

    if (!isLoading) {
      // FIXME: Skip login currently because zoom login does nothing at the moment.
      setLoading(false);
      setPage(EPage.Home);
      //checkAuth();
    }
  }, [settings.zoomRefreshToken, isLoading]);

  // Show loading screen while checking auth
  if (loading || isLoading) {
    return (
      <div
        style={{
          backgroundColor: '#202020',
          width: '100vw',
          height: '100vh',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <TitleBar />
        <div
          style={{
            display: 'flex',
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column',
          }}
        >
          <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
            Loading...
          </div>
          <div style={{ fontSize: '1rem', color: '#aaaaaa' }}>
            Checking authentication status
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: '#202020',
        width: '100vw',
        height: '100vh',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <TitleBar />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar>
          {loggedIn ? (
            <SidebarEntry
              name="Home"
              Icon={VscHome}
              onClick={() => setPage(EPage.Home)}
              selected={page === EPage.Home}
            />
          ) : (
            <SidebarEntry
              name="Login"
              Icon={VscAccount}
              onClick={() => setPage(EPage.Login)}
              selected={page === EPage.Login}
            />
          )}
          <SidebarEntry
            name="Settings"
            Icon={VscSettingsGear}
            onClick={() => setPage(EPage.Settings)}
            selected={page === EPage.Settings}
          />
          <SidebarEntry
            name="Call Log"
            Icon={VscNotebook}
            onClick={() => setPage(EPage.Call_Log)}
            selected={page === EPage.Call_Log}
          />
          <SidebarEntry
            name="About"
            Icon={VscQuestion}
            onClick={() => setPage(EPage.About)}
            selected={page === EPage.About}
          />
        </Sidebar>
        <Page>
          {(() => {
            switch (page) {
              case EPage.Login:
                return <LoginPage />;
              case EPage.Home:
                return <HomePage />;
              case EPage.Settings:
                return <SettingsPage />;
              case EPage.Call_Log:
                return <CallLogPage />;
              case EPage.About:
                return <AboutPage />;
            }
          })()}
        </Page>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <SettingsProvider>
        <Routes>
          <Route path="/" element={<Main />} />
        </Routes>
      </SettingsProvider>
    </Router>
  );
}
