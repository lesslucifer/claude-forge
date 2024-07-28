import React, { useState, useEffect, useCallback } from 'react';
import FileList from './FileList';
import ChatWindow from './ChatWindow';
import SettingsView, { ExtensionConfig } from './SettingsView';
import './App.css'
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

  const sendMessage = (message: any) => {
    setMessages([...messages, { sender: 'You', text: message }]);
    vscode.postMessage({ type: 'sendMessage', message });
  };

  const updateSelectedFiles = (newSelectedFiles: any) => {
    setSelectedFiles(newSelectedFiles);
    vscode.postMessage({ type: 'updateFileList', selectedFiles: Array.from(newSelectedFiles) });
  };

  return (
    <div className="container">
      {view === 'main' ? (
        <>
          <FileList
            selectedFiles={selectedFiles}
            updateSelectedFiles={updateSelectedFiles}
          />
          <ChatWindow
            messages={messages}
            sendMessage={sendMessage}
          />
        </>
      ) : (
        <SettingsView
          config={config}
          updateConfig={(newConfig) => vscode.postMessage({ type: 'updateConfiguration', config: newConfig })}
          backToMain={() => setView('main')}
        />
      )}
    </div>
  );
};

export default App;