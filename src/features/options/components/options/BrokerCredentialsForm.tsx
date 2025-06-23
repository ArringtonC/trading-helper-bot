import React, { useState, useEffect } from 'react';

const BrokerCredentialsForm: React.FC = () => {
  // IBKR State
  const [ibkrUsername, setIbkrUsername] = useState('');
  const [ibkrPassword, setIbkrPassword] = useState('');
  const [ibkrConfigured, setIbkrConfigured] = useState(false);
  const [ibkrMessage, setIbkrMessage] = useState('');

  // Schwab State
  const [schwabAppKey, setSchwabAppKey] = useState('');
  const [schwabAppSecret, setSchwabAppSecret] = useState('');
  const [schwabConfigured, setSchwabConfigured] = useState(false);
  const [schwabMessage, setSchwabMessage] = useState('');

  // Check if running in Electron environment
  const isElectronEnvironment = () => {
    return !!(window as any).electronAPI;
  };

  const isElectron = isElectronEnvironment();

  // Check configuration status on load
  useEffect(() => {
    const checkConfig = async () => {
      // Only check credentials if running in Electron environment
      if (!isElectron) {
        setIbkrMessage('Credential management is only available in the Electron app version.');
        setSchwabMessage('Credential management is only available in the Electron app version.');
        return;
      }

      try {
        // Debug: Check which APIs are available
        console.log('window.credentials:', (window as any).credentials);
        console.log('window.electronAPI:', (window as any).electronAPI);
        
        if ((window as any).credentials) {
          // Use new credentials API
        const ibkrStatus = await (window as any).credentials.isConfigured('ibkr', 'username');
        setIbkrConfigured(ibkrStatus?.success && ibkrStatus?.isConfigured);

        const schwabStatus = await (window as any).credentials.isConfigured('schwab', 'appKey');
        setSchwabConfigured(schwabStatus?.success && schwabStatus?.isConfigured);
        } else if ((window as any).electronAPI) {
          // Fallback to electronAPI for checking
          console.log('Using electronAPI fallback for credential checking');
          try {
            await (window as any).electronAPI.getCredentials('IBKR', 'placeholder');
            setIbkrConfigured(true);
          } catch {
            setIbkrConfigured(false);
          }
          try {
            await (window as any).electronAPI.getCredentials('Schwab', 'placeholder');
            setSchwabConfigured(true);
          } catch {
            setSchwabConfigured(false);
          }
        }
      } catch (error) {
        console.error('Error checking credential status:', error);
        setIbkrMessage('Error checking IBKR status');
        setSchwabMessage('Error checking Schwab status');
      }
    };
    
    // Wait a bit for preload script to fully load
    setTimeout(checkConfig, 1000);
  }, [isElectron]);

  const handleSaveIbkr = async () => {
    setIbkrMessage('');
    
    // Check if running in Electron environment
    if (!isElectron) {
      setIbkrMessage('Credential management is only available in the Electron app version.');
      return;
    }
    
    if (!ibkrUsername || !ibkrPassword) {
      setIbkrMessage('IBKR Username and Password are required.');
      return;
    }
    
    try {
      if ((window as any).credentials) {
        // Use new credentials API
        console.log('Using window.credentials API');
      const saveUsernameResult = await (window as any).credentials.save('ibkr', 'username', ibkrUsername);
      const savePasswordResult = await (window as any).credentials.save('ibkr', 'password', ibkrPassword);

      if (saveUsernameResult?.success && savePasswordResult?.success) {
        setIbkrMessage('IBKR credentials saved successfully!');
        setIbkrConfigured(true);
        setIbkrUsername(''); // Clear fields after save
        setIbkrPassword('');
      } else {
        const errorMsg = saveUsernameResult?.error || savePasswordResult?.error || 'Failed to save IBKR credentials.';
        setIbkrMessage(`Error: ${errorMsg}`);
        setIbkrConfigured(false);
        }
      } else if ((window as any).electronAPI) {
        // Fallback to electronAPI
        console.log('Using window.electronAPI fallback');
        await (window as any).electronAPI.storeCredentials('IBKR', ibkrUsername, ibkrPassword);
        setIbkrMessage('IBKR credentials saved successfully!');
        setIbkrConfigured(true);
        setIbkrUsername(''); // Clear fields after save
        setIbkrPassword('');
      } else {
        setIbkrMessage('Error: No credential API available. Check console for details.');
        console.error('Neither window.credentials nor window.electronAPI is available');
      }
    } catch (error: any) {
      console.error('Error saving IBKR credentials:', error);
      setIbkrMessage(`Error saving IBKR credentials: ${error.message}`);
      setIbkrConfigured(false);
    }
  };

  const handleSaveSchwab = async () => {
    setSchwabMessage('');
    
    // Check if running in Electron environment
    if (!isElectron) {
      setSchwabMessage('Credential management is only available in the Electron app version.');
      return;
    }
    
    if (!schwabAppKey || !schwabAppSecret) {
      setSchwabMessage('Schwab App Key and App Secret are required.');
      return;
    }
    
    try {
      if ((window as any).credentials) {
        // Use new credentials API
        console.log('Using window.credentials API for Schwab');
      const saveKeyResult = await (window as any).credentials.save('schwab', 'appKey', schwabAppKey);
      const saveSecretResult = await (window as any).credentials.save('schwab', 'appSecret', schwabAppSecret);

      if (saveKeyResult?.success && saveSecretResult?.success) {
        setSchwabMessage('Schwab credentials saved successfully!');
        setSchwabConfigured(true);
        setSchwabAppKey(''); // Clear fields
        setSchwabAppSecret('');
      } else {
        const errorMsg = saveKeyResult?.error || saveSecretResult?.error || 'Failed to save Schwab credentials.';
        setSchwabMessage(`Error: ${errorMsg}`);
        setSchwabConfigured(false);
        }
      } else if ((window as any).electronAPI) {
        // Fallback to electronAPI - we'll store as username/password format
        console.log('Using window.electronAPI fallback for Schwab');
        await (window as any).electronAPI.storeCredentials('Schwab', schwabAppKey, schwabAppSecret);
        setSchwabMessage('Schwab credentials saved successfully!');
        setSchwabConfigured(true);
        setSchwabAppKey(''); // Clear fields
        setSchwabAppSecret('');
      } else {
        setSchwabMessage('Error: No credential API available. Check console for details.');
        console.error('Neither window.credentials nor window.electronAPI is available');
      }
    } catch (error: any) {
      console.error('Error saving Schwab credentials:', error);
      setSchwabMessage(`Error saving Schwab credentials: ${error.message}`);
      setSchwabConfigured(false);
    }
  };
  
  // Basic styling - replace with your project's UI components or Tailwind classes
  const inputStyle = { padding: '8px', margin: '5px 0 10px 0', border: '1px solid #ccc', borderRadius: '4px', width: 'calc(100% - 18px)' };
  const buttonStyle = { padding: '10px 15px', margin: '10px 5px 0 0', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' };
  const sectionStyle = { border: '1px solid #eee', padding: '20px', marginBottom: '20px', borderRadius: '8px' };
  const messageStyle = { marginTop: '10px', padding: '10px', borderRadius: '4px' };
  const successMessageStyle = { ...messageStyle, backgroundColor: '#d4edda', color: '#155724' };
  const errorMessageStyle = { ...messageStyle, backgroundColor: '#f8d7da', color: '#721c24' };
  const statusStyle = { marginBottom: '10px', fontWeight: 'bold' };

  return (
    <div>
      <h2>Broker API Credentials</h2>
      
      {!isElectron && (
        <div style={{...messageStyle, backgroundColor: '#fff3cd', color: '#856404', marginBottom: '20px'}}>
          <strong>Note:</strong> Credential management is only available when running the Electron desktop app. 
          The IBKR connection features require the desktop version.
        </div>
      )}

      {/* IBKR Section */}
      <div style={sectionStyle}>
        <h3>Interactive Brokers</h3>
        <div style={statusStyle}>
          Status: {ibkrConfigured ? <span style={{color: 'green'}}>Configured</span> : <span style={{color: 'red'}}>Not Configured</span>}
        </div>
        <div>
          <label htmlFor="ibkrUsername">IBKR Username:</label>
          <input
            id="ibkrUsername"
            type="text"
            value={ibkrUsername}
            onChange={(e) => setIbkrUsername(e.target.value)}
            style={{...inputStyle, opacity: isElectron ? 1 : 0.6}}
            autoComplete="username"
            disabled={!isElectron}
          />
        </div>
        <div>
          <label htmlFor="ibkrPassword">IBKR Password:</label>
          <input
            id="ibkrPassword"
            type="password"
            value={ibkrPassword}
            onChange={(e) => setIbkrPassword(e.target.value)}
            style={{...inputStyle, opacity: isElectron ? 1 : 0.6}}
            autoComplete="current-password"
            disabled={!isElectron}
          />
        </div>
        <button 
          onClick={handleSaveIbkr} 
          style={{...buttonStyle, opacity: isElectron ? 1 : 0.6}}
          disabled={!isElectron}
        >
          Save IBKR Credentials
        </button>
        {ibkrMessage && (
          <div style={ibkrMessage.startsWith('Error:') ? errorMessageStyle : successMessageStyle}>
            {ibkrMessage}
          </div>
        )}
      </div>

      {/* Schwab Section */}
      <div style={sectionStyle}>
        <h3>Charles Schwab</h3>
         <div style={statusStyle}>
          Status: {schwabConfigured ? <span style={{color: 'green'}}>Configured</span> : <span style={{color: 'red'}}>Not Configured</span>}
        </div>
        <div>
          <label htmlFor="schwabAppKey">Schwab App Key:</label>
          <input
            id="schwabAppKey"
            type="text"
            value={schwabAppKey}
            onChange={(e) => setSchwabAppKey(e.target.value)}
            style={{...inputStyle, opacity: isElectron ? 1 : 0.6}}
            autoComplete="username"
            disabled={!isElectron}
          />
        </div>
        <div>
          <label htmlFor="schwabAppSecret">Schwab App Secret:</label>
          <input
            id="schwabAppSecret"
            type="password"
            value={schwabAppSecret}
            onChange={(e) => setSchwabAppSecret(e.target.value)}
            style={{...inputStyle, opacity: isElectron ? 1 : 0.6}}
            autoComplete="current-password"
            disabled={!isElectron}
          />
        </div>
        <button 
          onClick={handleSaveSchwab} 
          style={{...buttonStyle, opacity: isElectron ? 1 : 0.6}}
          disabled={!isElectron}
        >
          Save Schwab Credentials
        </button>
        {schwabMessage && (
          <div style={schwabMessage.startsWith('Error:') ? errorMessageStyle : successMessageStyle}>
            {schwabMessage}
          </div>
        )}
      </div>
    </div>
  );
};

export default BrokerCredentialsForm; 
 
 
 
 
 