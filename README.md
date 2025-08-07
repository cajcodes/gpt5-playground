# GPT-5 Playground

This project is a simple chat application that uses a FastAPI backend and a Next.js frontend to interact with OpenAI's chat completion models.

## Getting Started

### Prerequisites

- Python 3.8+
- Node.js 18.17+
- An OpenAI API key

### Backend Setup

1.  **Create and activate a virtual environment:**
    ```bash
    python3 -m venv .venv
    source .venv/bin/activate
    ```

2.  **Install Python dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

3.  **Set up environment variables:**
    Copy the example `.env` file and add your OpenAI API key.
    ```bash
    cp .env.example .env
    ```
    Then, open `.env` and add your key:
    ```
    OPENAI_API_KEY=sk-...
    ```

### Frontend Setup

1.  **Install Node.js dependencies:**
    ```bash
    cd frontend
    npm install
    ```

## Running the Application

### All-in-One (Recommended)

To run both the backend and frontend servers concurrently, use the following command from the project root:

```bash
make dev
```

The backend will be available at `http://localhost:8000` and the frontend at `http://localhost:3000`.

### Running Separately

**Backend:**
```bash
make run
```

**Frontend:**
```bash
cd frontend
npm run dev
```

