import * as vscode from 'vscode';
import { RouteTreeProvider } from './providers/RouteTreeProvider';
import { sendRequest } from './commands/sendRequest';
import { configureAuth } from './commands/configureAuth';

export function activate(context: vscode.ExtensionContext) {
  console.log('API Tester extension activated!');

  const routeProvider = new RouteTreeProvider();
  vscode.window.registerTreeDataProvider('apiTester.routesList', routeProvider);

  const refreshCommand = vscode.commands.registerCommand('apiTester.refresh', () => {
    routeProvider.refresh();
    vscode.window.showInformationMessage('Routes refreshed!');
  });

  const sendRequestCommand = vscode.commands.registerCommand(
    'apiTester.sendRequest',
    async (route) => {
      await sendRequest(route);
    }
  );

  const configureAuthCommand = vscode.commands.registerCommand(
    'apiTester.configureAuth',
    async () => {
      await configureAuth();
    }
  );

  context.subscriptions.push(refreshCommand, sendRequestCommand, configureAuthCommand);
}

export function deactivate() {}