import './TitleBar.css';
import icon from '../../../assets/icon.png';
import { VscChromeClose, VscChromeMinimize } from 'react-icons/vsc';
import { BrowserWindow } from '@electron/remote';

export default function TitleBar() {
  return (
    <div
      style={{
        width: '100%',
        height: '48px',
        backgroundColor: '#202020',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 10px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <img height="30" alt="icon" src={icon} />
        <span style={{ color: '#ffffff', marginLeft: '10px' }}>
          Zoom Call Manager
        </span>
      </div>
      <div
        style={{
          flex: 1,
          height: '100%',
          // @ts-expect-error app-region exists inside an electron environment
          appRegion: 'drag',
        }}
      ></div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          marginRight: '10px',
        }}
      >
        <div
          className="ctrl-btn minimize-container"
          onClick={() => window.electron.ipcRenderer.sendMessage('minimize')}
        >
          <VscChromeMinimize size={20} />
        </div>
        <div className="ctrl-btn close-container">
          <VscChromeClose size={20} onClick={() => window.close()} />
        </div>
      </div>
    </div>
  );
}
