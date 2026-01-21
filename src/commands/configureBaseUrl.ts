import * as vscode from 'vscode';
import { getBaseUrl, setBaseUrl } from '../utils/configManager';

export async function configureBaseUrl() {
  const current = await getBaseUrl();
  
  const action = await vscode.window.showQuickPick([
    { label: '$(link) Set Base URL', value: 'set' },
    { label: '$(edit) Edit Current URL', value: 'edit' },
    { label: '$(trash) Remove Base URL', value: 'remove' },
    { label: '$(eye) Show Current URL', value: 'show' }
  ], {
    placeHolder: current ? `Current: ${current}` : 'No base URL configured'
  });

  if (!action) {
    return;
  }

  switch (action.value) {
    case 'set':
    case 'edit':
      const url = await vscode.window.showInputBox({
        prompt: 'Enter API base URL',
        value: current || 'http://localhost:3000',
        placeHolder: 'http://localhost:3000',
        validateInput: (value) => {
          try {
            new URL(value);
            return null;
          } catch {
            return 'Invalid URL';
          }
        }
      });
      
      if (url) {
        await setBaseUrl(url);
        vscode.window.showInformationMessage(`✓ Base URL set to: ${url}`);
      }
      break;

    case 'remove':
      await setBaseUrl('');
      vscode.window.showInformationMessage('✓ Base URL removed');
      break;

    case 'show':
      if (current) {
        vscode.window.showInformationMessage(`Current base URL: ${current}`);
      } else {
        vscode.window.showInformationMessage('No base URL configured');
      }
      break;
  }
}