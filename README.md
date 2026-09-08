# SignalRate

Telecom intelligence: comparison data, practical telecom/developer/network tools, and reference datasets.

## Setup

1. Copy `backend/.env.example` to `backend/.env`, then run `php artisan key:generate` inside `backend`.
2. Start Docker Desktop and run `docker compose up -d --build`.
3. Run `docker compose exec backend php artisan migrate`.

Frontend: http://localhost:3000. Backend health: http://localhost:8000/up.

## Commands

- `cd frontend && npm run lint && npm run build`
- `cd backend && composer install && php artisan test`
- `docker compose logs -f frontend backend`
