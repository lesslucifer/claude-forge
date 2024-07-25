import * as vscode from 'vscode';
import { SidebarProvider } from './panels/SidebarProvider.ts';

export function activate(context: vscode.ExtensionContext) {
  console.log(`Activate ClaudeForge`, context);
  const sidebarProvider = new SidebarProvider(context.extensionUri);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("claudeForge.sidebarView", sidebarProvider)
  );
}