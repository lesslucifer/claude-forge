import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { SidebarProvider } from './SidebarProvider';
import ignore, { Ignore } from 'ignore';

export function activate(context: vscode.ExtensionContext) {
  const sidebarProvider = new SidebarProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("claudeForge.sidebarView", sidebarProvider)
  );

  let indexProjectCommand = vscode.commands.registerCommand('claudeForge.indexProject', () => {
    indexProject();
  });

  let configureCommand = vscode.commands.registerCommand('claudeForge.configure', () => {
    vscode.commands.executeCommand('workbench.action.openSettings', 'claudeForge.apiKey');
  });

  context.subscriptions.push(indexProjectCommand, configureCommand);
}

async function indexProject() {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    vscode.window.showErrorMessage('No workspace folder open');
    return;
  }

  const rootPath = workspaceFolders[0].uri.fsPath;
  const gitignorePath = path.join(rootPath, '.gitignore');
  
  let ignoreFilter = ignore();
  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    ignoreFilter = ignore().add(gitignoreContent);
  }

  const files = await getAllFiles(rootPath, ignoreFilter);
  
  const indexData = files.join('\n');
  fs.writeFileSync(path.join(rootPath, '.claude-forge.txt'), indexData);

  vscode.window.showInformationMessage('Project indexed successfully');
}

async function getAllFiles(dir: string, ignoreFilter: Ignore): Promise<string[]> {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const res = path.resolve(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('.')) {
      return getAllFiles(res, ignoreFilter);
    } else if (!ignoreFilter.ignores(path.relative(dir, res))) {
      return res;
    }
    return [];
  }));
  return files.flat();
}

export function deactivate() {}