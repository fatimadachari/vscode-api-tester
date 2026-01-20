import * as vscode from 'vscode';
import * as fs from 'fs';
import { Route } from '../types/Route';

export async function scanNestRoutes(workspaceRoot: string): Promise<Route[]> {
  const routes: Route[] = [];

  // Busca todos arquivos .controller.ts
  const files = await vscode.workspace.findFiles('**/*.controller.ts', '**/node_modules/**');

  for (const file of files) {
    const content = fs.readFileSync(file.fsPath, 'utf-8');
    const fileRoutes = parseNestController(content, file.fsPath);
    routes.push(...fileRoutes);
  }

  return routes;
}

function parseNestController(content: string, filePath: string): Route[] {
  const routes: Route[] = [];

  // Extrai nome do controller e rota base
  const controllerMatch = content.match(/@Controller\(['"](.*)['"\)]/);
  const basePath = controllerMatch ? controllerMatch[1] : '';
  
  // Extrai nome da classe
  const classMatch = content.match(/export\s+class\s+(\w+)/);
  const controllerName = classMatch ? classMatch[1] : 'Unknown';

  // Detecta métodos HTTP
  const httpMethods = ['Get', 'Post', 'Put', 'Delete', 'Patch'];
  
  for (const method of httpMethods) {
    // Regex: @Get(), @Get('path'), @Get(':id')
    const regex = new RegExp(`@${method}\\((?:['"]([^'"]*)['"\\)])?`, 'g');
    let match;

    while ((match = regex.exec(content)) !== null) {
      const routePath = match[1] || '';
      const fullPath = basePath 
        ? `/${basePath}${routePath ? '/' + routePath : ''}`
        : `/${routePath}`;

      routes.push({
        method: method.toUpperCase(),
        path: fullPath.replace(/\/+/g, '/'), // Remove barras duplicadas
        filePath,
        controllerName
      });
    }
  }

  return routes;
}