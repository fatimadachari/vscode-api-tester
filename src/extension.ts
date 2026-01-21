import * as vscode from 'vscode';
import { RouteTreeProvider } from './providers/RouteTreeProvider';
import { sendRequest } from './commands/sendRequest';
import { configureAuth } from './commands/configureAuth';
import { configureBaseUrl } from './commands/configureBaseUrl';

export function activate(context: vscode.ExtensionContext) {
  console.log('1. Starting API Tester activation...');

  try {
    console.log('2. Creating RouteTreeProvider...');
    const routeProvider = new RouteTreeProvider();

    console.log('3. Registering TreeDataProvider with ID: apiTester.routesList');
    vscode.window.registerTreeDataProvider('apiTester.routesList', routeProvider);

    console.log('4. Registering refresh command...');
    const refreshCommand = vscode.commands.registerCommand('apiTester.refresh', () => {
      console.log('Refresh command executed');
      routeProvider.refresh();
      vscode.window.showInformationMessage('Routes refreshed!');
    });

    console.log('5. Registering sendRequest command...');
    const sendRequestCommand = vscode.commands.registerCommand(
      'apiTester.sendRequest',
      async (route) => {
        console.log('SendRequest command executed', route);
        await sendRequest(route);
      }
    );

    console.log('6. Registering configureAuth command...');
    const configureAuthCommand = vscode.commands.registerCommand(
      'apiTester.configureAuth',
      async () => {
        console.log('ConfigureAuth command executed');
        await configureAuth();
      }
    );

    console.log('7. Registering configureBaseUrl command...');
    const configureBaseUrlCommand = vscode.commands.registerCommand(
      'apiTester.configureBaseUrl',
      async () => {
        console.log('ConfigureBaseUrl command executed');
        await configureBaseUrl();
      }
    );

    console.log('8. Adding commands to subscriptions...');
    context.subscriptions.push(
      refreshCommand,
      sendRequestCommand,
      configureAuthCommand,
      configureBaseUrlCommand
    );

    console.log('9. ✓ API Tester extension activated successfully!');
  } catch (error) {
    console.error('ERROR during activation:', error);
    vscode.window.showErrorMessage(`API Tester activation failed: ${error}`);
  }
}

export function deactivate() {
  console.log('API Tester extension deactivated');
}