import * as vscode from 'vscode';
import axios from 'axios';
import { Route } from '../types/Route';
import { getAuthConfig, buildAuthHeaders } from '../utils/tokenManager';
import { getBaseUrl, promptForBaseUrl } from '../utils/configManager';

export async function sendRequest(route: Route) {
  if (!route) {
    vscode.window.showErrorMessage('No route selected');
    return;
  }

  // Tenta pegar base URL salva, se não tiver, pede
  let baseUrl = await getBaseUrl();
  
  if (!baseUrl) {
    baseUrl = await promptForBaseUrl();
    if (!baseUrl) {
      return;
    }
  }

  const fullUrl = `${baseUrl}${route.path}`;
  const auth = await getAuthConfig();
  const headers = buildAuthHeaders(auth);

  try {
    vscode.window.showInformationMessage(`Sending ${route.method} request to ${fullUrl}...`);

    const response = await axios({
      method: route.method.toLowerCase(),
      url: fullUrl,
      headers,
      timeout: 10000
    });

    const outputChannel = vscode.window.createOutputChannel('API Tester Response');
    outputChannel.clear();
    outputChannel.appendLine(`${route.method} ${fullUrl}`);
    outputChannel.appendLine(`Controller: ${route.controllerName}`);
    outputChannel.appendLine('');
    outputChannel.appendLine('Headers:');
    Object.entries(headers).forEach(([key, value]) => {
      const displayValue = key.toLowerCase().includes('auth') || key.toLowerCase().includes('key')
        ? `${value.substring(0, 10)}...`
        : value;
      outputChannel.appendLine(`  ${key}: ${displayValue}`);
    });
    outputChannel.appendLine('');
    outputChannel.appendLine(`Status: ${response.status} ${response.statusText}`);
    outputChannel.appendLine('');
    outputChannel.appendLine('Response:');
    outputChannel.appendLine(JSON.stringify(response.data, null, 2));
    outputChannel.show();

    vscode.window.showInformationMessage(`✓ ${response.status} ${response.statusText}`);
  } catch (error: any) {
    const outputChannel = vscode.window.createOutputChannel('API Tester Response');
    outputChannel.clear();
    outputChannel.appendLine(`${route.method} ${fullUrl}`);
    outputChannel.appendLine(`Error: ${error.message}`);
    if (error.response) {
      outputChannel.appendLine(`Status: ${error.response.status}`);
      outputChannel.appendLine(JSON.stringify(error.response.data, null, 2));
    }
    outputChannel.show();

    vscode.window.showErrorMessage(`Request failed: ${error.message}`);
  }
}