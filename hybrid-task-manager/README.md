# Hybrid Task Manager

A full-stack task management web app for both individual users and
professional teams — personal task tracking (à la Microsoft To Do) plus
team collaboration with boards, roles, and assignment (à la Trello).

- **Backend**: Django + Django REST Framework, JWT auth, Celery + Redis
  for async reminders/emails
- **Frontend**: Angular 18 + Angular Material, standalone components,
  drag-and-drop kanban boards

Both halves have been built and verified end-to-end in this environment:
the backend's full API was exercised with real requests (register, login,
team creation, role-based member management, task assignment, comments,
notifications, both dashboards), and the frontend builds cleanly and was
served against the live backend with CORS confirmed working.

---

## Project layout

```
hybrid-task-manager/
├── backend/     Django + DRF API
└── frontend/    Angular + Angular Material SPA
```

---

## 1. Backend setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Apply migrations (SQLite by default — see settings.py to switch to Postgres)
python manage.py migrate

# Create an admin user (optional, for /admin/)
python manage.py createsuperuser

# Run the dev server
python manage.py runserver 0.0.0.0:8000
```

The API is now live at `http://localhost:8000/api/`.

### Async tasks (reminders, recurring tasks, notification emails)

These run through Celery and need Redis:

```bash
# Terminal 2 — Redis (or use a hosted instance and set CELERY_BROKER_URL)
redis-server

# Terminal 3 — Celery worker
cd backend && celery -A config worker -l info

# Terminal 4 — Celery beat (scheduled reminder checks / recurrence generation)
cd backend && celery -A config beat -l info
```

**Don't have Redis handy?** Set `CELERY_TASK_ALWAYS_EAGER=1` in your
environment (see `.env.example`) and tasks run synchronously in-process —
fine for local development, not for production.

### Email

Defaults to printing emails to the console (`EMAIL_BACKEND` in
`.env.example`). Point `EMAIL_HOST_USER` / `EMAIL_HOST_PASSWORD` at
SendGrid (or any SMTP provider) for real delivery.

---

## 2. Frontend setup

```bash
cd frontend
npm install
npm start          # ng serve --host 0.0.0.0 --port 4200
```

Open `http://localhost:4200`. It's already pointed at
`http://localhost:8000/api` in `src/app/environments/environment.ts` —
edit that (and `environment.prod.ts` for production) if your backend
lives elsewhere.

---

## 3. Try it out

1. Register two accounts as **Professional** (one will be a team manager).
2. Log in as the first user, go to **Teams → New team**, then add the
   second user by username with a role (Manager / Team Lead / Team Member).
3. Create a board, add a task, assign it to the second user.
4. Log in as the second user (or open an incognito window) — the
   notification bell should show the assignment, and commenting/status
   changes notify watchers.
5. Check **Dashboard** for the stat cards and charts in both modes.
6. Try **Personal Tasks** — fully private, separate from any team.

---

## Notes on the "real-time" notification system

The abstract calls for real-time notifications. This build implements
the bell icon, unread badge, mark-as-read, and email alerts, with the
frontend **polling** `unread_count` every 15 seconds — a pragmatic
approach that needs no extra infrastructure. For true push delivery
(no polling delay), the natural upgrade is **Django Channels** with a
WebSocket consumer on the notifications app, broadcasting on the same
events that already call `notify_user()` — that function is the single
choke point, so the swap is localized to `notifications/utils.py` plus
a new consumer/routing file.

## What's stubbed vs. production-ready

- **Auth, tasks, teams, boards, comments, attachments, watchers,
  activity logs, dashboards, reminders, recurrence** — fully built and
  tested against a live server.
- **Database**: SQLite for easy local setup; swap `DATABASES` in
  `config/settings.py` for Postgres in production.
- **File storage**: attachments save to local disk (`media/`); swap in
  `django-storages` + S3 for production.
- **Deployment**: dev servers only (`runserver` / `ng serve`). For
  production, run Django behind Gunicorn/Uvicorn + a real web server,
  and build the Angular app (`ng build --configuration production`)
  and serve the static output.
