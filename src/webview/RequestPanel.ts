import * as vscode from 'vscode';
import { Route } from '../types/Route';
import { getAuthConfig, buildAuthHeaders } from '../utils/tokenManager';
import { getBaseUrl } from '../utils/configManager';
import axios from 'axios';

export class RequestPanel {
  public static currentPanel: RequestPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(extensionUri: vscode.Uri, route: Route) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // Se já existe painel, mostra ele
    if (RequestPanel.currentPanel) {
      RequestPanel.currentPanel._panel.reveal(column);
      RequestPanel.currentPanel._updateForRoute(route);
      return;
    }

    // Cria novo painel
    const panel = vscode.window.createWebviewPanel(
      'apiTesterRequest',
      'API Tester',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'out', 'webview')]
      }
    );

    RequestPanel.currentPanel = new RequestPanel(panel, extensionUri, route);
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, route: Route) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    // Set HTML content
    this._update(route);

    // Handle messages from webview
    this._panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.type) {
          case 'sendRequest':
            await this._handleSendRequest(message.data);
            break;
          case 'ready':
            await this._updateForRoute(route);
            break;
        }
      },
      null,
      this._disposables
    );

    // Cleanup quando fecha
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
  }

  private async _handleSendRequest(data: any) {
    try {
      const { method, url, headers, body, params } = data;

      // Adiciona auth headers
      const auth = await getAuthConfig();
      const authHeaders = buildAuthHeaders(auth);
      const allHeaders = { ...headers, ...authHeaders };

      // Faz request
      const response = await axios({
        method: method.toLowerCase(),
        url,
        headers: allHeaders,
        data: body ? JSON.parse(body) : undefined,
        params,
        timeout: 10000,
        validateStatus: () => true // Aceita qualquer status
      });

      // Envia response de volta pra webview
      this._panel.webview.postMessage({
        type: 'response',
        data: {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          data: response.data,
          time: 0 // TODO: calcular tempo
        }
      });
    } catch (error: any) {
      this._panel.webview.postMessage({
        type: 'error',
        data: {
          message: error.message,
          response: error.response?.data
        }
      });
    }
  }

  private async _updateForRoute(route: Route) {
    const baseUrl = await getBaseUrl();
    const auth = await getAuthConfig();
    const authHeaders = buildAuthHeaders(auth);

    this._panel.webview.postMessage({
      type: 'updateRoute',
      data: {
        method: route.method,
        path: route.path,
        baseUrl: baseUrl || 'http://localhost:3000',
        headers: authHeaders,
        controllerName: route.controllerName
      }
    });
  }

  private _update(route: Route) {
    this._panel.webview.html = this._getHtmlForWebview(route);
  }

