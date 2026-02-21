# Quick Reference - API Endpoints

## Base URL
```
http://localhost:5000
```

## All Endpoints

| Method | Endpoint | Description | Body Required |
|--------|----------|-------------|---------------|
| GET | `/` | Health check | No |
| POST | `/api/auth/check-user` | Check if user exists | Yes |
| POST | `/api/auth/send-otp` | Send OTP to email | Yes |
| POST | `/api/auth/verify-otp` | Verify OTP code | Yes |
| POST | `/api/auth/set-password` | Set password (complete registration) | Yes |
| POST | `/api/auth/login` | Login and get JWT token | Yes |

---

## Quick Test Requests

### 1. Health Check
```
GET http://localhost:5000/
```

### 2. Check User
```json
POST http://localhost:5000/api/auth/check-user
Content-Type: application/json

{
  "uniqueId": "STU001"
}
```

### 3. Send OTP
```json
POST http://localhost:5000/api/auth/send-otp
Content-Type: application/json

{
  "uniqueId": "STU001"
}
```

### 4. Verify OTP
```json
POST http://localhost:5000/api/auth/verify-otp
Content-Type: application/json

{
  "uniqueId": "STU001",
  "otp": "123456"
}
```

### 5. Set Password
```json
POST http://localhost:5000/api/auth/set-password
Content-Type: application/json

{
  "uniqueId": "STU001",
  "password": "SecurePassword123!"
}
```

### 6. Login
```json
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "uniqueId": "STU001",
  "password": "SecurePassword123!"
}
```

---

## Profiles & Preferences (updated)

| Method | Endpoint | Description | Body / Query |
|--------|----------|-------------|--------------|
| GET | `/api/profiles/ping` | Profiles API health | — |
| POST | `/api/profiles/me` | Get my (logged-in) profile | `{ "userId": "{{userId}}" }` |
| POST | `/api/profiles/update` | Update my profile (partial) | `{ "userId": "{{userId}}", "fullName": "...", "bio": "...", ... }` |
| POST | `/api/profiles/details` | Get profile by userId | `{ "userId": "<profileUserId>" }` |
| POST | `/api/profiles/all` | List all users (filtered by gender) | `{ "userId": "{{userId}}" }` |
| POST | `/api/profiles/list` | List by partner preferences | `{ "userId": "{{userId}}", "page": 1, "limit": 20 }` |
| GET | `/api/preferences?userId=` | Get partner preferences | Query: `userId={{userId}}` |
| POST | `/api/preferences` | Save/update partner preferences | `{ "userId": "{{userId}}", "age_range": [25,35], "height_range": [160,180], "income_range": [2.5,15], "country_select": ["India"], "marital_status": "Never Married", "religion": "Hindu", "occupation": "...", "education": "...", "mother_tongue": "..." }` |

---

## Response Codes

- `200` - Success
- `400` - Bad Request (Invalid input, OTP expired, etc.)
- `401` - Unauthorized (Invalid password)
- `404` - Not Found (User not found)
- `500` - Server Error

---

## How to Import in Postman

1. Open Postman
2. Click **Import** button (top left)
3. Select **File** tab
4. Choose `Matrimony_API.postman_collection.json`
5. Click **Import**

## Setup Environment Variables (Optional)

1. Click **Environments** → **+** (Create new)
2. Name: `My School Hub Local`
3. Add variables:
   - `base_url`: `http://localhost:5000`
   - `uniqueId`: `STU001`
   - `otp`: (leave empty, will be set manually)
   - `token`: (leave empty, auto-set after login)
4. Select this environment from dropdown

---

## Testing Sequence

1. ✅ **Check User** - Verify user exists
2. ✅ **Send OTP** - Get OTP via email
3. ✅ **Verify OTP** - Enter OTP from email
4. ✅ **Set Password** - Complete registration
5. ✅ **Login** - Get JWT token

---

## Common Issues

- **Connection Error**: Make sure server is running (`npm start` or `node src/server.js`)
- **Database Error**: Check PostgreSQL is running and `.env` is configured
- **Email Error**: Configure `MAIL_USER` and `MAIL_PASS` in `.env`
- **User Not Found**: Ensure test user exists in database with `uniqueId`

