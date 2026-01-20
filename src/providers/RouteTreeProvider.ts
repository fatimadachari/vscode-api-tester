import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export interface Route {
  method: string;
  path: string;
  filePath: string;
}

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
    const routes = await this.scanRoutes(workspaceRoot);

    return routes.map(route => new RouteItem(route));
  }

  private async scanRoutes(workspaceRoot: string): Promise<Route[]> {
    const routes: Route[] = [];
    const apiPath = path.join(workspaceRoot, 'app', 'api');

    if (!fs.existsSync(apiPath)) {
      return routes;
    }

    // Busca todos os arquivos route.ts/js recursivamente
    const files = await vscode.workspace.findFiles('app/api/**/route.{ts,js}');

    for (const file of files) {
      const content = fs.readFileSync(file.fsPath, 'utf-8');
      const relativePath = path.relative(path.join(workspaceRoot, 'app', 'api'), file.fsPath);
      const routePath = '/' + path.dirname(relativePath).replace(/\\/g, '/');

      // Detecta métodos HTTP exportados
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
      
      for (const method of methods) {
        const regex = new RegExp(`export\\s+async\\s+function\\s+${method}`, 'g');
        if (regex.test(content)) {
          routes.push({
            method,
            path: routePath,
            filePath: file.fsPath
          });
        }
      }
    }

    return routes;
  }
}

class RouteItem extends vscode.TreeItem {
  constructor(public readonly route: Route) {
    super(`${route.method} ${route.path}`, vscode.TreeItemCollapsibleState.None);
    
    this.tooltip = route.filePath;
    this.description = route.method;
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