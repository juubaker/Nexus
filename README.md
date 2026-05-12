# Enterprise AI Integration Command Center
### Ollama Edition — v2.0

> **Portfolio project by John Baker** — demonstrating Forward Deployed Engineer skills:
> real-time enterprise integration orchestration, open-source AI agent tool use, and production-grade full-stack architecture.
>
> **100% open source** — no API keys, no cloud LLM costs. Runs entirely on your machine with Ollama.

## What This Demonstrates

| FDE Skill | Implementation |
|---|---|
| Enterprise integration patterns | HCM → CRM → Ticketing sync pipeline |
| Open-source AI agent orchestration | Ollama tool-use with 5 enterprise actions |
| Real-time observability | SSE-driven live audit log and status |
| Error handling & retry | Simulated failures with auto-recovery |
| Customer-facing thinking | Natural language command interface |
| Production mindset | Rate limiting, CORS, Helmet, typed APIs |

## Supported Models

Any Ollama model that supports tool use:

| Model | Pull Command | Notes |
|---|---|---|
| `llama3.1` (recommended) | `ollama pull llama3.1` | Best tool-use quality |
| `qwen2.5` | `ollama pull qwen2.5` | Fast, strong tool use |
| `mistral-nemo` | `ollama pull mistral-nemo` | Lightweight option |
| `llama3.1:70b` | `ollama pull llama3.1:70b` | Best quality, needs 48GB RAM |

## Quick Start

### 1. Install & Start Ollama

```bash
# macOS
brew install ollama
ollama serve

# Linux
curl https://ollama.ai/install.sh | sh
ollama serve

# Pull your model
ollama pull llama3.1
```

### 2. Clone & Install

```bash
git clone https://github.com/juubaker/Nexus.git
cd Nexus

cd backend && npm install
cd ../frontend && npm install
```

### 3. Configure

```bash
cd backend
cp .env.example .env
# Edit .env if you want a different model or non-default Ollama URL
```

### 4. Run

**Terminal 1 — Backend:**
```bash
cd backend && npm run dev
# → http://localhost:3001
# Will print Ollama connection status on startup
```

**Terminal 2 — Frontend:**
```bash
cd frontend && npm run dev
# → http://localhost:5173
```

Or open `enterprise-integration-agent.code-workspace` in VS Code and press **F5**.

## Configuration

| Variable | Default | Description |
|---|---|---|
| `OLLAMA_URL` | `http://localhost:11434` | Ollama server URL |
| `OLLAMA_MODEL` | `llama3.1` | Model name (must support tool use) |
| `PORT` | `3001` | Backend server port |
| `FRONTEND_URL` | `http://localhost:5173` | CORS origin |

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/integrations` | Status of all 3 integration systems |
| POST | `/api/integrations/sync` | Trigger HCM → CRM sync |
| POST | `/api/integrations/inject-error` | Simulate an integration error |
| GET | `/api/llm/health` | Ollama connectivity + model status |
| GET | `/api/hcm/employees` | 50 synthetic HCM employees |
| GET | `/api/crm/contacts` | Synced CRM contacts |
| GET | `/api/tickets` | Open support tickets |
| POST | `/api/tickets/route/:id` | Route a ticket |
| GET | `/api/audit?limit=N` | Audit log |
| GET | `/api/metrics` | Uptime, latency, event counts |
| GET | `/api/events` | SSE real-time stream |
| POST | `/api/agent/query` | Natural language agent command |
| GET | `/health` | Backend health check |

## AI Agent Capabilities

The agent (powered by Ollama tool use) can:

- **`sync_hcm_to_crm`** — Synchronize employee records
- **`route_support_ticket`** — Route tickets by category and priority
- **`get_integration_status`** — Report health of all integrations
- **`validate_employee_benefits`** — Check benefits enrollment issues
- **`get_open_tickets`** — Retrieve and filter the support queue

## Author

**John Baker** — Principal Full-Stack Engineer
14+ years Oracle HCM Cloud · AI Agent Development · Enterprise SaaS

- GitHub: [github.com/juubaker](https://github.com/juubaker)
- LinkedIn: [linkedin.com/in/johnwilliambaker](https://linkedin.com/in/johnwilliambaker)
- Email: johnbakerjobs@gmail.com
