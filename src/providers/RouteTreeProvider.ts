import * as vscode from 'vscode';
import { Route, RouteGroup } from '../types/Route';
import { scanNestRoutes } from '../scanners/nestScanner';

export class RouteTreeProvider implements vscode.TreeDataProvider<TreeNode> {
  private _onDidChangeTreeData: vscode.EventEmitter<TreeNode | undefined | void> = new vscode.EventEmitter<TreeNode | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<TreeNode | undefined | void> = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: TreeNode): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: TreeNode): Promise<TreeNode[]> {
    if (!vscode.workspace.workspaceFolders) {
      vscode.window.showInformationMessage('No workspace folder open');
      return [];
    }

    const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
    
    if (!element) {
      const routes = await scanNestRoutes(workspaceRoot);
      
      if (routes.length === 0) {
        vscode.window.showInformationMessage('No NestJS routes found');
        return [];
      }

      const groups = this.groupRoutes(routes);
      return groups.map(group => new GroupNode(group));
    }

    if (element instanceof GroupNode) {
      return element.group.routes.map(route => new RouteNode(route));
    }

    return [];
  }

  private groupRoutes(routes: Route[]): RouteGroup[] {
    const groupMap = new Map<string, Route[]>();

    for (const route of routes) {
      const segments = route.path.split('/').filter(s => s);
      const groupName = segments[0] || 'root';

      if (!groupMap.has(groupName)) {
        groupMap.set(groupName, []);
      }
      groupMap.get(groupName)!.push(route);
    }

    return Array.from(groupMap.entries()).map(([name, routes]) => ({
      name,
      routes: routes.sort((a, b) => {
        if (a.path === b.path) {
          const methodOrder = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
          return methodOrder.indexOf(a.method) - methodOrder.indexOf(b.method);
        }
        return a.path.localeCompare(b.path);
      })
    })).sort((a, b) => a.name.localeCompare(b.name));
  }
}

type TreeNode = GroupNode | RouteNode;

class GroupNode extends vscode.TreeItem {
  constructor(public readonly group: RouteGroup) {
    super(group.name, vscode.TreeItemCollapsibleState.Collapsed);
    
    this.tooltip = `${group.routes.length} route${group.routes.length > 1 ? 's' : ''}`;
    this.description = `${group.routes.length}`;
    this.iconPath = new vscode.ThemeIcon('folder');
    this.contextValue = 'group';
  }
}

class RouteNode extends vscode.TreeItem {
  constructor(public readonly route: Route) {
    super(`${route.method} ${route.path}`, vscode.TreeItemCollapsibleState.None);
    
    this.tooltip = `${route.controllerName}\n${route.filePath}`;
    this.description = route.method;
    this.command = {
      command: 'apiTester.sendRequest',
      title: 'Send Request',
      arguments: [route]
    };

    this.iconPath = new vscode.ThemeIcon(
      route.method === 'GET' ? 'arrow-down' :
      route.method === 'POST' ? 'add' :
      route.method === 'PUT' ? 'edit' :
      route.method === 'DELETE' ? 'trash' :
      route.method === 'PATCH' ? 'symbol-method' :
      'symbol-method'
    );
    
    this.contextValue = 'route';
  }
}

export { Route };