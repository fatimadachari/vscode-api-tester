import * as vscode from 'vscode';
import { Route } from '../types/Route';
import { scanNestRoutes } from '../scanners/nestScanner';

export class RouteTreeProvider implements vscode.TreeDataProvider<RouteItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<RouteItem | undefined | void> = new vscode.EventEmitter<RouteItem | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<RouteItem | undefined | void> = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: RouteItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: RouteItem): Promise<RouteItem[]> {
    if (!vscode.workspace.workspaceFolders) {
      vscode.window.showInformationMessage('No workspace folder open');
      return [];
    }

    const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
    const routes = await scanNestRoutes(workspaceRoot);

    if (routes.length === 0) {
      vscode.window.showInformationMessage('No NestJS routes found');
    }

    return routes.map(route => new RouteItem(route));
  }
}

class RouteItem extends vscode.TreeItem {
  constructor(public readonly route: Route) {
    super(`${route.method} ${route.path}`, vscode.TreeItemCollapsibleState.None);
    
    this.tooltip = `${route.controllerName}\n${route.filePath}`;
    this.description = route.controllerName;
    this.command = {
      command: 'apiTester.sendRequest',
      title: 'Send Request',
      arguments: [route]
    };

    // Ícone baseado no método
    this.iconPath = new vscode.ThemeIcon(
      route.method === 'GET' ? 'arrow-down' :
      route.method === 'POST' ? 'add' :
      route.method === 'PUT' ? 'edit' :
      route.method === 'DELETE' ? 'trash' :
      'symbol-method'
    );
  }
}

export { Route };