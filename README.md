# API Route Tester para VSCode

Teste suas rotas de API NestJS diretamente no VSCode com uma interface visual bonita.

## Funcionalidades

- 🔍 **Detecção automática de rotas NestJS** - Escaneia automaticamente arquivos `.controller.ts`
- 📁 **Sidebar organizada** - Rotas agrupadas por módulo/recurso
- 🔐 **Suporte a autenticação** - Bearer Token e API Key personalizada
- 🌐 **Configuração de URL base** - Configure uma vez, use em todos os requests
- 📝 **Editor visual de requests** - Interface com abas para Params, Headers e Body
- 📊 **Respostas formatadas** - JSON com syntax highlighting e badges de status
- ⚡ **Workflow rápido** - Sem necessidade de alternar para Postman/Insomnia

## Instalação

### A partir do código fonte

1. Clone este repositório:
```bash
git clone https://github.com/SEU_USUARIO/vscode-api-tester.git
cd vscode-api-tester
```

2. Instale as dependências:
```bash
npm install
```

3. Compile:
```bash
npm run compile
```

4. Pressione `F5` para executar a extensão em modo de desenvolvimento

### Via VSIX (em breve)

Após publicação no VSCode Marketplace, será possível instalar diretamente pela view de Extensões.

## Como Usar

### 1. Abra seu projeto NestJS

A extensão ativa automaticamente quando detecta arquivos `.controller.ts` no seu workspace.

### 2. Configure a URL Base

Clique no ícone 🔗 (link) na sidebar do API Tester e defina a URL base da sua API:
```
http://localhost:3000
```

### 3. Configure Autenticação (opcional)

Clique no ícone 🔑 (chave) para configurar autenticação:
- **Bearer Token** - para APIs baseadas em JWT
- **API Key** - para autenticação com header personalizado

### 4. Envie requests

Clique em qualquer rota na sidebar para abrir o painel de request. A interface visual permite:
- Adicionar query parameters dinamicamente
- Definir headers personalizados (formato JSON)
- Adicionar body no request (formato JSON) para POST/PUT/PATCH
- Visualizar respostas formatadas com códigos de status

### 5. Atualize as rotas

Clique no ícone 🔄 (refresh) para re-escanear seu projeto em busca de novas rotas.

## Organização da Sidebar

As rotas são automaticamente agrupadas pelo primeiro segmento do path:

```
📁 auth (3)
  ├─ GET /auth/profile
  ├─ POST /auth/login
  └─ POST /auth/register
📁 users (4)
  ├─ GET /users
  ├─ GET /users/:id
  ├─ POST /users
  └─ DELETE /users/:id
```

## Detecção de Rotas

A extensão detecta rotas NestJS através dos decorators:

```typescript
@Controller('users')
export class UsersController {
  @Get()
  findAll() { ... }
  
  @Post()
  create() { ... }
  
  @Get(':id')
  findOne() { ... }
}
```

Rotas detectadas:
- `GET /users`
- `POST /users`
- `GET /users/:id`

## Interface de Request

### Aba Params
Adicione query parameters dinamicamente:
- Clique em "+ Add Parameter"
- Preencha Key e Value
- Remove parâmetros indesejados

### Aba Headers
Adicione headers personalizados em formato JSON:
```json
{
  "Authorization": "Bearer seu-token",
  "X-Custom-Header": "valor"
}
```

### Aba Body
Para requests POST/PUT/PATCH, adicione o body em formato JSON:
```json
{
  "name": "João Silva",
  "email": "joao@exemplo.com",
  "age": 30
}
```

## Resposta

A resposta é exibida com:
- **Status badge** - Verde para sucesso (2xx), vermelho para erro
- **JSON formatado** - Syntax highlighting e indentação
- **Mensagens de erro** - Exibidas claramente quando o request falha

## Configurações

As configurações são salvas no workspace:

- `apiTester.baseUrl` - URL base para requests
- `apiTester.auth` - Configuração de autenticação

Você pode editá-las manualmente em `.vscode/settings.json` se preferir:

```json
{
  "apiTester.baseUrl": "http://localhost:3000",
  "apiTester.auth": {
    "type": "bearer",
    "token": "seu-token-aqui"
  }
}
```

## Requisitos

- VSCode 1.85.0 ou superior
- Projeto NestJS com arquivos `.controller.ts`

## Tecnologias

- TypeScript
- VSCode Extension API
- Axios (HTTP client)
- HTML/CSS/JavaScript (Webview UI)

---

⭐ Se você achou útil, deixe uma estrela no repositório!
