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

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ClaudeForge</title>
        <link href="${styleUri}" rel="stylesheet">
    </head>
    <body>
        <div id="mainView" class="container">
            <div class="header">
                <h2>ClaudeForge</h2>
                <div>
                    <button id="indexButton" class="icon-button">🔄</button>
                    <button id="settingsButton" class="icon-button">⚙️</button>
                </div>
            </div>
            <div class="file-lists">
                <div class="file-list">
                    <h3>Selected Files</h3>
                    <div class="file-list-header">
                        <input type="text" id="selectedFilesSearch" placeholder="Search selected files...">
                        <button id="removeAllSelectedFiles" class="icon-button" title="Remove all selected files">🗑️</button>
                    </div>
                    <div id="selectedFileList" class="file-list-content"></div>
                </div>
                <div class="file-list">
                    <h3>Unselected Files</h3>
                    <input type="text" id="unselectedFilesSearch" placeholder="Search unselected files...">
                    <div id="unselectedFileList" class="file-list-content"></div>
                </div>
            </div>
            <div class="chat-window">
                <div id="chatMessages"></div>
                <div class="input-area">
                    <input type="text" id="userInput" placeholder="Type your message...">
                    <button id="sendMessage" class="button">Send</button>
                    <button id="aiSelectFiles" class="button" title="AI-assisted file selection" disabled>🤖</button>
                </div>
            </div>
        </div>
        <div id="settingsView" class="container" style="display:none;">
            <div class="header">
                <h2>Settings</h2>
                <button id="backButton" class="icon-button">←</button>
            </div>
            <div class="form-group">
                <label for="gptApiKey">GPT API Key:</label>
                <input type="password" id="gptApiKey" class="input">
            </div>
            <div class="form-group">
                <label for="geminiApiKey">Gemini API Key:</label>
                <input type="password" id="geminiApiKey" class="input">
            </div>
            <div class="form-group">
                <label for="claudeApiKey">Claude API Key:</label>
                <input type="password" id="claudeApiKey" class="input">
            </div>
            <div class="form-group">
                <label for="preferredModel">Preferred Model:</label>
                <select id="preferredModel" class="select">
                    <option value="gpt">GPT</option>
                    <option value="gemini">Gemini</option>
                    <option value="claude">Claude</option>
                </select>
            </div>
            <div class="form-group">
                <label for="defaultTier">Default Tier:</label>
                <select id="defaultTier" class="select">
                    <option value="pro">Pro (Tier 1)</option>
                    <option value="fast">Fast (Tier 2)</option>
                </select>
            </div>
            <button id="saveConfig" class="button">Save Configuration</button>
        </div>
        <script src="${scriptUri}"></script>
    </body>
    </html>`;
  }
}