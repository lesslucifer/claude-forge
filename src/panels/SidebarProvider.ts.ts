import * as vscode from 'vscode';
import { getUri } from "../utilities/getUri";
import { getNonce } from "../utilities/getNonce";

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
        vscode.Uri.joinPath(this._extensionUri, "webview-ui/build")
      ],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    this._setWebviewMessageListener(webviewView.webview);
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const stylesUri = getUri(webview, this._extensionUri, [
      "webview-ui",
      "build",
      "static",
      "css",
      "main.css",
    ]);
    const scriptUri = getUri(webview, this._extensionUri, [
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
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
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
      (message: any) => {
        switch (message.command) {
          case "hello":
            vscode.window.showInformationMessage(message.text);
            return;
          case "showAlert":
            vscode.window.showInformationMessage("Hello from the sidebar!");
            return;
        }
      },
      undefined,
      []
    );
  }
}