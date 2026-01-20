import * as vscode from 'vscode';
import { RouteTreeProvider } from './providers/RouteTreeProvider';
import { sendRequest } from './commands/sendRequest';

export function activate(context: vscode.ExtensionContext) {
  console.log('API Tester extension activated!');

  // Tree Provider (sidebar com lista de rotas)
  const routeProvider = new RouteTreeProvider();
  vscode.window.registerTreeDataProvider('apiTester.routesList', routeProvider);

  // Comando: Refresh rotas
  const refreshCommand = vscode.commands.registerCommand('apiTester.refresh', () => {
    routeProvider.refresh();
    vscode.window.showInformationMessage('Routes refreshed!');
  });

  // Comando: Enviar request
  const sendRequestCommand = vscode.commands.registerCommand(
    'apiTester.sendRequest',
    async (route) => {
      await sendRequest(route);
    }
  );

  context.subscriptions.push(refreshCommand, sendRequestCommand);
}

export function deactivate() {}