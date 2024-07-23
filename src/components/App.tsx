// App.tsx

import React, { useState, useEffect } from 'react';
import FileList from './FileList';
import ChatWindow from './ChatWindow';
import SettingsView, { ExtensionConfig } from './SettingsView';

declare const vscode: any;

const App: React.FC = () => {
  const [view, setView] = useState('main');
  const [files, setFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState(new Set<string>());
  const [messages, setMessages] = useState([]);
  const [config, setConfig] = useState<ExtensionConfig>({});

  useEffect(() => {
    vscode.postMessage({ type: 'getFiles' });
    vscode.postMessage({ type: 'getConfiguration' });

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleMessage = (event) => {
    const message = event.data;
    switch (message.type) {
      case 'fileList':
        setFiles(message.files);
        break;
      case 'aiResponse':
        setMessages([...messages, { sender: 'AI', text: message.message }]);
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
  };

  const sendMessage = (message) => {
    setMessages([...messages, { sender: 'You', text: message }]);
    vscode.postMessage({ type: 'sendMessage', message });
  };

  const updateSelectedFiles = (newSelectedFiles) => {
    setSelectedFiles(newSelectedFiles);
    vscode.postMessage({ type: 'updateFileList', selectedFiles: Array.from(newSelectedFiles) });
  };

  return (
    <div className="container">
      {view === 'main' ? (
        <>
          <FileList
            files={files}
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