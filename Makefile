run:
	source .venv/bin/activate && uvicorn backend.main:app --reload --port 8000

frontend:
	cd frontend && npm run dev

dev:
	make -j2 run frontend
