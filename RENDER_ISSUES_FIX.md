# Fix Render Production Issues

## Issue 1: Email Connection Timeout

**Error:** `❌ Email transporter error: Connection timeout`

**Status:** Password is correct (16 characters ✅), but Gmail is blocking the connection.

### Why This Happens:
Gmail often blocks connections from cloud hosting providers like Render due to:
- IP reputation (Render's IPs may be flagged)
- Security policies
- Rate limiting

### Solutions:

#### Solution A: Use Different Email Service (Recommended)

**Option 1: SendGrid (Free tier: 100 emails/day)**
1. Sign up at https://sendgrid.com
2. Create API Key
3. Update Render environment variables:
   ```
   MAIL_SERVICE=sendgrid
   MAIL_API_KEY=your-sendgrid-api-key
   MAIL_FROM=your-email@yourdomain.com
   ```

**Option 2: Mailgun (Free tier: 5,000 emails/month)**
1. Sign up at https://mailgun.com
2. Get SMTP credentials
3. Update code to use Mailgun SMTP

**Option 3: Resend (Modern, developer-friendly)**
1. Sign up at https://resend.com
2. Get API key
3. Use Resend SDK

#### Solution B: Try Gmail with Different Settings

Update the transporter configuration to handle timeouts better:

```javascript
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 10000,
  socketTimeout: 10000,
});
```

#### Solution C: Use Gmail SMTP Directly (Instead of 'service: gmail')

```javascript
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  connectionTimeout: 10000,
});
```

---

## Issue 2: "User not found" 404 Error

**Error:** `{"message": "User not found"}`

### Possible Causes:

1. **Users table doesn't exist** - Most likely!
2. **No user with uniqueId "STU001" in database**
3. **Database connection issue**

### Fix: Create Users Table

#### Option 1: Run SQL Script (Quickest)

1. **Connect to Render PostgreSQL:**
   - Go to Render Dashboard → Your PostgreSQL Database
   - Click "Shell" tab
   - Or use pgAdmin with connection string

2. **Run this SQL:**
   ```sql
   CREATE TABLE IF NOT EXISTS users (
       id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
       "uniqueId" character varying NOT NULL UNIQUE,
       "fullName" character varying NOT NULL,
       email character varying,
       phone character varying,
       "passwordHash" character varying,
       otp character varying,
       "otpExpiry" timestamp with time zone,
       "isRegistered" boolean DEFAULT false,
       registration_type character varying,
       qualification character varying,
       college_name character varying,
       "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
       "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
   );
   
   CREATE INDEX IF NOT EXISTS idx_users_uniqueId ON users("uniqueId");
   ```

3. **Verify table exists:**
   ```sql
   SELECT * FROM users LIMIT 1;
   ```

#### Option 2: Add Test User

After creating table, add a test user:

```sql
INSERT INTO users ("uniqueId", "fullName", email, phone, "isRegistered")
VALUES ('STU001', 'Test User', 'test@example.com', '+1234567890', false);
```

#### Option 3: Enable Auto-Sync (Temporary)

Add environment variable in Render:
- Key: `SYNC_DB`
- Value: `true`

This will auto-create tables on startup (not recommended for production long-term).

---

## Quick Fix Checklist

### For Email Issue:
- [ ] Try Solution C (SMTP direct connection) first
- [ ] If still fails, switch to SendGrid/Mailgun
- [ ] Update code to use new email service

### For Database Issue:
- [ ] Connect to Render PostgreSQL
- [ ] Run CREATE TABLE SQL script
- [ ] Verify table exists
- [ ] Add test user if needed
- [ ] Test API endpoint again

---

## Test After Fixes

### Test Database:
```bash
POST https://dcs-coaching.onrender.com/api/auth/check-user
{
  "uniqueId": "STU001"
}
```

**Expected responses:**
- `{"message": "User found", "email": "..."}` - ✅ Working
- `{"message": "User not found"}` - Table exists but no user
- `{"message": "Server error", "error": "relation \"users\" does not exist"}` - Table missing

### Test Email:
```bash
POST https://dcs-coaching.onrender.com/api/auth/send-otp
{
  "uniqueId": "STU001"
}
```

**Expected:**
- `{"message": "OTP sent successfully"}` - ✅ Working
- `{"message": "Error sending OTP", "error": "..."}` - Email issue

---

## Recommended Next Steps

1. **Fix Database First:**
   - Run SQL script to create users table
   - Add a test user

2. **Fix Email Second:**
   - Try SMTP direct connection (Solution C)
   - If fails, switch to SendGrid or Mailgun

3. **Test Everything:**
   - Test all API endpoints
   - Verify email sending works

