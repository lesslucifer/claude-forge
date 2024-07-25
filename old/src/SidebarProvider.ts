import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { performAIFileSelection } from './aiFileSelector';

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
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case 'getFiles':
          this._sendFileList(webviewView.webview);
          break;
        case 'sendMessage':
          await this._handleUserMessage(data.message, webviewView.webview);
          break;
        case 'openSettings':
          this._showSettingsView(webviewView.webview);
          break;
        case 'backToMain':
          this._showMainView(webviewView.webview);
          break;
        case 'updateConfiguration':
          await this._updateConfiguration(data.config);
          break;
        case 'aiSelectFiles':
          await this._handleAIFileSelection(data.userInput, webviewView.webview);
          break;
        case 'showToast':
          vscode.window.showInformationMessage(data.message);
          break;
        case 'indexProject':
          vscode.commands.executeCommand('claudeForge.indexProject');
          break;
      }
    });
  }

  private async _sendFileList(webview: vscode.Webview) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      console.log('No workspace folders found');
      webview.postMessage({ type: 'fileList', files: [] });
      return;
    }

    const rootPath = workspaceFolders[0].uri.fsPath;
    const indexFilePath = path.join(rootPath, '.claude-forge.txt');

    if (!fs.existsSync(indexFilePath)) {
      console.log('.claude-forge.txt not found');
      webview.postMessage({ type: 'fileList', files: [] });
      return;
    }

    const indexContent = await fs.promises.readFile(indexFilePath, 'utf8');
    const files = indexContent.split('\n\n').map(entry => {
      const lines = entry.split('\n');
      const filename = lines[0].replace('Filename: ', '');
      return { path: filename, language: lines[1].replace('Language: ', '') };
    });

    console.log('Sending file list:', files);
    webview.postMessage({ type: 'fileList', files });
  }

  public refresh() {
    console.log(`[REFRESH]`);
    if (this._view) {
      this._sendFileList(this._view.webview);
    }
  }

  private async _handleUserMessage(message: string, webview: vscode.Webview) {
    // TODO: Implement AI model interaction here
    const response = `AI response to: ${message}`;
    webview.postMessage({ type: 'aiResponse', message: response });
  }

  private async _handleAIFileSelection(userInput: string, webview: vscode.Webview) {
    try {
      const selectedFiles = await performAIFileSelection(userInput);
      webview.postMessage({ type: 'updateSelectedFiles', files: selectedFiles });
    } catch (error) {
      if (error.message === 'Project index not found') {
        const result = await vscode.window.showInformationMessage(
          'Project index not found. Do you want to run the indexing process?',
          'Yes', 'No'
        );
        if (result === 'Yes') {
          vscode.commands.executeCommand('claudeForge.indexProject');
        }
      } else {
        vscode.window.showErrorMessage(`Failed to perform AI file selection: ${error.message}`);
      }
    }
  }

  private _showSettingsView(webview: vscode.Webview) {
    webview.postMessage({ type: 'showSettings' });
    this._sendConfiguration(webview);
  }

  private _showMainView(webview: vscode.Webview) {
    webview.postMessage({ type: 'showMain' });
  }

  private async _sendConfiguration(webview: vscode.Webview) {
    const config = vscode.workspace.getConfiguration('claudeForge');
    const gptApiKey = config.get('gptApiKey', '');
    const geminiApiKey = config.get('geminiApiKey', '');
    const claudeApiKey = config.get('claudeApiKey', '');
    const preferredModelFamily = config.get('preferredModelFamily', 'gpt');
    const defaultTier = config.get('defaultTier', 'fast');

    webview.postMessage({
      type: 'configuration',
      config: {
        gptApiKey,
        geminiApiKey,
        claudeApiKey,
        preferredModelFamily,
        defaultTier
      },
    });
  }

  private async _updateConfiguration(newConfig: any) {
    const config = vscode.workspace.getConfiguration('claudeForge');
    await config.update('gptApiKey', newConfig.gptApiKey, vscode.ConfigurationTarget.Global);
    await config.update('geminiApiKey', newConfig.geminiApiKey, vscode.ConfigurationTarget.Global);
    await config.update('claudeApiKey', newConfig.claudeApiKey, vscode.ConfigurationTarget.Global);
    await config.update('preferredModelFamily', newConfig.preferredModelFamily, vscode.ConfigurationTarget.Global);
    await config.update('defaultTier', newConfig.defaultTier, vscode.ConfigurationTarget.Global);
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));
    const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'styles.css'));
    const reactUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'react.production.min.js'));
    const reactDOMUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'react-dom.production.min.js'));
    const appUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'app.js'));

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ClaudeForge</title>
        <link href="${styleUri}" rel="stylesheet">
    </head>
    <body>
        <div id="root"></div>
        <script src="${reactUri}"></script>
        <script src="${reactDOMUri}"></script>
        <script src="${appUri}"></script>
        <script src="${scriptUri}"></script>
    </body>
    </html>`;
  }
}