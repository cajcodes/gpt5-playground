# GPT‑5 Playground

Streaming chat playground for the GPT‑5 family (gpt-5, gpt-5-mini, gpt-5-nano). Built with FastAPI + Next.js. Features:

- Streaming token output over WebSockets
- Usage + cost meter
- Model selector (gpt‑5 / mini / nano)
- Optional per‑thread memory with summarization
- Markdown rendering with syntax highlighting

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18.17+
- An OpenAI API key

### Backend Setup

1.  Create and activate a virtual environment:
    ```bash
    python3 -m venv .venv
    source .venv/bin/activate
    ```
2.  Install Python dependencies:
    ```bash
    pip install -r requirements.txt
    ```
3.  Set up environment variables:
    ```bash
    echo "OPENAI_API_KEY=sk-...\nOPENAI_MODEL=gpt-5\nPORT=8000" > .env
    ```

### Frontend Setup

```bash
cd frontend
npm install
```

## Run

All-in-one (dev):
```bash
make dev
```

Or separately:
```bash
make run              # backend at http://localhost:8000
cd frontend && npm run dev  # frontend at http://localhost:3000
```

## Pricing (USD per 1K tokens)

| Model       | Prompt | Completion |
| ----------- | ------:| ----------:|
| gpt-5       |  1.25  |      10.00 |
| gpt-5-mini  |  0.25  |       2.00 |
| gpt-5-nano  |  0.05  |       0.40 |

> Update `backend/main.py` `PRICING` if OpenAI publishes new prices.

## Notes

- WebSocket endpoint: `ws://localhost:8000/ws`
- REST streaming endpoint: `POST http://localhost:8000/chat`
- Toggle per-thread memory: `PATCH /toggle_memory` with `{ "thread_id": "..." }`

