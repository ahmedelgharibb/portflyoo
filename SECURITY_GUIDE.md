# 🔒 Password Security Guide

## **Implemented Security Features**

### **1. Password Hashing**
- ✅ **bcrypt hashing** with 12 salt rounds
- ✅ **Secure comparison** using `bcrypt.compare()`
- ✅ **Automatic hashing** when passwords are saved

### **2. Rate Limiting**
- ✅ **10 attempts per 30 minutes** per IP address (increased from 5/15min)
- ✅ **30 requests per minute** for general API calls (increased from 10/min)
- ✅ **Automatic blocking** after limit exceeded
- ✅ **IP tracking** for security monitoring
- ✅ **User-friendly error messages** with remaining attempts/time

### **3. Secure Headers**
- ✅ **CSP (Content Security Policy)**
- ✅ **X-Frame-Options**
- ✅ **X-Content-Type-Options**
- ✅ **X-XSS-Protection**

### **4. Password Change Security**
- ✅ **Current password verification** required
- ✅ **Secure password update** endpoint
- ✅ **Hashed storage** of new passwords

## **Additional Security Recommendations**

### **1. Environment Variables**
```bash
# Add to your .env file
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret_key
```

### **2. HTTPS Only**
- ✅ **Force HTTPS** in production
- ✅ **Secure cookies** with httpOnly flag
- ✅ **HSTS headers** for additional security

### **3. Password Policy**
```javascript
// Recommended password requirements
const passwordPolicy = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true
};
```

### **4. Session Management**
```javascript
// JWT-based sessions (recommended)
const jwt = require('jsonwebtoken');
const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { 
  expiresIn: '24h' 
});
```

### **5. Database Security**
- ✅ **Row Level Security (RLS)** in Supabase
- ✅ **Encrypted connections** to database
- ✅ **Regular backups** with encryption

### **6. Monitoring & Logging**
```javascript
// Security event logging
const securityLog = {
  timestamp: new Date(),
  event: 'login_attempt',
  ip: clientIP,
  success: isValid,
  userAgent: req.headers['user-agent']
};
```

## **Security Checklist**

### **✅ Implemented**
- [x] Password hashing with bcrypt
- [x] Rate limiting for login attempts
- [x] Secure HTTP headers
- [x] Password change functionality
- [x] Input validation and sanitization

### **🔄 Recommended Next Steps**
- [ ] JWT session management
- [ ] Password strength validation
- [ ] Two-factor authentication (2FA)
- [ ] Audit logging
- [ ] Database encryption at rest
- [ ] Regular security audits

### **🔒 Advanced Security**
- [ ] IP whitelisting for admin access
- [ ] Device fingerprinting
- [ ] Anomaly detection
- [ ] Automated threat response
- [ ] Security monitoring dashboard

## **Testing Security**

### **1. Test Password Hashing**
```javascript
// Verify passwords are hashed
const response = await fetch('/api/api?action=getData');
const data = await response.json();
console.log('Password is hashed:', data.admin.password.startsWith('$2b$'));
```

### **2. Test Rate Limiting**
```javascript
// Try multiple failed logins
for (let i = 0; i < 6; i++) {
  const response = await fetch('/api/api?action=login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'wrongpassword' })
  });
  console.log(`Attempt ${i + 1}:`, response.status);
}
```

### **3. Test Password Change**
```javascript
// Test secure password change
const response = await fetch('/api/api?action=changePassword', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    currentPassword: 'admin12345', 
    newPassword: 'NewSecurePassword123!' 
  })
});
```

## **Emergency Procedures**

### **If Compromised:**
1. **Immediately change password** via admin panel
2. **Review access logs** for suspicious activity
3. **Reset all sessions** if JWT is implemented
4. **Update security keys** if necessary
5. **Notify users** if user data is affected

### **Regular Maintenance:**
- **Monthly**: Review access logs
- **Quarterly**: Update dependencies
- **Annually**: Security audit and penetration testing

---

**Remember**: Security is an ongoing process. Regularly review and update your security measures! 

## **Troubleshooting 429 Errors**

### **If You Get "Too Many Requests" Error:**

1. **Wait for the time limit to expire:**
   - Login attempts: 30 minutes
   - General API calls: 1 minute

2. **Clear rate limiting for testing:**
   ```bash
   node scripts/clear-rate-limits.js
   ```

3. **Check your IP address:**
   - Rate limiting is based on IP address
   - If using VPN, try disconnecting
   - If on shared network, wait for others to stop making requests

4. **Monitor remaining attempts:**
   - Failed login attempts show remaining count
   - API responses include `remainingAttempts` and `timeRemaining`

### **Rate Limiting Details:**

| Type | Limit | Window | Reset Time |
|------|-------|--------|------------|
| Login Attempts | 10 | 30 minutes | Automatic |
| API Requests | 30 | 1 minute | Automatic |
| File Uploads | 10 | 5 minutes | Automatic |

### **Testing Without Rate Limits:**

For development/testing, you can temporarily disable rate limiting by commenting out the rate limiting code in:
- `api/api.js` (lines 82-100)
- `public/websites/*/api.php` (lines 12-25)

**⚠️ Warning: Never disable rate limiting in production!**

--- 