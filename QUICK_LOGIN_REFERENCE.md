# Quick Login Reference - Healto-Doctor

## What Was Fixed

### ✅ 5 Critical Issues Resolved:

| Issue | Before | After |
|-------|--------|-------|
| **Base URL** | `/healto/api` ❌ | `/healto/public/api` ✅ |
| **Config** | Hardcoded in screen | Centralized in `ApiConfig.js` |
| **Endpoints** | Missing | 16 endpoints defined |
| **Headers** | None | `Content-Type` & `Accept` added |
| **Error Handling** | Basic | Full status code handling |

---

## Files Changed

```
Healto-Doctor/
├── src/Config/ApiConfig.js (UPDATED)
│   └─ Fixed BASE_URL
│   └─ Added all doctor endpoints
│
├── src/Screens/LoginScreen.js (UPDATED)
│   └─ Use centralized config
│   └─ Add proper headers
│   └─ Better error handling
│
└── LOGIN_FIX_GUIDE.md (NEW)
    └─ Complete troubleshooting guide
```

---

## Test Login

**Username:** `Sanjay`
**Password:** `hospital`

### Expected Console Output:
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

## API Endpoint Used

```
POST https://spiderdesk.asia/healto/public/api/doctor/login

Request:
{
  "username": "Sanjay",
  "password": "hospital"
}

Response:
{
  "success": true,
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "data": {
    "id": 1,
    "name": "Sanjay",
    "email": "...",
    "phone": "..."
  }
}
```

---

## Key Code Changes

### Before ❌
```javascript
const API_BASE_URL = 'https://spiderdesk.asia/healto/public/api/';
const response = await axios.post(`${API_BASE_URL}doctor/login`, loginData);
```

### After ✅
```javascript
import { API_CONFIG } from '../Config/ApiConfig';

const loginUrl = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DOCTOR_LOGIN}`;
const response = await axios.post(loginUrl, loginPayload, {
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});
```

---

## AsyncStorage Key Changed

| Before | After |
|--------|-------|
| `userLoginData` | `doctorLoginSession` |

---

## Troubleshooting

### ❌ Error: "Invalid username or password" (401)
- Check username and password spelling (case-sensitive)
- Username: **Sanjay** (not "sanjay")
- Password: **hospital**

### ❌ Error: "Network error"
- Check internet connection on device/emulator
- Verify API URL is correct in console logs
- Test in Postman first

### ❌ No response received
- Check if API is up: `https://spiderdesk.asia/healto/public/api/doctor/login`
- Verify timeout is set correctly (10000ms)
- Check network tab in React Native debugger

### ✅ Success
- Console should show "=== LOGIN SUCCESS ===" with token
- Toast message: "Login Successful"
- Should navigate to dashboard after 1 second
- Check AsyncStorage for `doctorLoginSession` key

---

## Using Other Endpoints

Now that config is centralized, other screens can easily use other endpoints:

```javascript
import { API_CONFIG } from '../Config/ApiConfig';

// Doctor Dashboard
const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DOCTOR_DASHBOARD}`;

// Doctor Profile
const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DOCTOR_PROFILE}`;

// Today's Appointments
const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DOCTOR_TODAY_APPOINTMENTS}`;
```

---

## Current API Configuration

```javascript
BASE_URL: 'https://spiderdesk.asia/healto/public/api'

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

TIMEOUT: 10000 (milliseconds)
```

---

## Need More Details?

See `LOGIN_FIX_GUIDE.md` for:
- Detailed issue explanations
- Complete error handling reference
- Session data structure
- Next steps for other screens
