import * as vscode from 'vscode';

export class SidebarProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

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
        case 'indexProject':
          vscode.commands.executeCommand('claudeForge.indexProject');
          break;
        case 'configure':
          vscode.commands.executeCommand('workbench.action.openSettings', 'claudeForge');
          break;
        case 'getConfiguration':
          this._sendConfiguration(webviewView.webview);
          break;
        case 'updateConfiguration':
          await this._updateConfiguration(data.config);
          break;
      }
    });
  }

  private async _sendConfiguration(webview: vscode.Webview) {
    const config = vscode.workspace.getConfiguration('claudeForge');
    const gptApiKey = config.get('gptApiKey', '');
    const geminiApiKey = config.get('geminiApiKey', '');
    const claudeApiKey = config.get('claudeApiKey', '');
    const preferredModelForAnalysis = config.get('preferredModelForAnalysis', 'gpt');
    const defaultModel = config.get('defaultModel', 'gpt-4o-mini');
    const defaultTier = config.get('defaultTier', 'fast');
    
    webview.postMessage({
      type: 'configuration',
      config: {
        gptApiKey,
        geminiApiKey,
        claudeApiKey,
        preferredModelForAnalysis,
        defaultModel,
        defaultTier
      },
    });
  }

  private async _updateConfiguration(newConfig: any) {
    const config = vscode.workspace.getConfiguration('claudeForge');
    await config.update('gptApiKey', newConfig.gptApiKey, vscode.ConfigurationTarget.Global);
    await config.update('geminiApiKey', newConfig.geminiApiKey, vscode.ConfigurationTarget.Global);
    await config.update('claudeApiKey', newConfig.claudeApiKey, vscode.ConfigurationTarget.Global);
    await config.update('preferredModelForAnalysis', newConfig.preferredModelForAnalysis, vscode.ConfigurationTarget.Global);
    await config.update('defaultModel', newConfig.defaultModel, vscode.ConfigurationTarget.Global);
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
        <div class="container">
            <h2>ClaudeForge</h2>
            <button id="indexProject" class="button">Index Project</button>
            <h3>Configuration</h3>
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
              <label for="defaultModel">Default Model:</label>
              <select id="defaultModel" class="select">
                  <option value="claude-3-sonnet-20240229">Claude 3 Sonnet</option>
                  <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
                  <option value="gpt-4">GPT-4</option>
                  <option value="gpt-4o-mini">GPT-4o Mini</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                  <option value="gemini-1.5-flash-latest">Gemini 1.5 Flash</option>
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