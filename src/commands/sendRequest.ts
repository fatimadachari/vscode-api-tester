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

  let baseUrl = await getBaseUrl();
  
  if (!baseUrl) {
    baseUrl = await promptForBaseUrl();
    if (!baseUrl) {
      return;
    }
  }

  const auth = await getAuthConfig();
  const headers = buildAuthHeaders(auth);

  // Pedir body se for POST, PUT, PATCH
  let body: any = undefined;
  if (['POST', 'PUT', 'PATCH'].includes(route.method)) {
    const bodyInput = await vscode.window.showInputBox({
      prompt: `Enter JSON body for ${route.method} request (leave empty for no body)`,
      placeHolder: '{"name": "John", "email": "john@example.com"}',
      validateInput: (value) => {
        if (!value) {
          return null; // Empty is valid
        }
        try {
          JSON.parse(value);
          return null;
        } catch {
          return 'Invalid JSON format';
        }
      }
    });

    if (bodyInput === undefined) {
      return; // User cancelled
    }

    if (bodyInput) {
      try {
        body = JSON.parse(bodyInput);
        headers['Content-Type'] = 'application/json';
      } catch {
        vscode.window.showErrorMessage('Invalid JSON body');
        return;
      }
    }
  }

  // Pedir query params (opcional)
  const wantParams = await vscode.window.showQuickPick(['No', 'Yes'], {
    placeHolder: 'Add query parameters?'
  });

  let queryParams: Record<string, string> = {};
  if (wantParams === 'Yes') {
    const paramsInput = await vscode.window.showInputBox({
      prompt: 'Enter query parameters (format: key1=value1&key2=value2)',
      placeHolder: 'page=1&limit=10'
    });

    if (paramsInput) {
      paramsInput.split('&').forEach(param => {
        const [key, value] = param.split('=');
        if (key && value) {
          queryParams[key.trim()] = value.trim();
        }
      });
    }
  }

  // Monta URL com query params
  const fullUrl = `${baseUrl}${route.path}`;
  const urlWithParams = Object.keys(queryParams).length > 0
    ? `${fullUrl}?${new URLSearchParams(queryParams).toString()}`
    : fullUrl;

  try {
    vscode.window.showInformationMessage(`Sending ${route.method} request to ${urlWithParams}...`);

    const response = await axios({
      method: route.method.toLowerCase(),
      url: fullUrl,
      headers,
      data: body,
      params: queryParams,
      timeout: 10000
    });

    const outputChannel = vscode.window.createOutputChannel('API Tester Response');
    outputChannel.clear();
    outputChannel.appendLine(`${route.method} ${urlWithParams}`);
    outputChannel.appendLine(`Controller: ${route.controllerName}`);
    outputChannel.appendLine('');
    
    if (Object.keys(queryParams).length > 0) {
      outputChannel.appendLine('Query Params:');
      Object.entries(queryParams).forEach(([key, value]) => {
        outputChannel.appendLine(`  ${key}: ${value}`);
      });
      outputChannel.appendLine('');
    }

    outputChannel.appendLine('Headers:');
    Object.entries(headers).forEach(([key, value]) => {
      const displayValue = key.toLowerCase().includes('auth') || key.toLowerCase().includes('key')
        ? `${value.substring(0, 10)}...`
        : value;
      outputChannel.appendLine(`  ${key}: ${displayValue}`);
    });
    outputChannel.appendLine('');

    if (body) {
      outputChannel.appendLine('Body:');
      outputChannel.appendLine(JSON.stringify(body, null, 2));
      outputChannel.appendLine('');
    }

    outputChannel.appendLine(`Status: ${response.status} ${response.statusText}`);
    outputChannel.appendLine('');
    outputChannel.appendLine('Response:');
    outputChannel.appendLine(JSON.stringify(response.data, null, 2));
    outputChannel.show();

    vscode.window.showInformationMessage(`✓ ${response.status} ${response.statusText}`);
  } catch (error: any) {
    const outputChannel = vscode.window.createOutputChannel('API Tester Response');
    outputChannel.clear();
    outputChannel.appendLine(`${route.method} ${urlWithParams}`);
    outputChannel.appendLine(`Error: ${error.message}`);
    if (error.response) {
      outputChannel.appendLine(`Status: ${error.response.status}`);
      outputChannel.appendLine('');
      outputChannel.appendLine('Response:');
      outputChannel.appendLine(JSON.stringify(error.response.data, null, 2));
    }
    outputChannel.show();

    vscode.window.showErrorMessage(`Request failed: ${error.message}`);
  }
}