# Brief Report: Work Done on Modules

## 1. Authentication
- User registration with OTP (email/phone), verification, and password set.
- Login and session handling.
- Profile creation and completion after verification.

---

## 2. Preferences
- Partner preference save and update (age, height, income, religion, education, etc.).
- Stored per user and used for profile matching.

---

## 3. Profiles
- List profiles with optional filter by partner preferences.
- Get own profile and other users’ profile details.
- Update own profile (bio, location, occupation, etc.).
- Profile photo upload and storage; URLs served for the app.

---

## 4. Favorites & Shortlist
- Add and remove profiles from favorites.
- Shortlist (add/remove) and list shortlisted profiles.
- List own favorites with pagination.

---

## 5. Conversations & Messaging
- Create or get a one-to-one conversation between two users.
- List current user’s conversations with last message and other user info.
- Send text message and list messages in a conversation with pagination.
- Mark messages as read when listing.

---

## 6. Real-Time (Socket.io)
- Same server serves REST API and WebSocket (Socket.io).
- After connecting, client identifies by user ID and joins conversation rooms.
- **New message:** When a message is sent via API, the recipient gets it in real time (no polling).
- **Typing:** Clients can send typing/typing-stop; the other user in the conversation sees the indicator.
- Documented client flow (connect, identify, join conversation, listen for events).

---

## 7. Push Notifications (Placeholder)
- Placeholder service for sending push (FCM/APNs) when a new message arrives (e.g. when app is in background).
- New message API triggers this; actual sending is to be implemented with FCM/APNs and device token storage.

---

## 8. Voice & Video Calls (Agora)
- Create call session: caller gets channel ID and token; optional call log created.
- Callee can join the same call by requesting a token with the same channel ID (channel ID must be delivered by the app, e.g. via Socket.io or push).
- End call: either party can end; duration and end time are stored.
- Call history: list past calls (as caller or callee) with pagination and other user info.
- Requires Agora App ID and App Certificate in environment; migration for call logs table provided.

---

## 9. Supporting Deliverables
- **Postman:** Collection updated with conversation and message endpoints (correct response fields), and calls (create session, end call, list logs). Variables for base URL, user IDs, conversation ID, and call channel ID.
- **Documentation:**  
  - Messages app integration (REST + Socket.io).  
  - Socket.io real-time behaviour and testing.  
  - Calls/video setup (Agora credentials, migration, API usage, app flow).  
  - Deployment case study (PaaS, VPS, Docker).
- **Tests:** Browser and Node test clients for Socket.io (connect, auth, join conversation, new message, typing).

---

## 10. Summary Table

| Module           | Status    | Notes                                              |
|------------------|-----------|----------------------------------------------------|
| Auth             | Done      | OTP, verify, set password, login, create profile  |
| Preferences      | Done      | Partner preferences per user                       |
| Profiles         | Done      | List, get, update; photo upload                    |
| Favorites        | Done      | Favorites + shortlist, list with pagination       |
| Conversations    | Done      | Create/get conversation, send/list messages       |
| Real-time        | Done      | Socket.io: new message, typing                    |
| Push             | Placeholder | FCM/APNs to be wired with device tokens         |
| Calls (voice/video) | Done   | Agora: session, end, call logs                   |
| Postman & docs   | Done      | Collection + integration and setup guides         |
