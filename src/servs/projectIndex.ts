import * as vscode from 'vscode';
import ignore, { Ignore } from "ignore";
import * as fs from 'fs';
import * as path from 'path';

interface FileInfo {
    path: string;
    language: string;
    linesOfCode: number;
    keywords: string[];
  }
  
  async function getAllFiles(dir: string, rootDir: string, ignoreFilter: Ignore): Promise<FileInfo[]> {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(entries.map(async (entry) => {
      const res = path.resolve(dir, entry.name);
      const relativePath = path.relative(rootDir, res);
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        return getAllFiles(res, rootDir, ignoreFilter);
      } else if (!ignoreFilter.ignores(relativePath)) {
        try {
          return [await processFile(res, relativePath)];
        }
        catch (err) {
          return [];
        }
      }
      return [];
    }));
    return files.flat();
  }
  
  async function processFile(filePath: string, relativePath: string): Promise<FileInfo> {
    console.log(`Processing file`, filePath)
    const content = await fs.promises.readFile(filePath, 'utf8');
    const lines = content.split('\n');
    const linesOfCode = lines.length;
  
    const language = getFileLanguage(filePath);
    const keywords = extractKeywords(content, language);
  
    console.log(`File`, filePath, `LOC`, linesOfCode, 'Lang', language, 'keys', keywords)
  
    return {
      path: relativePath,
      language,
      linesOfCode,
      keywords,
    };
  }
  
  function getFileLanguage(filePath: string): string {
    const extension = path.extname(filePath).toLowerCase();
    const languageMap: { [key: string]: string } = {
      '.js': 'JavaScript',
      '.ts': 'TypeScript',
      '.py': 'Python',
      '.java': 'Java',
      '.cpp': 'C++',
      '.cs': 'C#',
      '.html': 'HTML',
      '.css': 'CSS',
      '.json': 'JSON',
      '.md': 'Markdown',
      '.jsx': 'React JSX',
      '.tsx': 'React TSX',
      // Add more mappings as needed
    };
    return languageMap[extension] || 'Unknown';
  }
  interface Keyword {
    type: string;
    name: string;
  }
  
  export function extractKeywords(content: string, language: string): string[] {
    const keywords: Keyword[] = [];
  
    const patternMap: { [key: string]: { [key: string]: RegExp } } = {
      'JavaScript': {
        'class': /\bclass\s+(\w+)/g,
        'function': /\bfunction\s+(\w+)/g,
        'const': /\bconst\s+(\w+)/g,
        'var': /\bvar\s+(\w+)/g,
        'let': /\blet\s+(\w+)/g,
        'method': /(\w+)\s*:\s*function/g,
        'arrowFunction': /(\w+)\s*=\s*\([^)]*\)\s*=>/g,
      },
      'TypeScript': {
        'class': /\bclass\s+(\w+)/g,
        'interface': /\binterface\s+(\w+)/g,
        'type': /\btype\s+(\w+)/g,
        'enum': /\benum\s+(\w+)/g,
        'function': /\bfunction\s+(\w+)/g,
        'const': /\bconst\s+(\w+)/g,
        'var': /\bvar\s+(\w+)/g,
        'let': /\blet\s+(\w+)/g,
        'method': /(\w+)\s*:\s*function/g,
        'arrowFunction': /(\w+)\s*=\s*\([^)]*\)\s*=>/g,
      },
      'React JSX': {
        'component': /\bconst\s+(\w+)\s*=\s*\(.*?\)\s*=>/g,
        'function': /\bfunction\s+(\w+)/g,
        'class': /\bclass\s+(\w+)\s+extends\s+React\.Component/g,
        'hook': /\bconst\s+\[(\w+),\s*set\w+\]\s*=\s*useState/g,
      },
      'React TSX': {
        'component': /\bconst\s+(\w+):\s*React\.FC/g,
        'function': /\bfunction\s+(\w+)/g,
        'interface': /\binterface\s+(\w+)/g,
        'type': /\btype\s+(\w+)/g,
        'class': /\bclass\s+(\w+)\s+extends\s+React\.Component/g,
        'hook': /\bconst\s+\[(\w+),\s*set\w+\]\s*=\s*useState/g,
      },
      'Python': {
        'class': /\bclass\s+(\w+)/g,
        'function': /\bdef\s+(\w+)/g,
        'global': /^(\w+)\s*=/gm,
      },
      // Add more language patterns as needed
    };
  
    const patterns = patternMap[language] || {};
  
    for (const [type, regex] of Object.entries(patterns)) {
      let match;
      while ((match = regex.exec(content)) !== null) {
        keywords.push({ type, name: match[1] });
      }
    }
  
    // Sort keywords based on priority
    const priorityOrder = [
      'class', 'interface', 'type', 'enum', // Type names
      'function', // Global function names
      'const', // Global constants
      'var', 'let', // Global variables
      'method', 'arrowFunction' // Methods
    ];
  
    keywords.sort((a, b) => {
      const priorityA = priorityOrder.indexOf(a.type);
      const priorityB = priorityOrder.indexOf(b.type);
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      return a.name.localeCompare(b.name);
    });
  
    // Remove duplicates while maintaining order
    const seenKeywords = new Set<string>();
    const uniqueKeywords = keywords.filter(keyword => {
      if (seenKeywords.has(keyword.name)) {
        return false;
      }
      seenKeywords.add(keyword.name);
      return true;
    });
  
    // Return only the names of the first 5 unique keywords
    return uniqueKeywords.slice(0, 5).map(k => k.name);
  }
  
  export async function indexProject(rootPath: vscode.Uri, indexFilePath: vscode.Uri) {
    const gitignorePath = path.join(rootPath.fsPath, '.gitignore');
    
    let ignoreFilter = ignore();
    if (fs.existsSync(gitignorePath)) {
      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
      ignoreFilter = ignore().add(gitignoreContent);
    }
  
    const files = await getAllFiles(rootPath.fsPath, rootPath.fsPath, ignoreFilter);
    
    const indexData = files.map(file => 
      `Filename: ${file.path}\nLanguage: ${file.language}\nLines of Code: ${file.linesOfCode}\nKeywords: ${file.keywords.join(', ')}\n`
    ).join('\n');
    
    fs.writeFileSync(indexFilePath.fsPath, indexData);
    
    vscode.window.showInformationMessage('Project indexed successfully');
  }