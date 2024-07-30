import React, { useCallback, useEffect, useState } from 'react';
import './App.css';
import ChatWindow, { Message, TextMessage, FileOperationMessage } from './ChatWindow';
import FileList from './FileList';
import SettingsView, { ExtensionConfig } from './SettingsView';
import { vscode } from './utilities/vscode';

const App: React.FC = () => {
  const [view, setView] = useState('main');
  const [selectedFiles, setSelectedFiles] = useState(new Set<string>());
  const [messages, setMessages] = useState<Message[]>([]);
  const [config, setConfig] = useState<ExtensionConfig>({});

  const handleMessage = useCallback((event: any) => {
    const message = event.data;
    switch (message.type) {
      case 'response':
        const newMessage: Message = message.messageType === 'text'
          ? {
              sender: 'AI',
              content: message.content,
              type: 'text'
            } as TextMessage
          : {
              sender: 'AI',
              content: message.content,
              type: 'fileOperation'
            } as FileOperationMessage;
        setMessages(prevMessages => [...prevMessages, newMessage]);
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
    const newMessage: TextMessage = {
      sender: 'You',
      content: message,
      type: 'text'
    };
    setMessages(prevMessages => [...prevMessages, newMessage]);
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