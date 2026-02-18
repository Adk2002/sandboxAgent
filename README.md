# 🏗️ Web App Generator — Agent Guide

A Node.js agent that uses the **Claude API** to generate full-stack web applications (Express + Vite/React) from a single text prompt, writes them into the `./testing/` folder, and optionally deploys them to **CodeSandbox**.

---

## Architecture Overview

```
┌──────────────┐     POST /generate      ┌──────────────────┐
│   You / CLI  │ ──────────────────────▶  │   server.ts       │
│  (cURL/HTTP) │                          │   Express server   │
└──────────────┘                          └────────┬───────────┘
                                                   │
                                    ┌──────────────▼──────────────┐
                                    │   agents/webAppAgent.ts      │
                                    │   Sends prompt to Claude API │
                                    │   with system prompt template│
                                    └──────────────┬───────────────┘
                                                   │  Structured JSON
                                    ┌──────────────▼──────────────┐
                                    │   agents/fileWriter.ts       │
                                    │   Writes files to            │
                                    │   ./testing/<appName>/       │
                                    └──────────────┬───────────────┘
                                                   │  (optional)
                                    ┌──────────────▼──────────────┐
                                    │   agents/sandboxRunner.ts    │
                                    │   Deploys to CodeSandbox     │
                                    │   Returns preview URLs       │
                                    └──────────────────────────────┘
```

### Key Files

| File | Purpose |
|------|---------|
| `server.ts` | Express server with `/generate` and `/generate-and-run` endpoints |
| `agents/webAppAgent.ts` | Core agent — sends the user prompt to Claude, parses the structured JSON response |
| `agents/fileWriter.ts` | Takes the parsed JSON and writes every file into `./testing/<appName>/` |
| `agents/sandboxRunner.ts` | Creates a CodeSandbox, uploads all files, installs deps, starts servers |
| `agents/index.ts` | Barrel export for the agents module |
| `templates/systemPrompt.txt` | The system prompt sent to Claude that dictates the JSON output format |
| `.env` | Your API keys (never commit this) |

---

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

All required packages are already in `package.json`:
- `@anthropic-ai/sdk` — Claude API client
- `@codesandbox/sdk` — CodeSandbox API client
- `express` / `dotenv` — Server framework
- `typescript` / `ts-node-dev` — Dev tooling

### 2. Configure API Keys

Copy the example and fill in your keys:

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=3000
CLAUDE_API_KEY=sk-ant-...     # Get from https://console.anthropic.com
SANDBOX_API_KEY=csb_v1_...    # Get from https://codesandbox.io/dashboard/settings
```

### 3. Start the Server

```bash
npm run dev
```

The server starts at `http://localhost:3000`.

---

## How to Use

### Option A — Generate Locally (writes to `./testing/`)

```bash
curl -X POST http://localhost:3000/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Build a todo app with categories and due dates"}'
```

**What happens:**
1. Your prompt is sent to Claude with the system prompt from `templates/systemPrompt.txt`
2. Claude returns a structured JSON with `appName`, `description`, and a `files[]` array
3. The agent writes every file into `./testing/<appName>/` (e.g., `./testing/todo-app/`)
4. You get back the file list and project path

**Response:**
```json
{
  "success": true,
  "appName": "todo-app",
  "description": "A full-stack todo application with categories and due dates",
  "projectPath": "C:\\...\\testing\\todo-app",
  "files": [
    "backend/package.json",
    "backend/index.js",
    "backend/.env.example",
    "frontend/package.json",
    "frontend/vite.config.js",
    "frontend/index.html",
    "frontend/src/main.jsx",
    "frontend/src/App.jsx"
  ]
}
```

### Option B — Generate + Deploy to CodeSandbox

```bash
curl -X POST http://localhost:3000/generate-and-run \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Build a weather dashboard that fetches data from an API"}'
```

This does everything from Option A **plus**:
4. Creates a new CodeSandbox
5. Uploads all files via `batchWrite`
6. Runs `npm install` in both `backend/` and `frontend/`
7. Starts both servers
8. Returns live preview URLs

---

## Running the Generated App Locally

After generation, you can run the app from the `./testing/` folder:

```bash
# Terminal 1 — Backend
cd testing/todo-app/backend
npm install
node index.js
# → Running on http://localhost:5000

# Terminal 2 — Frontend
cd testing/todo-app/frontend
npm install
npm run dev
# → Running on http://localhost:5173 (proxies /api → :5000)
```

