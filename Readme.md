# QueueUp

QueueUp is a real-time squadfinding app for players who need teammates before
queueing. Users create a guest callsign, browse or create lobbies, join by code,
and coordinate through live roster updates and in-lobby chat.

Launch games:

- PUBG Mobile
- Marvel Rivals

## Tech Stack

- Client: React, Vite, Tailwind CSS, React Router, Socket.io Client
- Server: Express, TypeScript, Socket.io, Prisma
- Database: PostgreSQL, currently Neon

## Local Setup

Install dependencies:

```powershell
cd server
npm install

cd ../client
npm install
```

Create environment files:

```powershell
Copy-Item server/.env.example server/.env
Copy-Item client/.env.example client/.env
```

Update `server/.env` with your real `DATABASE_URL`.

Prepare the database:

```powershell
cd server
npm run db:generate
npm run db:push
```

Run the backend:

```powershell
cd server
npm run dev
```

Run the frontend in another terminal:

```powershell
cd client
npm run dev
```

Default local URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`

## Verification

Backend:

```powershell
cd server
npm run build
```

Frontend:

```powershell
cd client
npm run lint
npm run build
```

Realtime smoke test:

```powershell
cd server
npm run smoke:realtime
```


