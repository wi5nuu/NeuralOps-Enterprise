.PHONY: dev seed test migrate build clean

dev:
	docker-compose up --build -d

dev-backend:
	cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000

dev-frontend:
	cd frontend && npm run dev

seed:
	cd backend && python seed.py

migrate:
	cd backend && alembic upgrade head

test:
	cd backend && python -m pytest tests/ -v

build:
	docker-compose build

clean:
	docker-compose down -v

logs:
	docker-compose logs -f