---

## How the Agent Works (Deep Dive)

### 1. System Prompt (`templates/systemPrompt.txt`)

This is the most critical piece. It instructs Claude to:
- Return **only** a JSON object (no markdown, no explanation)
- Use the exact schema: `{ appName, description, files: [{ path, content }] }`
- Always include the required files for both backend (Express) and frontend (Vite + React)
- Configure the Vite proxy to forward `/api` requests to the Express backend on port 5000
- Add CORS to Express

### 2. Claude API Call (`agents/webAppAgent.ts`)

```typescript
const message = await client.messages.create({
  model: "claude-sonnet-4-20250514",
  max_tokens: 16000,
  system: systemPrompt,       // ← from templates/systemPrompt.txt
  messages: [{ role: "user", content: userPrompt }],
});
```

- Uses `claude-sonnet-4-20250514` for fast, high-quality code generation
- `max_tokens: 16000` allows generating large multi-file apps
- Includes fallback JSON parsing in case Claude wraps the response in code fences

### 3. File Writing (`agents/fileWriter.ts`)

- Writes into `./testing/<appName>/` — completely separated from the main project
- Creates nested directories automatically (e.g., `frontend/src/`)
- Generates a `_meta.json` with generation timestamp and file count
- Wipes any previous version of the same app name before writing

### 4. CodeSandbox Deployment (`agents/sandboxRunner.ts`)

```
sdk.sandboxes.create()   →  sandbox.connect()   →  client.fs.batchWrite()
                                                  →  client.commands.run("npm install")
                                                  →  client.commands.runBackground("node index.js")
                                                  →  client.ports.getAll()
```

---

## Example Prompts to Try

| Prompt | What You Get |
|--------|-------------|
| `"Build a todo app"` | CRUD todo list with Express API + React UI |
| `"Build a note-taking app with markdown support"` | Notes with markdown preview, Express REST API |
| `"Build a simple blog with posts and comments"` | Blog CRUD, comment system, React frontend |
| `"Build a recipe manager where users can add and search recipes"` | Recipe CRUD with search, categorized view |
| `"Build a real-time chat application"` | WebSocket chat with Express + React |

---

## Project Structure After Generation

```
web-appGenerator/
├── server.ts                  ← Main Express server
├── agents/
│   ├── index.ts               ← Barrel exports
│   ├── webAppAgent.ts         ← Claude API integration
│   ├── fileWriter.ts          ← Writes files to ./testing/
│   └── sandboxRunner.ts       ← CodeSandbox deployment
├── templates/
│   └── systemPrompt.txt       ← System prompt for Claude
├── testing/                   ← Generated apps land here
│   ├── todo-app/
│   │   ├── backend/
│   │   │   ├── package.json
│   │   │   ├── index.js
│   │   │   └── .env.example
│   │   ├── frontend/
│   │   │   ├── package.json
│   │   │   ├── vite.config.js
│   │   │   ├── index.html
│   │   │   └── src/
│   │   │       ├── main.jsx
│   │   │       └── App.jsx
│   │   └── _meta.json
│   └── weather-dashboard/
│       └── ...
├── .env
├── .env.example
├── package.json
└── tsconfig.json
```

---

## Customizing the Agent

### Change the tech stack
Edit `templates/systemPrompt.txt` to swap React for Vue, Express for Fastify, etc.

### Change the Claude model
Edit `agents/webAppAgent.ts` and change the `model` parameter:
- `claude-sonnet-4-20250514` — Fast, great for code (default)
- `claude-opus-4-20250514` — Most capable, slower

### Add database support
Extend the system prompt to include rules about SQLite/PostgreSQL setup and schema files.

### Add authentication
Add a rule in the system prompt: *"Include JWT-based authentication with login/register endpoints."*

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `CLAUDE_API_KEY is not set` | Make sure `.env` exists and has your key |
| `Failed to parse Claude response as JSON` | Claude returned markdown — the agent tries to extract JSON from code fences automatically. If it still fails, check your system prompt. |
| `SANDBOX_API_KEY is not set` | Only needed for `/generate-and-run`. Get a key from CodeSandbox dashboard. |
| Server won't start | Run `npm install` first, ensure Node.js 18+ is installed |
