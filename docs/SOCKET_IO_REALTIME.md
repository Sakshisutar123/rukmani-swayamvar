# Real-time (Socket.io) – How It Works & How to Test

## How it works

### 1. Server setup

- The **HTTP server** (Express) is created with `http.createServer(app)`.
- **Socket.io** is attached to the same server, so one port (e.g. `5000`) serves both:
  - REST: `GET/POST http://localhost:5000/api/...`
  - WebSocket: Socket.io connects to `http://localhost:5000` and uses the same origin.
- On each **client connection**, the server listens for events and keeps the socket in **rooms** so it can target specific users or conversations.

### 2. Client connection flow

```
Client                          Server (realtime.js)
   |                                    |
   |-------- connect (Socket.io) ------->|
   |                                    |
   |-------- emit("auth", { userId }) -->|  Store socket in room "user:{userId}"
   |                                    |  (so we can send to that user later)
   |                                    |
   |-------- emit("join_conversation",  |
   |              { conversationId }) -->  socket.join("conversation:{id}")
   |                                    |
   |<------- emit("new_message", msg) --|  When someone sends a message (REST),
   |         (only to recipient's room)  |  server calls emitNewMessage(receiverId, msg)
   |                                    |
   |-------- emit("typing",             |
   |              { conversationId,     |
   |                userId }) ---------->  socket.to("conversation:X").emit("typing", ...)
   |                                    |  (so the other user in that conversation sees it)
   |<------- emit("typing", {...}) ------|
```

### 3. Events (client → server)

| Event               | Payload                      | What the server does |
|---------------------|-----------------------------|------------------------|
| `auth`              | `{ userId }`                | Puts socket in room `user:{userId}` so it can receive `new_message`. |
| `join_conversation` | `{ conversationId }`        | Puts socket in room `conversation:{conversationId}` for typing broadcast. |
| `leave_conversation`| `{ conversationId }`        | Removes socket from that conversation room. |
| `typing`            | `{ conversationId, userId }`| Broadcasts `typing` (isTyping: true) to **other** sockets in that conversation. |
| `typing_stop`       | `{ conversationId, userId }`| Broadcasts `typing` (isTyping: false) to others. |

### 4. Events (server → client)

| Event         | When                          | Payload |
|---------------|--------------------------------|--------|
| `new_message` | After a message is saved (REST `POST /api/conversations/messages`) | `{ id, conversationId, senderId, receiverId, content, createdAt, readAt }` |
| `typing`      | When another user in the same conversation emits `typing` or `typing_stop` | `{ conversationId, userId, isTyping }` |

### 5. End-to-end flow

**New message**

1. User A sends a message via **REST**: `POST /api/conversations/messages` with `{ userId: A, conversationId, content }`.
2. Server saves the message in the DB and then calls `emitNewMessage(receiverId, message)`.
3. Server does `io.to("user:{receiverId}").emit("new_message", message)`.
4. User B’s client (if connected and already sent `auth` with B’s `userId`) receives `new_message` and can update the UI without polling.

**Typing**

1. User A’s client emits `typing` with `{ conversationId, userId: A }`.
2. Server does `socket.to("conversation:{conversationId}").emit("typing", { conversationId, userId: A, isTyping: true })`.
3. User B’s client (if it joined that conversation with `join_conversation`) receives `typing` and can show “A is typing…”.

---

## How to test

### Prerequisites

- Backend running: `npm start` (from project root, so `src/server.js` runs with Socket.io).
- Two **user IDs** (UUIDs) that exist in your DB (e.g. from auth/registration). You’ll use one as sender and one as recipient.
- One **conversation ID** between those two users (from `POST /api/conversations` with `userId` and `otherUserId`).

### Option A: Browser test page (recommended)

1. Open **`test/socket-realtime-test.html`** in your browser (e.g. double‑click or `file:///...`).
2. Set **Server URL** to `http://localhost:5000` (must match your running server).
3. **User 1 tab:**  
   - Enter **User ID** = recipient’s UUID.  
   - Click **Connect**, then **Join conversation** with the conversation ID.  
   - Leave this tab open; you should see “Listening for new_message and typing” (or similar).
4. **User 2 (sender):**  
   - Use **Postman** (or another tab):  
     `POST http://localhost:5000/api/conversations/messages`  
     Body: `{ "userId": "<sender-uuid>", "conversationId": "<conv-id>", "content": "Hello" }`.
5. In **User 1’s tab** you should see the **new_message** event and the message content.
6. **Typing:** In the test page, enter the same `conversationId`, click **Join conversation**, then click **Emit typing** / **Emit typing_stop**. Open a second tab with the **other** user’s ID, join the same conversation; that tab should show the typing events.

### Option B: Postman (REST only) + test page (Socket)

- **REST (message send/list):** Use Postman as usual for:
  - `POST /api/conversations`
  - `POST /api/conversations/messages`
  - `POST /api/conversations/messages/list`
- **Socket (new_message, typing):** Use the browser test page above. The “API” you’re testing for real-time is the Socket.io events; Postman does not speak Socket.io protocol, so the test page (or a small Node script with `socket.io-client`) is the right way to verify `new_message` and `typing`.

### Option C: Node script (terminal)

From the project root:

```bash
npm install
USER_ID=<recipient-uuid> CONV_ID=<conversation-uuid> npm run test:socket
```

Or without `CONV_ID` (you’ll still receive `new_message`; `CONV_ID` is only needed to receive `typing`):

```bash
USER_ID=<recipient-uuid> npm run test:socket
```

Leave this running, then send a message via Postman (`POST /api/conversations/messages` with the **recipient** equal to `USER_ID`). You should see `[new_message]` and the payload in the terminal.

---

## Quick checklist

1. Server running with Socket.io (`npm start`).
2. Client connects to `http://localhost:5000`.
3. Client emits `auth` with `{ userId }` (required to receive `new_message`).
4. Client emits `join_conversation` with `{ conversationId }` (required to receive `typing` in that chat).
5. Send a message via REST → recipient’s client gets `new_message`.
6. One client emits `typing` / `typing_stop` → other client in same conversation gets `typing`.
