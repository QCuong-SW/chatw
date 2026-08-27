# 💬 ChatApp - Realtime Chat & WebRTC Calling Platform

A production-ready, full-stack realtime communication platform built with a high-performance **Next.js 15 (App Router)** client and a scalable **NestJS** backend, powered by **MongoDB, Redis, Socket.io, and WebRTC**.

---

## 🌟 Key Features

* **⚡ Real-time Messaging:** Low-latency 1-on-1 and Group chats via Socket.IO with typing indicators and online presence tracking.
* **📞 WebRTC Audio & Video Calling:** Peer-to-peer audio and video calls with WebSockets signaling and media controls.
* **🛡️ Authentication & Authorization:** JWT Access/Refresh tokens with persistent session management via Zustand and Axios interceptors.
* **🎨 Modern Responsive UI:** Built with Next.js 15 App Router, Tailwind CSS v4, Lucide Icons, and Radix UI (Shadcn UI design system).
* **📌 Rich Message Interactions:** Pinned messages, emoji reactions, message deletion, reply threads, and file/media attachments.
* **🚀 Infrastructure & Caching:** MongoDB for primary data storage, Redis for fast pub/sub and session caching, managed via Docker Compose.

---

## 🏗️ Architecture & Tech Stack

```
chatapp/
├── client/                 # Next.js 15 App Router Frontend (Port 3000)
│   ├── src/app/            # App Router (Pages, Layouts, Global CSS)
│   ├── src/components/     # UI, Chat, Auth, Call modals (Radix UI)
│   ├── src/lib/            # Axios API & Socket.io Singleton clients
│   └── src/stores/         # Zustand global state stores
│
├── server/                 # NestJS Backend API & WebSocket Gateway (Port 5000)
│   ├── src/modules/auth/   # Authentication & JWT strategy
│   ├── src/modules/conversations/ # Conversation management
│   ├── src/modules/messages/      # Message CRUD & storage
│   ├── src/modules/gateway/       # Socket.IO & WebRTC signaling
│   └── src/modules/users/         # User profile management
│
└── docker-compose.yml      # MongoDB (27017), Redis (6379), Mongo-Express (8081), Redis-Commander (8082)
```

| Layer | Technology |
| :--- | :--- |
| **Frontend** | Next.js 15 (React 19), TypeScript, Tailwind CSS v4, Radix UI, Zustand, Lucide React |
| **Backend** | NestJS 11, TypeScript, Socket.io Gateway, Passport JWT, Mongoose |
| **Databases** | MongoDB (Persistent data), Redis (Pub/Sub & Caching) |
| **Realtime** | Socket.IO Client/Server, WebRTC (PeerConnection) |
| **DevOps** | Docker, Docker Compose, PostCSS |

---

## 📂 Frontend Architecture (Next.js Layer Flow)

For developers coming from a backend or structured framework (like NestJS), the Next.js frontend is organized cleanly into modular layers:

```
[Module / Root]     -> [Controller / Route] -> [Service / Store]    -> [Repo / Gateway] -> [View / Component]
 layout.tsx                app/login/page.tsx      auth.store.ts          api.ts & socket.ts    AuthCard.tsx
```

1. **Module & Root Config:** [`client/src/app/layout.tsx`](client/src/app/layout.tsx) — Top-level layout, SEO metadata, fonts, global providers.
2. **Controller (Route Handlers):** [`client/src/app/page.tsx`](client/src/app/page.tsx), [`client/src/app/login/page.tsx`](client/src/app/login/page.tsx) — Handles URL routing and page views.
3. **Service & State Management:** [`client/src/stores/`](client/src/stores/) — Zustand stores (`auth.store.ts`, `chat.store.ts`, `call.store.ts`) holding business logic and reactive state.
4. **Repository & Network Gateway:** [`client/src/lib/api.ts`](client/src/lib/api.ts) (Axios with JWT auto-inject) & [`client/src/lib/socket.ts`](client/src/lib/socket.ts) (Socket.IO client singleton).
5. **View Components:** [`client/src/components/`](client/src/components/) — Presentational UI components and design system tokens.

---

## 📋 Prerequisites

* **Node.js:** `>= 20.x`
* **npm:** `>= 10.x`
* **Docker & Docker Compose:** Required for running MongoDB and Redis services.

---

## ⚙️ Environment Configuration

Copy the example environment file to both root, server, and client directories:

### 1. Server Environment (`server/.env`)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/chatapp
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=chatapp_secret_jwt_super_key_2026
JWT_EXPIRES_IN=1d
JWT_REFRESH_SECRET=chatapp_refresh_jwt_super_key_2026
JWT_REFRESH_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
```

### 2. Client Environment (`client/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

---

## 🚀 Getting Started

### Step 1: Start Database Services (Docker)

Start MongoDB, Redis, and Web GUI management consoles:

```bash
docker compose up -d
```

* **MongoDB:** `mongodb://localhost:27017`
* **Mongo Express GUI:** [http://localhost:8081](http://localhost:8081)
* **Redis:** `localhost:6379`
* **Redis Commander GUI:** [http://localhost:8082](http://localhost:8082)

---

### Step 2: Install Dependencies

From the root project folder:

```bash
# Install server dependencies
npm --prefix server install

# Install client dependencies
npm --prefix client install
```

---

### Step 3: Run in Development Mode

You can run both client and server from the root directory:

#### Run Server:
```bash
npm run dev:server
# Server will run on: http://localhost:5000
```

#### Run Client (in a separate terminal):
```bash
npm run dev:client
# Client will run on: http://localhost:3000
```

---

## 📦 Monorepo Scripts Reference

| Command | Description |
| :--- | :--- |
| `npm run dev:server` | Start NestJS backend in development/watch mode |
| `npm run dev:client` | Start Next.js frontend in development mode |
| `npm run build:server`| Compile NestJS backend to `./server/dist` |
| `npm run build:client`| Create optimized production build for Next.js |
| `npm run docker:up` | Start background databases (Mongo, Redis) via Docker |
| `npm run docker:down` | Stop and remove background Docker containers |
| `npm run docker:prod:build` | Build and launch full stack production containers with Nginx |
| `npm run docker:prod:down` | Stop and teardown production Docker containers |

---

## 🔌 API & Realtime Socket Events

### HTTP Endpoints (`/api`)
* `POST /api/auth/register` - Create a new user account
* `POST /api/auth/login` - Authenticate user & issue JWT
* `GET  /api/users/search` - Search users by username / email
* `GET  /api/conversations` - Fetch all conversations of the authenticated user
* `POST /api/conversations` - Create a direct or group chat
* `GET  /api/messages/:conversationId` - Fetch paginated messages

### Socket.IO Gateway Events
| Event Name | Direction | Description |
| :--- | :--- | :--- |
| `joinRoom` | Client → Server | Join a conversation room |
| `sendMessage` | Client → Server | Send a new chat message |
| `newMessage` | Server → Client | Broadcast new message to room members |
| `typing` / `stopTyping` | Bidirectional | Realtime typing status indicator |
| `callUser` | Client → Server | Initiate WebRTC peer-to-peer call |
| `answerCall` | Client → Server | Accept incoming WebRTC call with SDP offer |
| `iceCandidate` | Bidirectional | Exchange WebRTC ICE network candidates |

---

## 📄 License
This project is for educational and portfolio purposes.