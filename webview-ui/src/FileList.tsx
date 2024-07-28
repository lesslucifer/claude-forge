import React, { useState, useEffect, useRef } from 'react';
import { vscode } from './utilities/vscode';
import './FileList.css';

interface File {
  path: string;
  language: string;
  linesOfCode: number;
  keywords: string[];
}

interface FileListProps {
  selectedFiles: Set<string>;
  updateSelectedFiles: (newSelectedFiles: Set<string>) => void;
}

const FileList: React.FC<FileListProps> = ({ selectedFiles, updateSelectedFiles }) => {
  const [allFiles, setAllFiles] = useState<File[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadFileIndex();
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setShowDropdown(false);
    }
  };

  const loadFileIndex = () => {
    vscode.postMessage({ type: 'loadFileIndex' });
  };

  const indexProject = () => {
    setIsIndexing(true);
    vscode.postMessage({ type: 'indexProject' });
  };

  useEffect(() => {
    const messageHandler = (event: MessageEvent) => {
      console.log("Event", event.data)
      const message = event.data;
      switch (message.type) {
        case 'fileIndex':
          setAllFiles(message.files);
          setIsIndexing(false);
          break;
        case 'fileIndexError':
          console.error('Error loading file index:', message.error);
          setIsIndexing(false);
          break;
      }
    };

    window.addEventListener('message', messageHandler);

    return () => {
      window.removeEventListener('message', messageHandler);
    };
  }, []);

  const toggleFile = (filePath: string) => {
    const newSelectedFiles = new Set(selectedFiles);
    if (newSelectedFiles.has(filePath)) {
      newSelectedFiles.delete(filePath);
    } else {
      newSelectedFiles.add(filePath);
    }
    updateSelectedFiles(newSelectedFiles);
  };

  const unselectAllFiles = () => {
    updateSelectedFiles(new Set());
    setShowDropdown(false);
  };

  const toggleShowSelectedOnly = () => {
    setShowSelectedOnly(!showSelectedOnly);
    setShowDropdown(false);
  };

  const filteredFiles = allFiles.filter(file =>
    file.path.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (!showSelectedOnly || selectedFiles.has(file.path))
  );

  const selectedFilesCount = selectedFiles.size;
  const selectedLinesOfCode = allFiles.reduce((sum, file) =>
    selectedFiles.has(file.path) ? sum + file.linesOfCode : sum, 0
  );

  return (
    <div className="file-list">
      <div className="file-list-header">
        <input
          type="text"
          placeholder="Search files..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button className="options-button" onClick={() => setShowDropdown(!showDropdown)}>⋮</button>
        {showDropdown && (
          <div className="dropdown" ref={dropdownRef}>
            <button onClick={toggleShowSelectedOnly}>
              {showSelectedOnly ? '✓ ' : ''}Show selected only
            </button>
            <button onClick={unselectAllFiles}>Unselect all files</button>
          </div>
        )}
      </div>
      <div className="file-list-info">
        {selectedFilesCount} files selected ({selectedLinesOfCode} LOC)
      </div>
      {allFiles.length === 0 ? (
        <div className="index-error">
          <button onClick={indexProject} disabled={isIndexing}>
            {isIndexing ? (
              <>
                <span className="spinner"></span>
                Indexing...
              </>
            ) : (
              'Index Project'
            )}
          </button>
        </div>
      ) : (
        <div className="file-list-content">
          {filteredFiles.map(file => (
            <div
              key={file.path}
              className={`file-item ${selectedFiles.has(file.path) ? 'selected' : ''}`}
              onClick={() => toggleFile(file.path)}
            >
              <input
                type="checkbox"
                checked={selectedFiles.has(file.path)}
                onChange={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFile(file.path);
                }}
              />
              <label>{file.path}</label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileList;