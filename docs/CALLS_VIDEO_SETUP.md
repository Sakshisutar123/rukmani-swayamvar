# Voice & Video Calls – Setup and Integration

Calls are implemented with **Agora RTC**. The backend generates tokens; your app uses the Agora SDK to join the same channel and run the call.

---

## What’s implemented

| Feature | Endpoint | Description |
|--------|----------|-------------|
| Create/join call | `POST /api/calls/session` | Returns Agora `appId`, `channelId`, `token`, `expireAt`, `type` (voice/video). Caller omits `channelId`; callee sends `channelId` from invite. |
| End call | `POST /api/calls/end` | Body: `{ userId, channelId }`. Marks call ended and saves duration. |
| Call history | `POST /api/calls/logs` | Body: `{ userId, page?, limit? }`. Returns list of calls (as caller or callee) with `logs[]` and `pagination`. |

---

## Steps you need to do

### 1. Get Agora credentials

1. Go to [Agora Console](https://console.agora.io/).
2. Sign up or log in.
3. Create a project (or use an existing one).
4. In the project, open **Project Management** → your project.
5. Copy:
   - **App ID**
   - **App Certificate** (click “Enable” if needed, then reveal and copy).

### 2. Configure backend env

In your backend `.env` add:

```env
AGORA_APP_ID=your_app_id_here
AGORA_APP_CERTIFICATE=your_app_certificate_here
```

Do not commit the certificate. In production use env vars or a secrets manager.

### 3. Run migration (call_logs table)

From the project root:

```bash
npm run migrate
```

Or:

```bash
npx sequelize-cli db:migrate
```

This creates the `call_logs` table used for call history and end-call duration.

### 4. Install dependency (if not already)

```bash
npm install
```

The backend uses `agora-access-token` for token generation (already in `package.json`). If you prefer the maintained package, you can switch to `agora-token` and use the same API in `src/services/agora.js`.

### 5. Restart the server

```bash
npm start
```

Then call `POST /api/calls/session` with `{ userId, otherUserId, type: "voice" }` (or `"video"`). You should get `appId`, `channelId`, `token`, `expireAt`, `type` and no 503.

---

## API details

### Create call (caller)

**Request**

```http
POST /api/calls/session
Content-Type: application/json

{
  "userId": "<caller-uuid>",
  "otherUserId": "<callee-uuid>",
  "type": "voice"
}
```

`type` can be `"voice"` or `"video"`.

**Response (200)**

```json
{
  "success": true,
  "appId": "your-agora-app-id",
  "channelId": "call-<uuid>",
  "token": "<agora-rtc-token>",
  "expireAt": 1234567890,
  "type": "voice"
}
```

- Use `appId`, `channelId`, `token` with the Agora SDK to join as the caller.
- Send `channelId` to the callee (e.g. via push or in-app “incoming call” payload) so they can join the same channel.

### Join call (callee)

**Request**

```http
POST /api/calls/session
Content-Type: application/json

{
  "userId": "<callee-uuid>",
  "otherUserId": "<caller-uuid>",
  "type": "voice",
  "channelId": "call-<uuid-from-invite>"
}
```

**Response (200)**  
Same shape: `appId`, `channelId`, `token`, `expireAt`, `type`. Use these in the Agora SDK to join the same channel.

### End call

**Request**

```http
POST /api/calls/end
Content-Type: application/json

{
  "userId": "<participant-uuid>",
  "channelId": "call-<uuid>"
}
```

Either caller or callee can end. Backend sets `endedAt` and `durationSeconds` on the call log.

**Response (200)**

```json
{
  "success": true,
  "message": "Call ended",
  "callLog": {
    "id": "<log-uuid>",
    "channelId": "call-<uuid>",
    "durationSeconds": 120,
    "endedAt": "2025-02-17T12:00:00.000Z"
  }
}
```

### Call logs

**Request**

```http
POST /api/calls/logs
Content-Type: application/json

{
  "userId": "<user-uuid>",
  "page": 1,
  "limit": 20
}
```

**Response (200)**

```json
{
  "success": true,
  "logs": [
    {
      "id": "<log-uuid>",
      "channelId": "call-<uuid>",
      "type": "voice",
      "startedAt": "...",
      "endedAt": "...",
      "durationSeconds": 120,
      "role": "caller",
      "otherUser": { "id": "...", "fullName": "...", "profilePicture": "..." }
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 1 }
}
```

---

## App integration (high level)

1. **Caller**
   - Call `POST /api/calls/session` with `userId`, `otherUserId`, `type` (no `channelId`).
   - Store `appId`, `channelId`, `token`, `type` from the response.
   - Join the Agora channel with the SDK using these values (use `userId` as Agora “user account” if your SDK supports it).
   - Notify the callee (push or in-app) with at least `channelId` and `type` so they can request their token and join.

2. **Callee**
   - On “incoming call”, receive `channelId` (and optionally `type`, caller info).
   - Call `POST /api/calls/session` with `userId` (callee), `otherUserId` (caller), `type`, and `channelId`.
   - Use returned `appId`, `channelId`, `token` to join the same Agora channel with the SDK.

3. **End call**
   - When either user hangs up, call `POST /api/calls/end` with `userId` and `channelId`.
   - Leave the Agora channel in the SDK.

4. **Call history**
   - Call `POST /api/calls/logs` with `userId` and pagination to show past calls.

---

## Optional: notify callee (Socket.io or push)

The backend does not send the “incoming call” for you. You can:

- **Socket.io:** When the caller creates a session, emit an event to the callee (e.g. `incoming_call` with `channelId`, `type`, caller name). The callee app listens and shows the call UI, then calls `POST /api/calls/session` with that `channelId` when they accept.
- **Push (FCM/APNs):** Send a data payload with `channelId`, `type`, and caller id so the callee can open the app and join.

---

## Troubleshooting

| Issue | Check |
|-------|--------|
| 503 “Calls not configured” | `AGORA_APP_ID` and `AGORA_APP_CERTIFICATE` are set in `.env` and the server was restarted. |
| 400 “userId and otherUserId are required” | Send both in the JSON body. |
| Token invalid / join fails | Token has a 1-hour lifetime; generate a new one if the call starts long after the first request. Reuse the same `channelId` for caller and callee. |
| Call logs empty | Run the migration so `call_logs` exists. New calls create a log when the caller creates a session; ending the call updates `endedAt` and `durationSeconds`. |

---

## Summary checklist

- [ ] Agora project created; App ID and App Certificate copied.
- [ ] `.env` has `AGORA_APP_ID` and `AGORA_APP_CERTIFICATE`.
- [ ] `npm run migrate` (or `npx sequelize-cli db:migrate`) run.
- [ ] `npm install` and `npm start`; no 503 on `POST /api/calls/session`.
- [ ] App uses Agora SDK with `appId`, `channelId`, `token`; caller creates session, callee joins with same `channelId`.
- [ ] App calls `POST /api/calls/end` when the call ends; optionally show history via `POST /api/calls/logs`.
