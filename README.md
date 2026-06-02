# Habit Tracker

A full-stack habit tracking web app built for internship prep. Track daily habits, visualize progress with analytics, and get weekly AI-powered reviews of your patterns — all from your phone as a PWA.

**Live demo:** http://habit-tracker-khanh.duckdns.org

---

## Features

- **Today's checklist** — tap to check off habits, see completion count in real time
- **Internship readiness score** — a 0–100 score calculated from your goal habits (LeetCode, AWS study, project work) with a countdown to your target date
- **Analytics dashboard** — GitHub-style activity heatmap, streak tracking, weekly completion rate chart, best and worst day of the week
- **AI weekly review** — Claude AI reads your past 7 days of data and generates a personalized, honest analysis of your patterns every week
- **Habit management** — create habits with icons, set frequency, mark as goal habits with custom weights toward the readiness score
- **PWA** — installable on iPhone and Android from the browser, works full screen like a native app
- **n8n automation** — nightly email reminder if habits are incomplete, weekly digest email with stats

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React (PWA), CSS |
| Backend | Node.js, Express |
| Database | PostgreSQL |
| Cache | Redis |
| AI | Claude API (Anthropic) |
| Automation | n8n |
| Deployment | AWS EC2|
| Web server | Nginx (reverse proxy + static file serving) |
| Containers | Docker, Docker Compose |
| DNS | DuckDNS |

---

## Architecture

```
User's browser / phone
        ↓
habit-tracker-khanh.duckdns.org (port 80)
        ↓
      Nginx
        ↓
  /          →  React build files (static)
  /api/      →  Node.js backend (port 3000)
        ↓
    Docker network
  ├── PostgreSQL (habits, logs, analytics, reviews)
  └── Redis (caching)
```

The frontend and backend share the same domain. Nginx routes `/api/` requests to the Node backend and serves the React production build for everything else. All services run in Docker containers on a single EC2 instance.

---

## API endpoints

### Auth
```
POST /auth/register    Create a new account
POST /auth/login       Login and get JWT token
```

### Habits
```
GET    /habits         Get all habits
POST   /habits         Create a habit
PUT    /habits/:id     Update a habit
DELETE /habits/:id     Delete a habit
```

### Logs
```
POST   /logs               Log a habit as done
GET    /logs/today         Get today's habits with completion status
DELETE /logs/:habitId/:date  Unlog a habit
```

### Analytics
```
GET /analytics/streaks           Current and longest streaks per habit
GET /analytics/heatmap           Activity data for last 90 days
GET /analytics/completion-rate   Weekly completion rate over 8 weeks
GET /analytics/best-worst-day    Best and worst day of the week
GET /analytics/readiness-score   Internship readiness score (0–100)
```

### Reviews
```
POST /reviews/generate   Generate a Claude AI weekly review
GET  /reviews            Get all past reviews
```

---

## Running locally

### Prerequisites
- Node.js 18+
- Docker and Docker Compose

### 1. Clone the repo
```bash
git clone https://github.com/khanhnguyen522/habit-tracker.git
cd habit-tracker
```

### 2. Start the database and Redis
```bash
docker compose up -d
```

This starts PostgreSQL on port 5434 and Redis on port 6380. The schema is applied automatically on first run.

### 3. Set up backend environment
Create `backend/.env`:
```
PORT=3000
DB_HOST=localhost
DB_PORT=5434
DB_USER=habituser
DB_PASSWORD=habitpass
DB_NAME=habitdb
REDIS_URL=redis://localhost:6380
JWT_SECRET=your_secret_here
ANTHROPIC_API_KEY=your_claude_api_key
```

### 4. Start the backend
```bash
cd backend
npm install
npm run dev
```

### 5. Start the frontend
```bash
cd frontend
npm install
npm start
```

Frontend runs at `http://localhost:3001`, backend at `http://localhost:3000`.

---

## Deployment (EC2 + Nginx)

### On the server
```bash
# Install Docker
sudo apt update
sudo apt install -y docker.io docker-compose-v2
sudo usermod -aG docker ubuntu
sudo systemctl enable docker

# Clone and configure
git clone https://github.com/khanhnguyen522/habit-tracker.git
cd habit-tracker
nano backend/.env   # add production credentials with DB_HOST=postgres

# Start all services
docker compose up -d --build
```

### Nginx config
```nginx
server {
    listen 80;
    server_name habit-tracker-khanh.duckdns.org;

    location / {
        root /home/ubuntu/habit-tracker/frontend/build;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Deploy frontend updates
```bash
# Build locally
cd frontend && npm run build

# Copy to server
scp -i ~/Downloads/habit-tracker-key.pem -r build ubuntu@3.134.115.192:~/habit-tracker/frontend/
```

---

## Database schema

```sql
users         — email, password_hash
habits        — name, icon, frequency, is_goal_habit, goal_weight
habit_logs    — habit_id, logged_date, skipped (UNIQUE per habit per day)
weekly_reviews — review_text, completion_rate, readiness_score
```
