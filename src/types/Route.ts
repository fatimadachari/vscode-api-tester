export interface Route {
  method: string;
  path: string;
  filePath: string;
  controllerName?: string;
}

export interface RouteGroup {
  name: string;
  routes: Route[];
}