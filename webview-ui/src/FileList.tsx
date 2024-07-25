import React, { useState } from 'react';

interface FileListProps {
  files: any[];
  selectedFiles: Set<string>;
  updateSelectedFiles: (newSelectedFiles: Set<string>) => void;
}

const FileList: React.FC<FileListProps> = ({ files, selectedFiles, updateSelectedFiles }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const toggleFile = (filePath: string) => {
    const newSelectedFiles = new Set(selectedFiles);
    if (newSelectedFiles.has(filePath)) {
      newSelectedFiles.delete(filePath);
    } else {
      newSelectedFiles.add(filePath);
    }
    updateSelectedFiles(newSelectedFiles);
  };

  const filteredFiles = files.filter(file => 
    file.path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="file-lists">
      <div className="file-list">
        <h3>Selected Files</h3>
        <input
          type="text"
          placeholder="Search files..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {filteredFiles.map(file => (
          <div key={file.path} className="file-item">
            <input
              type="checkbox"
              checked={selectedFiles.has(file.path)}
              onChange={() => toggleFile(file.path)}
            />
            <label>{file.path} ({file.language})</label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileList;