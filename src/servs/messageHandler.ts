interface CreateFileOperation {
    type: 'create';
    filePath: string;
    content: string;
  }
  
  interface UpdateFileOperation {
    type: 'updateFile';
    filePath: string;
    content: string;
  }
  
  interface InsertCodeOperation {
    type: 'insert';
    filePath: string;
    insertionPoint: string;
    code: string;
  }
  
  interface RemoveCodeOperation {
    type: 'remove';
    filePath: string;
    start: string;
    end: string;
  }
  
  interface UpdateCodeOperation {
    type: 'updateCode';
    filePath: string;
    start: string;
    end: string;
    newCode: string;
  }
  
  type FileOperation = CreateFileOperation | UpdateFileOperation | InsertCodeOperation | RemoveCodeOperation | UpdateCodeOperation;
  
  export function parseFileOperation(input: string): FileOperation | null {
    const createFileRegex = /<create_file>\s*<file_path>(.*?)<\/file_path>\s*<content>([\s\S]*?)<\/content>\s*<\/create_file>/;
    const updateFileRegex = /<update_file>\s*<file_path>(.*?)<\/file_path>\s*<content>([\s\S]*?)<\/content>\s*<\/update_file>/;
    const insertCodeRegex = /<insert_code>\s*<file_path>(.*?)<\/file_path>\s*<insertion_point>([\s\S]*?)<\/insertion_point>\s*<code>([\s\S]*?)<\/code>\s*<\/insert_code>/;
    const removeCodeRegex = /<remove_code>\s*<file_path>(.*?)<\/file_path>\s*<start>([\s\S]*?)<\/start>\s*<end>([\s\S]*?)<\/end>\s*<\/remove_code>/;
    const updateCodeRegex = /<update_code>\s*<file_path>(.*?)<\/file_path>\s*<start>([\s\S]*?)<\/start>\s*<end>([\s\S]*?)<\/end>\s*<new_code>([\s\S]*?)<\/new_code>\s*<\/update_code>/;
  
    let match;
  
    if (match = createFileRegex.exec(input)) {
      return {
        type: 'create',
        filePath: match[1],
        content: match[2]
      };
    }
  
    if (match = updateFileRegex.exec(input)) {
      return {
        type: 'updateFile',
        filePath: match[1],
        content: match[2]
      };
    }
  
    if (match = insertCodeRegex.exec(input)) {
      return {
        type: 'insert',
        filePath: match[1],
        insertionPoint: match[2],
        code: match[3]
      };
    }
  
    if (match = removeCodeRegex.exec(input)) {
      return {
        type: 'remove',
        filePath: match[1],
        start: match[2],
        end: match[3]
      };
    }
  
    if (match = updateCodeRegex.exec(input)) {
      return {
        type: 'updateCode',
        filePath: match[1],
        start: match[2],
        end: match[3],
        newCode: match[4]
      };
    }
  
    return null;
  }