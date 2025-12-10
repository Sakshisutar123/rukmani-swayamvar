# Quick Fix for Production Issues

## Issue 1: "User not found" 404 Error

**Problem:** The `users` table doesn't exist in your Render PostgreSQL database.

### Fix: Create Users Table

1. **Go to Render Dashboard:**
   - Navigate to your PostgreSQL Database service
   - Click on "Shell" tab (or use pgAdmin)

2. **Connect to database:**
   ```bash
   psql $DATABASE_URL
   ```
   Or use the connection string from Render dashboard

3. **Run this SQL:**
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

4. **Add a test user:**
   ```sql
   INSERT INTO users ("uniqueId", "fullName", email, phone, "isRegistered")
   VALUES ('STU001', 'Test User', 'test@example.com', '+1234567890', false);
   ```

5. **Verify:**
   ```sql
   SELECT * FROM users;
   ```

6. **Test API:**
   ```bash
   POST https://dcs-coaching.onrender.com/api/auth/check-user
   {
     "uniqueId": "STU001"
   }
   ```

---

## Issue 2: Email Connection Timeout

**Problem:** Gmail is blocking connections from Render's servers.

**Status:** Password is correct (16 characters ✅), but connection times out.

### Fix: Updated Code (Already Applied)

I've updated the email transporter to use direct SMTP with timeout settings. This should help, but if it still fails, consider:

### Alternative: Use SendGrid (Recommended for Production)

1. **Sign up:** https://sendgrid.com (Free tier: 100 emails/day)

2. **Get API Key:**
   - Dashboard → Settings → API Keys
   - Create API Key with "Mail Send" permissions

3. **Update Render Environment Variables:**
   - Add: `SENDGRID_API_KEY=your-api-key-here`
   - Keep: `MAIL_USER=your-email@yourdomain.com` (for "from" address)

4. **Update code to use SendGrid** (I can help with this if needed)

---

## Quick Action Items

### Immediate (Database):
- [ ] Connect to Render PostgreSQL
- [ ] Run CREATE TABLE SQL
- [ ] Add test user (STU001)
- [ ] Test API endpoint

### Next (Email):
- [ ] Test email after code update (already applied)
- [ ] If still fails, switch to SendGrid
- [ ] Update environment variables

---

## Test Commands

### Test Database:
```bash
POST https://dcs-coaching.onrender.com/api/auth/check-user
Content-Type: application/json

{
  "uniqueId": "STU001"
}
```

**Expected:**
- ✅ `{"message": "User found", "email": "test@example.com"}` - Working!
- ❌ `{"message": "User not found"}` - User doesn't exist (but table exists)
- ❌ `{"message": "Server error", "error": "relation \"users\" does not exist"}` - Table missing

### Test Email:
```bash
POST https://dcs-coaching.onrender.com/api/auth/send-otp
Content-Type: application/json

{
  "uniqueId": "STU001"
}
```

**Expected:**
- ✅ `{"message": "OTP sent successfully"}` - Working!
- ❌ `{"message": "Error sending OTP", "error": "Connection timeout"}` - Still blocked

---

## After Fixing Database

Once the table is created and you have a user, the API should work:

1. ✅ Check User - Should find the user
2. ✅ Send OTP - Will try to send email (may still timeout)
3. ✅ Verify OTP - Will work once OTP is sent
4. ✅ Set Password - Will work
5. ✅ Login - Will work

The email timeout is a separate issue that may require switching to a different email service.

