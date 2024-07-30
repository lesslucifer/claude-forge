import * as vscode from 'vscode';
import { getUri } from "../utilities/getUri";
import { getNonce } from "../utilities/getNonce";
import { indexProject } from '../servs/projectIndex';
import * as path from 'path';
import { parseFileOperation } from '../servs/messageHandler';

const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'dev';

interface File {
  path: string;
  language: string;
  linesOfCode: number;
}

export class SidebarProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) { }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this._extensionUri, "out"),
        vscode.Uri.joinPath(this._extensionUri, "webview-ui/build"),
        ...(isDevelopment ? [vscode.Uri.parse("http://localhost:3000/")] : [])
      ],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    this._setWebviewMessageListener(webviewView.webview);
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const stylesUri = isDevelopment
    ? "http://localhost:3000/static/css/main.css"
    : getUri(webview, this._extensionUri, [
      "webview-ui",
      "build",
      "static",
      "css",
      "main.css",
    ]);

    const scriptUri = isDevelopment
      ? "http://localhost:3000/static/js/bundle.js"
      : getUri(webview, this._extensionUri, [
      "webview-ui",
      "build",
      "static",
      "js",
      "main.js",
    ]);

    const nonce = getNonce();

    return `<!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width,initial-scale=1,shrink-to-fit=no">
          <meta name="theme-color" content="#000000">
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline' ${
          isDevelopment ? 'http://localhost:3000' : ''
        }; script-src 'nonce-${nonce}' ${isDevelopment ? 'http://localhost:3000' : ''};">
          <link rel="stylesheet" type="text/css" href="${stylesUri}">
          <title>ClaudeForge</title>
        </head>
        <body>
          <noscript>You need to enable JavaScript to run this app.</noscript>
          <div id="root"></div>
          <script nonce="${nonce}" src="${scriptUri}"></script>
        </body>
      </html>`;
  }

  private _setWebviewMessageListener(webview: vscode.Webview) {
    webview.onDidReceiveMessage(
      async (message: any) => {
        switch (message.type) {
          case "loadFileIndex":
            await this._handleLoadFileIndex(webview);
            return;
          case "indexProject":
            await this._handleIndexProject(webview);
            return;
          case 'sendMessage':
            await this._handleSendMessage(webview, message.message);
            return;
        }
      },
      undefined,
      []
    );
  }
  
  private async _handleLoadFileIndex(webview: vscode.Webview) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      webview.postMessage({ type: 'fileIndexError', error: 'No workspace folder open' });
      return;
    }
  
    const rootPath = workspaceFolders[0].uri;
    const indexFilePath = vscode.Uri.joinPath(rootPath, '.claude-forge.txt');
  
    try {
      const indexContent = await vscode.workspace.fs.readFile(indexFilePath);
      const files = this._parseIndexContent(indexContent.toString());
      webview.postMessage({ type: 'fileIndex', files });
    } catch (error: any) {
      webview.postMessage({ type: 'fileIndexError', error: error.message });
    }
  }
  
  private async _handleIndexProject(webview: vscode.Webview) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      webview.postMessage({ type: 'fileIndexError', error: 'No workspace folder open' });
      return;
    }
  
    const rootPath = workspaceFolders[0].uri;
    const indexFilePath = vscode.Uri.joinPath(rootPath, '.claude-forge.txt');
  
    try {
      await indexProject(rootPath, indexFilePath);
  
      // After indexing, read the new index file and send it back
      const newIndexContent = await vscode.workspace.fs.readFile(indexFilePath);
      const newFiles = this._parseIndexContent(newIndexContent.toString());
      webview.postMessage({ type: 'fileIndex', files: newFiles });
    } catch (error: any) {
      webview.postMessage({ type: 'fileIndexError', error: error.message });
    }
  }
  
  private _parseIndexContent(content: string): File[] {
    const fileEntryRegex = /Filename: (.+)\nLanguage: (.+)\nLines of Code: (\d+)(?:\nKeywords: .*)?/g;
    const files: File[] = [];
  
    let match;
    while ((match = fileEntryRegex.exec(content)) !== null) {
      const [, path, language, linesOfCodeString] = match;
      const linesOfCode = parseInt(linesOfCodeString, 10);
  
      if (!isNaN(linesOfCode)) {
        files.push({
          path: path.trim(),
          language: language.trim(),
          linesOfCode
        });
      } else {
        console.warn(`Invalid lines of code for file: ${path}`);
      }
    }
  
    return files;
  }

  private async _handleSendMessage(webview: vscode.Webview, message: string) {
    const fileOperation = parseFileOperation(message);
    if (fileOperation) {
      webview.postMessage({ 
        type: 'response', 
        messageType: 'fileOperation',
        content: fileOperation 
      });
    } else {
      // Process as a regular message
      // This is a placeholder for actual message processing logic
      const response = `Received: ${message}`;
      webview.postMessage({ 
        type: 'response', 
        messageType: 'text',
        content: response 
      });
    }
  }
}