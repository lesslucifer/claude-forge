import React, { useCallback, useEffect, useState } from 'react';
import './App.css';
import ChatWindow from './ChatWindow';
import FileList from './FileList';
import SettingsView, { ExtensionConfig } from './SettingsView';
import { vscode } from './utilities/vscode';

const App: React.FC = () => {
  const [view, setView] = useState('main');
  const [selectedFiles, setSelectedFiles] = useState(new Set<string>());
  const [messages, setMessages] = useState<any[]>([]);
  const [config, setConfig] = useState<ExtensionConfig>({});

  const handleMessage = useCallback((event: any) => {
    const message = event.data;
    switch (message.type) {
      case 'aiResponse':
        setMessages(messages => [...messages, { sender: 'AI', text: message.message }]);
        break;
      case 'showSettings':
        setView('settings');
        break;
      case 'showMain':
        setView('main');
        break;
      case 'configuration':
        setConfig(message.config);
        break;
      case 'updateSelectedFiles':
        setSelectedFiles(new Set(message.files));
        break;
    }
  }, []);

  useEffect(() => {
    vscode.postMessage({ type: 'getFiles' });
    vscode.postMessage({ type: 'getConfiguration' });

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  const sendMessage = (message: string) => {
    setMessages([...messages, { sender: 'You', text: message }]);
    vscode.postMessage({ type: 'sendMessage', message });
  };

  const updateConfig = (newConfig: ExtensionConfig) => {
    setConfig(newConfig);
    vscode.postMessage({ type: 'updateConfiguration', config: newConfig });
  };

  return (
    <div className="container">
      {view === 'main' && (
        <>
          <details open className="files-section">
            <summary>Files</summary>
            <FileList
              selectedFiles={selectedFiles}
              updateSelectedFiles={setSelectedFiles}
            />
          </details>

          <details className="files-section" open>
            <summary>Chat</summary>
            <ChatWindow messages={messages} sendMessage={sendMessage} />
          </details>

          <button onClick={() => setView('settings')} className="button settings-button">
            Settings
          </button>
        </>
      )}

      {view === 'settings' && (
        <SettingsView
          config={config}
          updateConfig={updateConfig}
          backToMain={() => setView('main')}
        />
      )}
    </div>
  );
};

export default App;