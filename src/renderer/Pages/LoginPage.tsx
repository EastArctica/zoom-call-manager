import './LoginPage.css';
import { getAuthorizeUrl } from '../../shared/zoom';
import { useState } from 'react';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      const url = await getAuthorizeUrl();
      window.open(url.toString(), '_blank');
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: '20px',
      }}
    >
      <h1 style={{ marginBottom: '2rem' }}>Zoom Call Manager</h1>
      <p
        style={{ marginBottom: '2rem', textAlign: 'center', maxWidth: '500px' }}
      >
        Please log in with your Zoom account to manage your call settings.
      </p>
      <button
        onClick={handleLogin}
        disabled={isLoading}
        style={{
          backgroundColor: '#0E72ED',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          padding: '0.75rem 1.5rem',
          fontSize: '1rem',
          cursor: isLoading ? 'default' : 'pointer',
          transition: 'background-color 0.2s',
          opacity: isLoading ? 0.7 : 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isLoading ? (
          <>
            <div className="spinner"></div>
            <span style={{ marginLeft: '10px' }}>Connecting...</span>
          </>
        ) : (
          'Login with Zoom'
        )}
      </button>
    </div>
  );
}
