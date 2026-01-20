import * as vscode from 'vscode';
import { AuthConfig } from '../types/AuthConfig';

const CONFIG_KEY = 'apiTester.auth';

export async function getAuthConfig(): Promise<AuthConfig> {
  const config = vscode.workspace.getConfiguration();
  const auth = config.get<AuthConfig>(CONFIG_KEY);
  
  return auth || { type: 'none' };
}

export async function setAuthConfig(auth: AuthConfig): Promise<void> {
  const config = vscode.workspace.getConfiguration();
  await config.update(CONFIG_KEY, auth, vscode.ConfigurationTarget.Workspace);
}

export async function promptForAuth(): Promise<AuthConfig | undefined> {
  // Escolher tipo de auth
  const authType = await vscode.window.showQuickPick([
    { label: 'Bearer Token', value: 'bearer' },
    { label: 'API Key (Custom Header)', value: 'apiKey' },
    { label: 'None', value: 'none' }
  ], {
    placeHolder: 'Select authentication type'
  });

  if (!authType || authType.value === 'none') {
    return { type: 'none' };
  }

  // Pedir token
  const token = await vscode.window.showInputBox({
    prompt: 'Enter your token/API key',
    password: true,
    placeHolder: 'Your token here...'
  });

  if (!token) {
    return undefined;
  }

  if (authType.value === 'apiKey') {
    // Pedir nome do header
    const headerName = await vscode.window.showInputBox({
      prompt: 'Enter header name',
      value: 'X-API-Key',
      placeHolder: 'e.g., X-API-Key, Authorization'
    });

    if (!headerName) {
      return undefined;
    }

    return {
      type: 'apiKey',
      token,
      headerName
    };
  }

  return {
    type: 'bearer',
    token
  };
}

export function buildAuthHeaders(auth: AuthConfig): Record<string, string> {
  if (auth.type === 'none' || !auth.token) {
    return {};
  }

  if (auth.type === 'bearer') {
    return {
      'Authorization': `Bearer ${auth.token}`
    };
  }

  if (auth.type === 'apiKey' && auth.headerName) {
    return {
      [auth.headerName]: auth.token
    };
  }

  return {};
}