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

Copy `backend/.env.example` to `backend/.env` (do not commit it), then set development-specific values:

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

## Private mood check-ins and AI analysis

The dashboard's Mood Tracker supports private, self-reported check-ins, saved history, and statistics. Manual check-ins do not use or send diary text. AI analysis is optional and processes only text a signed-in user enters in the mood panel and explicitly consents to analyze. Saved diary entries are not loaded, decrypted, or transmitted by this feature.

### Local CPU inference (default)

The default provider is `local-transformers`, using the public `j-hartmann/emotion-english-distilroberta-base` model. The seven output labels are anger, disgust, fear, joy, neutral, sadness, and surprise. Inference runs on the Django server CPU; submitted text is not sent to Hugging Face or another inference provider. The server may download the public model files from Hugging Face the first time the model is used, but the submitted text is not part of that download. Model files take several hundred MB, and the model consumes server memory and CPU while loading and analyzing text.

Install the optional packages in the activated backend virtual environment. On Windows or Linux, install the CPU-only PyTorch wheel first so the optional local model does not pull a CUDA build:

```powershell
cd backend
python -m pip install torch --index-url https://download.pytorch.org/whl/cpu
python -m pip install -r requirements-mood-local.txt
```

On macOS, install the optional requirements with `python -m pip install -r requirements-mood-local.txt`; PyTorch provides a CPU build for macOS. Copy `backend/.env.example` to `backend/.env` if you have not already, then use the defaults or set:

```dotenv
MOOD_AI_PROVIDER=local-transformers
MOOD_AI_MODEL_ID=j-hartmann/emotion-english-distilroberta-base
MOOD_AI_LOCAL_FILES_ONLY=false
MOOD_AI_LOCAL_NUM_THREADS=2
```

Restart Django after installing packages or changing environment variables. The first analysis requires network access to fetch public model files and can take longer than later requests; subsequent requests use the cached model. Set `MOOD_AI_LOCAL_CACHE_DIR` to choose a cache location. For an offline server, first download/cache the model while online, then set `MOOD_AI_LOCAL_FILES_ONLY=true`; analysis will fail clearly if the model is not already cached. Keep server CPU and memory limits in mind when deploying. The optional CPU packages are separate from the standard backend requirements.

If the local packages are absent, the configuration endpoint and dashboard explain how to install them. Analysis remains disabled instead of returning a fabricated prediction. The local model-loading and inference errors are surfaced without logging submitted text.

### Hosted inference (optional)

If you prefer hosted inference, Django can call Hugging Face Inference Providers; the browser never receives the provider token. Hosted service availability and billing are controlled by Hugging Face and the selected provider. Review Hugging Face's current [security and privacy information](https://huggingface.co/docs/inference-providers/security), [model availability](https://huggingface.co/models?inference=warm&pipeline_tag=text-classification), [API format](https://huggingface.co/docs/inference-providers/tasks/text-classification), and [billing](https://huggingface.co/docs/inference-providers/pricing). Set these variables privately in `backend/.env`:

```dotenv
MOOD_AI_PROVIDER=hf-inference
MOOD_AI_MODEL_ID=j-hartmann/emotion-english-distilroberta-base
MOOD_AI_MODEL_VERSION=
HUGGINGFACE_API_TOKEN=your-server-side-inference-token
MOOD_AI_TIMEOUT_SECONDS=15
```

Never use a `NEXT_PUBLIC_` variable for this credential. Restart Django after changing its environment. `MOOD_AI_TIMEOUT_SECONDS` must be between 1 and 60. Check the dashboard's mood panel to confirm the configured provider is available before testing with a short, non-sensitive sample.

Verify that any replacement model returns all seven expected emotion labels. Scores are classifier outputs, not medical probabilities, diagnosis, or certainty about a person's feelings.

### Data, consent, and endpoints

- The frontend submits only the text typed into the AI reflection form after the user checks an explicit consent box. It does not fetch a diary entry or run background analysis. With the default local provider, Django analyzes the text on its CPU and does not send it to an inference provider. With hosted inference selected, Django sends it to Hugging Face over TLS. In both modes, Django keeps the source text in request memory only and does not write it to analysis rows or application logs. Production proxies and observability tools should also be configured not to capture request bodies.
- Hugging Face currently states that routed Inference Providers requests and responses are not stored for training or stored as request/response bodies, and debugging logs may be kept for up to 30 days. A selected underlying provider may have separate terms; the user must review the current provider policies before sharing sensitive content. Avoid names and identifying or crisis-related information.
- The database stores the authenticated Django user, self-reported mood or derived model labels/scores, brief generated text, model identifier/version, status, and timestamp. It does not store AI input text and does not link analyses to diary entries. Analyses are private to their owner and can be deleted from history. Check-ins can be edited or deleted; deleting/altering a diary entry has no effect because no diary relationship exists.
- The API uses the existing Django JWT authentication. Endpoints are `GET /api/mood/config/`, `POST|GET /api/mood/check-ins/`, `PATCH|DELETE /api/mood/check-ins/<uuid>/`, `POST /api/mood/analyze/`, `GET|DELETE /api/mood/analyses/<uuid>/`, `GET /api/mood/history/?days=7|30|90&limit=50`, and `GET /api/mood/stats/?days=7|30`. Analysis requests require `text` (20–3,000 characters) and `consent: true`; an optional UUID `idempotency_key` prevents duplicate records on a retried request. Analysis is throttled to 10 requests/hour per signed-in user, and check-ins to 60/hour.
- Results can be unclear. The interface describes the result as a prediction, shows the actual returned score distribution, and invites a manual check-in when the model is uncertain. Suggestions are optional, deterministic, and non-clinical. MindHaven's general emotion classifier is not a crisis or suicide-risk detector and is not medical care.

### Database migration and checks

The mood migration only adds its own check-in and analysis tables and indexes; it does not alter diary tables or stored diary content. For an existing deployment, back up the database, review the pending migration list, and then apply it from `backend/`:

```bash
python manage.py showmigrations mood
python manage.py migrate mood
python manage.py check
python manage.py test mood
```

Also run the existing backend suite (`python manage.py test`) and frontend checks (`npm run lint`, `npm run build`) before deployment. Automated provider tests mock inference. A successful mock test does not verify package installation, model download/cache availability, server resources, hosted credentials, billing, or live response compatibility.

### Optional public-data model evaluation and training

An isolated, opt-in evaluation and fine-tuning workflow using a public dataset is documented in [docs/MOOD_MODEL_TRAINING.md](docs/MOOD_MODEL_TRAINING.md). It is not part of web application startup, does not access MindHaven users' private check-ins or diary entries, and does not change the production model. Treat exported weights as experimental until independently reviewed and evaluated.

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
