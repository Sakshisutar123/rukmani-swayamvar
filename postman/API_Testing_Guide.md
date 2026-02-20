# API Testing Guide for Postman

## Base URL
```
http://localhost:5000
```

## All Available Endpoints

### 1. Health Check
**GET** `/`
- **Description**: Check if API is running
- **Headers**: None
- **Body**: None
- **Expected Response**: `"API is running..."`

---

### 2. Check User
**POST** `/api/auth/check-user`
- **Description**: Check if user exists and is not already registered
- **Headers**: 
  ```
  Content-Type: application/json
  ```
- **Body** (JSON):
  ```json
  {
    "uniqueId": "STU001"
  }
  ```
- **Success Response** (200):
  ```json
  {
    "message": "User found",
    "email": "user@example.com"
  }
  ```
- **Error Responses**:
  - 404: `{ "message": "User not found" }`
  - 400: `{ "message": "User already registered" }`
  - 500: `{ "message": "Server error", "error": "..." }`

---

### 3. Send OTP
**POST** `/api/auth/send-otp`
- **Description**: Send OTP to user's email
- **Headers**: 
  ```
  Content-Type: application/json
  ```
- **Body** (JSON):
  ```json
  {
    "uniqueId": "STU001"
  }
  ```
- **Success Response** (200):
  ```json
  {
    "message": "OTP sent successfully"
  }
  ```
- **Error Responses**:
  - 404: `{ "message": "User not found" }`
  - 500: `{ "message": "Error sending OTP", "error": "..." }`

---

### 4. Verify OTP
**POST** `/api/auth/verify-otp`
- **Description**: Verify the OTP code
- **Headers**: 
  ```
  Content-Type: application/json
  ```
- **Body** (JSON):
  ```json
  {
    "uniqueId": "STU001",
    "otp": "123456"
  }
  ```
- **Success Response** (200):
  ```json
  {
    "message": "OTP verified successfully"
  }
  ```
- **Error Responses**:
  - 404: `{ "message": "User not found" }`
  - 400: `{ "message": "Invalid OTP" }` or `{ "message": "OTP expired" }`
  - 500: `{ "message": "Server error", "error": "..." }`

---

### 5. Set Password
**POST** `/api/auth/set-password`
- **Description**: Set password for user registration (completes registration)
- **Headers**: 
  ```
  Content-Type: application/json
  ```
- **Body** (JSON):
  ```json
  {
    "uniqueId": "STU001",
    "password": "SecurePassword123!"
  }
  ```
- **Success Response** (200):
  ```json
  {
    "message": "Password created successfully, registration complete"
  }
  ```
- **Error Responses**:
  - 404: `{ "message": "User not found" }`
  - 500: `{ "message": "Error setting password", "error": "..." }`

---

### 6. Login
**POST** `/api/auth/login`
- **Description**: Login user and get JWT token
- **Headers**: 
  ```
  Content-Type: application/json
  ```
- **Body** (JSON):
  ```json
  {
    "uniqueId": "STU001",
    "password": "SecurePassword123!"
  }
  ```
- **Success Response** (200):
  ```json
  {
    "message": "Login successful",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "uniqueId": "STU001",
      "fullName": "John Doe"
    }
  }
  ```
- **Error Responses**:
  - 404: `{ "message": "User not found" }`
  - 401: `{ "message": "Invalid password" }`
  - 500: `{ "message": "Server error", "error": "..." }`

---

## Testing Flow (Registration Process)

1. **Check User** → `/api/auth/check-user`
   - Verify user exists and is not registered

2. **Send OTP** → `/api/auth/send-otp`
   - OTP will be sent to user's email

3. **Verify OTP** → `/api/auth/verify-otp`
   - Verify the OTP received via email

4. **Set Password** → `/api/auth/set-password`
   - Complete registration by setting password

5. **Login** → `/api/auth/login`
   - Login with credentials to get JWT token

---

## Postman Collection Setup

### Environment Variables (Optional)
Create a Postman environment with:
- `base_url`: `http://localhost:5000`
- `token`: (will be set after login)

### Collection Variables
- `uniqueId`: `STU001` (or your test user's uniqueId)
- `otp`: (will be set after receiving OTP)

---

## Sample Test Data

### Test User (must exist in database)
```json
{
  "uniqueId": "STU001",
  "fullName": "John Doe",
  "email": "john.doe@example.com",
  "phone": "+1234567890",
  "isRegistered": false
}
```

---

## Notes

1. **OTP Expiry**: OTP expires in 5 minutes
2. **JWT Token**: Token expires in 2 hours
3. **Password**: Use strong passwords for testing
4. **Database**: Ensure PostgreSQL is running and database is connected
5. **Email**: Configure `.env` file with email credentials for OTP sending

---

## Conversations (Messaging)

- **POST** `/api/conversations` – Create or get conversation. Body: `{ "userId", "otherUserId" }`. Response: `{ success, conversation }`.
- **POST** `/api/conversations/list` – List my conversations. Body: `{ "userId", "page?", "limit?" }`. Response: `{ success, conversations[] }`.
- **POST** `/api/conversations/messages` – Send message. Body: `{ "userId", "conversationId", "content" }`. Response: `{ success, message }`.
- **POST** `/api/conversations/messages/list` – List messages. Body: `{ "userId", "conversationId", "page?", "limit?", "markRead?" }`. Response: `{ success, messages[], pagination }`.

Use collection variables: `userId`, `otherUserId`, `conversationId` (set by Create or Get Conversation).

---

## Calls (Voice/Video)

- **POST** `/api/calls/session` – Create call session (Agora/Twilio). Body: `{ "userId", "otherUserId", "type": "voice"|"video" }`. Returns 503 until CPaaS is configured.
- **POST** `/api/calls/logs` – List call logs. Body: `{ "userId", "page?", "limit?" }`. Response: `{ success, logs[] }`.

