import React, { useEffect, useRef, useState } from 'react';
import { Input, Button, Space } from 'antd';
import './ChatWindow.css';
import FileOperation from './components/FileOperationMessage';

export interface TextMessage {
  sender: string;
  content: string;
  type: 'text';
}

export interface FileOperationMessage {
  sender: string;
  content: {
    type: string;
    filePath: string;
    content?: string;
    insertionPoint?: string;
    code?: string;
    start?: string;
    end?: string;
    newCode?: string;
  };
  type: 'fileOperation';
}

export type Message = TextMessage | FileOperationMessage;

interface ChatWindowProps {
  messages: Message[];
  sendMessage: (message: string) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, sendMessage }) => {
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      sendMessage(inputMessage);
      setInputMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderMessage = (message: Message, index: number) => {
    if (message.type === 'fileOperation') {
      return (
        <div key={index} className={`chat-message ${message.sender.toLowerCase()}-message file-operation`}>
          <strong>{message.sender}:</strong> 
          <FileOperation operation={message.content} />
        </div>
      );
    } else {
      return (
        <div key={index} className={`chat-message ${message.sender.toLowerCase()}-message`}>
          <strong>{message.sender}:</strong> {message.content}
        </div>
      );
    }
  };

  return (
    <div className="chat-window">
      <div className="chat-messages">
        {messages.map((message, index) => renderMessage(message, index))}
        <div ref={messagesEndRef} />
      </div>
      <div className="input-area">
        <Space.Compact style={{ width: '100%' }}>
          <Input.TextArea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            autoSize={{ minRows: 1, maxRows: 4 }}
          />
          <Button type="primary" onClick={handleSendMessage}>Send</Button>
        </Space.Compact>
      </div>
    </div>
  );
};

export default ChatWindow;