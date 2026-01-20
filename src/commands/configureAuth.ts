import * as vscode from 'vscode';
import { promptForAuth, setAuthConfig, getAuthConfig } from '../utils/tokenManager';

export async function configureAuth() {
  const currentAuth = await getAuthConfig();
  
  const action = await vscode.window.showQuickPick([
    { label: '$(key) Configure Authentication', value: 'configure' },
    { label: '$(edit) Edit Current Token', value: 'edit' },
    { label: '$(trash) Remove Authentication', value: 'remove' },
    { label: '$(eye) Show Current Config', value: 'show' }
  ], {
    placeHolder: currentAuth.type !== 'none' 
      ? `Current: ${currentAuth.type}` 
      : 'No authentication configured'
  });

  if (!action) {
    return;
  }

  switch (action.value) {
    case 'configure':
    case 'edit':
      const auth = await promptForAuth();
      if (auth) {
        await setAuthConfig(auth);
        vscode.window.showInformationMessage('✓ Authentication configured!');
      }
      break;

    case 'remove':
      await setAuthConfig({ type: 'none' });
      vscode.window.showInformationMessage('✓ Authentication removed');
      break;

    case 'show':
      if (currentAuth.type === 'none') {
        vscode.window.showInformationMessage('No authentication configured');
      } else {
        const maskedToken = currentAuth.token 
          ? `${currentAuth.token.substring(0, 10)}...`
          : 'none';
        
        vscode.window.showInformationMessage(
          `Type: ${currentAuth.type}\nToken: ${maskedToken}${
            currentAuth.headerName ? `\nHeader: ${currentAuth.headerName}` : ''
          }`
        );
      }
      break;
  }
}