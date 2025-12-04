# Healto-Doctor Login Fix Guide

## Summary of Issues Found & Fixed

### ✅ Issue 1: Incorrect API Base URL
**Problem:** The `ApiConfig.js` had wrong base URL
```javascript
// BEFORE (Wrong)
BASE_URL: 'https://spiderdesk.asia/healto/api'

// AFTER (Correct)
BASE_URL: 'https://spiderdesk.asia/healto/public/api'
```

**Impact:** All API calls were failing with 404 errors because the URL path was incomplete.

---

### ✅ Issue 2: Missing API Endpoints Configuration
**Problem:** `ApiConfig.js` lacked proper endpoint definitions matching the Postman collection
**Solution:** Added all doctor endpoints from the Postman collection

```javascript
ENDPOINTS: {
  DOCTOR_LOGIN: '/doctor/login',
  DOCTOR_LOGOUT: '/doctor/logout',
  DOCTOR_PROFILE: '/doctor/profile',
  DOCTOR_UPDATE_PROFILE: '/doctor/update-profile',
  DOCTOR_CHANGE_PASSWORD: '/doctor/change-password',
  DOCTOR_DASHBOARD: '/doctor/dashboard',
  DOCTOR_SPECIALIZATIONS: '/doctor/specializations',
  DOCTOR_TODAY_APPOINTMENTS: '/doctor/today-appointments',
  DOCTOR_APPOINTMENTS: '/doctor/appointments',
  DOCTOR_APPOINTMENT_DETAILS: '/doctor/appointments/:id',
  DOCTOR_START_APPOINTMENT: '/doctor/appointments/:id/start',
  DOCTOR_END_APPOINTMENT: '/doctor/appointments/:id/end',
  DOCTOR_MARK_UNAVAILABLE: '/doctor/mark-unavailable',
  DOCTOR_MARK_AVAILABLE: '/doctor/mark-available',
  DOCTOR_APPOINTMENT_HISTORY: '/doctor/appointment-history',
}
```

---

### ✅ Issue 3: LoginScreen Using Hardcoded URL Instead of Config
**Problem:** LoginScreen defined its own API_BASE_URL instead of using centralized config
```javascript
// BEFORE (Bad Practice)
const API_BASE_URL = 'https://spiderdesk.asia/healto/public/api/';

// AFTER (Best Practice)
import { API_CONFIG, getApiUrl } from '../Config/ApiConfig';
```

---

### ✅ Issue 4: Insufficient Error Handling
**Problem:** Limited error messages and no response validation
**Solution:** Enhanced error handling with:
- Response status checking (401, 400, 422)
- Proper error message extraction from API response
- Network error detection
- Detailed console logging for debugging

---

### ✅ Issue 5: Missing Headers Configuration
**Problem:** axios.post() called without proper headers
**Solution:** Added explicit headers matching API requirements
```javascript
headers: {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
}
```

---

## API Endpoint Details (From Postman Collection)

### Doctor Login
- **Method:** POST
- **URL:** `https://spiderdesk.asia/healto/public/api/doctor/login`
- **Payload:**
  ```json
  {
    "username": "Sanjay",
    "password": "hospital"
  }
  ```
- **Expected Response:**
  ```json
  {
    "success": true,
    "message": "Login successful",
    "token": "eyJ...",
    "data": {
      "id": 1,
      "name": "Sanjay",
      "email": "...",
      "phone": "..."
    }
  }
  ```

---

## Files Modified

### 1. `src/Config/ApiConfig.js`
- ✅ Updated BASE_URL from `/healto/api` to `/healto/public/api`
- ✅ Added comprehensive ENDPOINTS object with all doctor routes
- ✅ Added TIMEOUT constant for API requests

### 2. `src/Screens/LoginScreen.js`
- ✅ Import API_CONFIG and getApiUrl from centralized config
- ✅ Remove hardcoded API_BASE_URL
- ✅ Updated handleSignIn to:
  - Use `API_CONFIG.BASE_URL` and `API_CONFIG.ENDPOINTS.DOCTOR_LOGIN`
  - Add proper axios headers
  - Validate response.data.success flag
  - Extract token and user data correctly
  - Save to `doctorLoginSession` key (changed from `userLoginData`)
  - Provide detailed error handling and messages

---

## Testing Instructions

### 1. Clear Previous Data
```bash
# Remove old AsyncStorage data
npm run android  # and uninstall app from device/emulator
# or
npm run ios     # and remove app from simulator
```

### 2. Test Login
- **Username:** `Sanjay`
- **Password:** `hospital`
- **Expected Result:** Login success toast and navigation to dashboard

### 3. Verify Console Logs
Look for:
```
=== DOCTOR LOGIN ===
URL: https://spiderdesk.asia/healto/public/api/doctor/login
Payload: {username: "Sanjay", password: "hospital"}
====================

=== LOGIN SUCCESS ===
Status: 200
Response Data: {success: true, token: "...", data: {...}}
====================
```

---

## Key Changes in Login Flow

### Before (Broken)
```
❌ Hardcoded API_BASE_URL
❌ Wrong base URL (/healto/api)
❌ No header configuration
❌ Limited error handling
❌ Saved to wrong AsyncStorage key
```

### After (Fixed)
```
✅ Centralized API_CONFIG
✅ Correct base URL (/healto/public/api)
✅ Proper headers in axios call
✅ Comprehensive error handling
✅ Proper response validation
✅ Saved to doctorLoginSession key
```

---

## Next Steps

### For Other Screens/Services
Now that API config is centralized, other screens should:

1. Import from `ApiConfig.js`:
   ```javascript
   import { API_CONFIG, getApiUrl } from '../Config/ApiConfig';
   ```

2. Use endpoints:
   ```javascript
   const dashboardUrl = getApiUrl(API_CONFIG.ENDPOINTS.DOCTOR_DASHBOARD);
   ```

3. Example for other doctor endpoints:
   ```javascript
   // Get doctor profile
   const profileUrl = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DOCTOR_PROFILE}`;

   // Get today's appointments
   const appointmentsUrl = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DOCTOR_TODAY_APPOINTMENTS}`;
   ```

---

## Debugging Tips

If login still fails:

### 1. Check Network Connection
- Verify device/emulator has internet access
- Test with Postman using same credentials first

### 2. Check Console Logs
- Metro terminal should show the detailed login logs
- Look for actual error message from API response

### 3. Verify Credentials
- Username: **Sanjay** (case-sensitive)
- Password: **hospital** (case-sensitive)

### 4. Check AsyncStorage
- Open React Native debugger
- Navigate to Storage > AsyncStorage
- Should see `doctorLoginSession` key after successful login

### 5. API Response Issues
- If getting 401: Invalid credentials provided
- If getting 400: Missing required fields
- If getting 500: Server error (contact backend team)

---

## Configuration Reference

### Complete API Config Structure
```javascript
{
  BASE_URL: 'https://spiderdesk.asia/healto/public/api',
  ENDPOINTS: {
    DOCTOR_LOGIN: '/doctor/login',
    // ... other endpoints
  },
  TIMEOUT: 10000 // 10 seconds
}
```

### Session Storage Structure
```javascript
// Key: doctorLoginSession
{
  isLoggedIn: true,
  token: "eyJ0eXAiOiJKV1QiLCJhbGc...",
  userData: {
    id: 1,
    name: "Sanjay",
    email: "...",
    phone: "..."
  },
  loginTime: "2025-12-04T12:34:56.000Z",
  username: "Sanjay"
}
```

---

## Support

For issues:
1. Check the console logs first
2. Review this document's "Debugging Tips" section
3. Compare your request with Postman collection
4. Verify network connectivity
