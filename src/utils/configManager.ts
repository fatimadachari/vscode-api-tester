import * as vscode from 'vscode';

const BASE_URL_KEY = 'apiTester.baseUrl';

export async function getBaseUrl(): Promise<string | undefined> {
  const config = vscode.workspace.getConfiguration();
  return config.get<string>(BASE_URL_KEY);
}

export async function setBaseUrl(url: string): Promise<void> {
  const config = vscode.workspace.getConfiguration();
  await config.update(BASE_URL_KEY, url, vscode.ConfigurationTarget.Workspace);
}

export async function promptForBaseUrl(): Promise<string | undefined> {
  const current = await getBaseUrl();
  
  const url = await vscode.window.showInputBox({
    prompt: 'Enter API base URL',
    value: current || 'http://localhost:3000',
    placeHolder: 'http://localhost:3000'
  });

  if (url) {
    await setBaseUrl(url);
  }

  return url;
}