private _getHtmlForWebview(route: Route) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Tester</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--vscode-foreground);
      background-color: var(--vscode-editor-background);
      padding: 20px;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--vscode-panel-border);
    }

    .header h1 {
      font-size: 24px;
      margin-bottom: 5px;
    }

    .controller-name {
      color: var(--vscode-descriptionForeground);
      font-size: 14px;
    }

    .request-section {
      background: var(--vscode-input-background);
      border: 1px solid var(--vscode-input-border);
      border-radius: 4px;
      padding: 20px;
      margin-bottom: 20px;
    }

    .form-group {
      margin-bottom: 15px;
    }

    label {
      display: block;
      margin-bottom: 5px;
      font-weight: 600;
      font-size: 13px;
    }

    .url-row {
      display: flex;
      gap: 10px;
    }

    select, input, textarea {
      width: 100%;
      padding: 8px;
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border);
      border-radius: 4px;
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
    }

    select {
      width: 120px;
    }

    input:focus, textarea:focus, select:focus {
      outline: 1px solid var(--vscode-focusBorder);
    }

    textarea {
      font-family: 'Consolas', 'Monaco', monospace;
      min-height: 150px;
      resize: vertical;
    }

    .tabs {
      display: flex;
      gap: 5px;
      margin-bottom: 10px;
      border-bottom: 1px solid var(--vscode-panel-border);
    }

    .tab {
      padding: 8px 16px;
      background: transparent;
      border: none;
      color: var(--vscode-foreground);
      cursor: pointer;
      border-bottom: 2px solid transparent;
      font-size: 13px;
    }

    .tab.active {
      border-bottom-color: var(--vscode-focusBorder);
      color: var(--vscode-focusBorder);
    }

    .tab-content {
      display: none;
    }

    .tab-content.active {
      display: block;
    }

    button {
      padding: 10px 20px;
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
    }

    button:hover {
      background: var(--vscode-button-hoverBackground);
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .button-row {
      display: flex;
      gap: 10px;
      margin-top: 15px;
    }

    .add-param-btn {
      flex: 1;
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
    }

    .add-param-btn:hover {
      background: var(--vscode-button-secondaryHoverBackground);
    }

    .send-btn {
      flex: 1;
      font-size: 16px;
    }

    .response-section {
      background: var(--vscode-input-background);
      border: 1px solid var(--vscode-input-border);
      border-radius: 4px;
      padding: 20px;
      display: none;
    }

    .response-section.visible {
      display: block;
    }

    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 12px;
      margin-bottom: 15px;
    }

    .status-success {
      background: rgba(0, 255, 0, 0.2);
      color: #0f0;
    }

    .status-error {
      background: rgba(255, 0, 0, 0.2);
      color: #f00;
    }

    .response-body {
      background: var(--vscode-editor-background);
      border: 1px solid var(--vscode-input-border);
      border-radius: 4px;
      padding: 15px;
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 13px;
      overflow-x: auto;
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    .error-message {
      color: var(--vscode-errorForeground);
      padding: 10px;
      background: rgba(255, 0, 0, 0.1);
      border-radius: 4px;
      margin-top: 10px;
    }

    .param-row {
      display: flex;
      gap: 10px;
      margin-bottom: 8px;
    }

    .param-row input {
      flex: 1;
    }

    .param-row button {
      padding: 8px 12px;
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>API Request</h1>
      <span class="controller-name" id="controllerName"></span>
    </div>

    <div class="request-section">
      <div class="form-group">
        <label>Request URL</label>
        <div class="url-row">
          <select id="method">
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="PATCH">PATCH</option>
            <option value="DELETE">DELETE</option>
          </select>
          <input type="text" id="url" placeholder="http://localhost:3000/api/users" />
        </div>
      </div>

      <div class="tabs">
        <button class="tab active" data-tab="params">Params</button>
        <button class="tab" data-tab="headers">Headers</button>
        <button class="tab" data-tab="body">Body</button>
      </div>

      <div id="params" class="tab-content active">
        <div id="paramsList"></div>
      </div>

      <div id="headers" class="tab-content">
        <div class="form-group">
          <textarea id="headersJson" placeholder='{"Authorization": "Bearer token"}'></textarea>
        </div>
      </div>

      <div id="body" class="tab-content">
        <div class="form-group">
          <textarea id="bodyJson" placeholder='{"name": "John", "email": "john@example.com"}'></textarea>
        </div>
      </div>

      <div class="button-row">
        <button class="add-param-btn" onclick="addParam()">+ Add Parameter</button>
        <button class="send-btn" onclick="sendRequest()">Send Request</button>
      </div>
    </div>

    <div class="response-section" id="responseSection">
      <h2>Response</h2>
      <div id="statusBadge"></div>
      <div class="response-body" id="responseBody"></div>
      <div class="error-message" id="errorMessage" style="display: none;"></div>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    let currentParams = [];

    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const targetTab = tab.dataset.tab;
        
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        tab.classList.add('active');
        document.getElementById(targetTab).classList.add('active');
      });
    });

    // Params management
    function addParam() {
      const paramsList = document.getElementById('paramsList');
      const row = document.createElement('div');
      row.className = 'param-row';
      row.innerHTML = \`
        <input type="text" placeholder="Key" class="param-key" />
        <input type="text" placeholder="Value" class="param-value" />
        <button onclick="this.parentElement.remove()">Remove</button>
      \`;
      paramsList.appendChild(row);
    }

    function getParams() {
      const params = {};
      document.querySelectorAll('.param-row').forEach(row => {
        const key = row.querySelector('.param-key').value;
        const value = row.querySelector('.param-value').value;
        if (key && value) {
          params[key] = value;
        }
      });
      return params;
    }

    function sendRequest() {
      const method = document.getElementById('method').value;
      const url = document.getElementById('url').value;
      const headersText = document.getElementById('headersJson').value;
      const bodyText = document.getElementById('bodyJson').value;
      const params = getParams();

      let headers = {};
      if (headersText) {
        try {
          headers = JSON.parse(headersText);
        } catch (e) {
          alert('Invalid JSON in headers');
          return;
        }
      }

      if (bodyText && ['POST', 'PUT', 'PATCH'].includes(method)) {
        try {
          JSON.parse(bodyText);
        } catch (e) {
          alert('Invalid JSON in body');
          return;
        }
      }

      document.querySelector('.send-btn').disabled = true;
      document.querySelector('.send-btn').textContent = 'Sending...';

      vscode.postMessage({
        type: 'sendRequest',
        data: { method, url, headers, body: bodyText, params }
      });
    }

    // Handle messages from extension
    window.addEventListener('message', event => {
      const message = event.data;

      switch (message.type) {
        case 'updateRoute':
          const { method, path, baseUrl, headers, controllerName } = message.data;
          document.getElementById('method').value = method;
          document.getElementById('url').value = baseUrl + path;
          document.getElementById('controllerName').textContent = controllerName || '';
          if (headers && Object.keys(headers).length > 0) {
            document.getElementById('headersJson').value = JSON.stringify(headers, null, 2);
          }
          break;

        case 'response':
          const { status, statusText, data } = message.data;
          const responseSection = document.getElementById('responseSection');
          const statusBadge = document.getElementById('statusBadge');
          const responseBody = document.getElementById('responseBody');
          const errorMessage = document.getElementById('errorMessage');

          responseSection.classList.add('visible');
          errorMessage.style.display = 'none';

          const statusClass = status >= 200 && status < 300 ? 'status-success' : 'status-error';
          statusBadge.className = 'status-badge ' + statusClass;
          statusBadge.textContent = \`\${status} \${statusText}\`;

          responseBody.textContent = JSON.stringify(data, null, 2);

          document.querySelector('.send-btn').disabled = false;
          document.querySelector('.send-btn').textContent = 'Send Request';
          break;

        case 'error':
          const errorMsg = message.data.message;
          document.getElementById('responseSection').classList.add('visible');
          document.getElementById('errorMessage').style.display = 'block';
          document.getElementById('errorMessage').textContent = 'Error: ' + errorMsg;
          
          document.querySelector('.send-btn').disabled = false;
          document.querySelector('.send-btn').textContent = 'Send Request';
          break;
      }
    });

    // Notify extension that webview is ready
    vscode.postMessage({ type: 'ready' });
  </script>
</body>
</html>`;
  }

  public dispose() {
    RequestPanel.currentPanel = undefined;

    this._panel.dispose();

    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }
}