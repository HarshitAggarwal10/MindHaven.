# MindHaven

MindHaven is a mental-wellness application with a Next.js frontend and a Django REST backend. It includes account and diary experiences, community discovery, member identity choices, and realtime community chat with message reactions.

## Project layout

```text
MindHaven/
├── backend/   Django API, database models, migrations, and WebSocket chat
└── frontend/  Next.js application
```

The frontend and backend run as separate development servers:

- Frontend: <http://localhost:3000>
- Backend API: <http://localhost:8000>

## Prerequisites

Install these before setting up the project:

- Git
- Node.js 20.9 or newer and npm
- Python 3.10 or newer
- PostgreSQL for the frontend's account database
- A Firebase Admin service-account JSON file for backend Firebase token verification

The Django backend uses SQLite by default for its application data. PostgreSQL can optionally be used for the backend as well. The frontend account API uses PostgreSQL independently and creates its `users` table when first used.

## 1. Get the source code

```bash
git clone https://github.com/HarshitAggarwal10/MindHaven..git
cd MindHaven
```

## 2. Configure the backend

Open a terminal in the repository root and create a virtual environment:

### Windows PowerShell

```powershell
cd backend
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

If PowerShell prevents virtual-environment activation, either allow activation for the current terminal with your organization's approved policy or run the interpreter directly as `.\.venv\Scripts\python.exe`.

### macOS or Linux

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
```

Create `backend/.env` (do not commit it) with development-specific values:

```dotenv
SECRET_KEY=replace-with-a-long-random-django-secret
DEBUG=True
USE_SQLITE=true
FERNET_KEY=replace-with-a-generated-fernet-key
JWT_SECRET=replace-with-a-long-random-jwt-secret
```

Generate a Fernet key in the activated backend environment:

```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Copy the generated value into `FERNET_KEY`. Keep all secret values private and use different strong values outside local development.

The backend loads Firebase Admin credentials from `backend/firebase_service_account.json`. Obtain a service-account file for the appropriate Firebase project and place it at that exact path. Do not commit or share the service-account file. Firebase credentials are separate from the frontend Firebase client configuration.

### Optional: use PostgreSQL for the Django backend

The backend defaults to SQLite and writes its database to `backend/db.sqlite3`. To use PostgreSQL instead, create a PostgreSQL database and update `backend/.env`:

```dotenv
USE_SQLITE=false
DB_NAME=mindhaven
DB_USER=your_database_user
DB_PASS=your_database_password
DB_HOST=localhost
DB_PORT=5432
```

## 3. Set up backend data and communities

With the virtual environment active and the terminal in `backend/`, run:

```bash
python manage.py migrate
python manage.py seed_communities
python manage.py check
```

`seed_communities` can be run again safely; existing communities are left in place.

## 4. Configure the frontend database and API

The frontend's account API stores users in PostgreSQL. Start PostgreSQL and create a database named `mindhaven` (or choose another name and use it consistently in the connection settings).

For example, from a PostgreSQL shell:

```sql
CREATE DATABASE mindhaven;
```

Create `frontend/.env.local` (do not commit it):

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
DATABASE_URL=postgresql://YOUR_POSTGRES_USER:YOUR_POSTGRES_PASSWORD@localhost:5432/mindhaven
JWT_SECRET=replace-with-a-long-random-jwt-secret
```

Alternatively, configure the PostgreSQL connection with `PGHOST`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`, and `PGPORT` instead of `DATABASE_URL`. The frontend creates its account `users` table automatically when the signup/login API is first used.

If you use Firebase-backed frontend features, configure the client with the Firebase project settings appropriate to your own project. Never put Firebase Admin credentials or private service-account keys in frontend files or public environment variables.

Install frontend dependencies from the lockfile:

```bash
cd frontend
npm ci
```

## 5. Run the application locally

Run the backend in one terminal:

```bash
cd backend
```

Activate its virtual environment if it is not already active, then start Django:

```bash
python manage.py runserver 8000
```

Run the frontend in a second terminal:

```bash
cd frontend
npm run dev
```

Open <http://localhost:3000>. Keep both servers running while using the application. Local development uses Django Channels' in-memory channel layer; it does not require Redis.

## Useful commands

### Backend

Run tests and checks from `backend/`:

```bash
python manage.py test
python manage.py check
python manage.py showmigrations
```

After changing Django models, create and apply migrations:

```bash
python manage.py makemigrations
python manage.py migrate
```

### Frontend

Run these from `frontend/`:

```bash
npm run lint
npm run build
npm start
```

`npm start` serves the production build, so run `npm run build` first.

## Realtime chat in production

For a non-debug deployment, configure `DEBUG=False` and set `REDIS_URL` to a reachable Redis instance. Django Channels uses Redis as its production channel layer. Also configure production-safe Django hosts, HTTPS, strong secrets, database settings, and the correct frontend API URL before exposing the application publicly.

## Troubleshooting

- **Backend cannot start because Firebase credentials are missing:** verify that `backend/firebase_service_account.json` exists and is a valid Firebase Admin service-account JSON file.
- **Frontend signup/login cannot connect to PostgreSQL:** confirm PostgreSQL is running, the `mindhaven` database exists, the credentials in `frontend/.env.local` are correct, and restart the Next.js server after editing environment variables.
- **A community list is empty:** run `python manage.py seed_communities` from `backend/`.
- **Community API requests fail:** make sure the backend is running at the URL in `NEXT_PUBLIC_API_BASE_URL`, and sign in before opening member-only community pages.
- **WebSocket chat is disconnected:** confirm the backend is running through its ASGI-capable Django setup and the frontend API base URL points to that backend. For production, ensure the Redis channel layer and WebSocket proxy are configured.

## Security and local files

Do not commit `.env` files, database files, Firebase service-account credentials, or other secrets. Local configuration and databases should be created separately on each machine.
