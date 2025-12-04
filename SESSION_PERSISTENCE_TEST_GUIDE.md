# Session Persistence Testing Guide

## What Was Fixed

The session data structure extraction in `LoginScreen.js` was corrected. Previously, the entire API response data object was being saved instead of just the doctor object, causing session validation to fail.

**One-line fix:** `userData: data` → `userData: data.doctor`

## How to Test

### Prerequisites
- Clear your app cache before testing
- Have the app open with Metro bundler running
- Have access to console logs (check Metro terminal output)

### Test 1: Verify Initial Login Works ✅

**Steps:**
1. Open the Healto-Doctor app (or restart it if already open)
2. You should see Welcome screen
3. Enter credentials:
   - Username: `Sanjay`
   - Password: `sanjayhospital`
4. Tap "Sign In"

**Expected Result:**
```
=== DOCTOR LOGIN ===
URL: https://spiderdesk.asia/healto/public/api/doctor/login
Payload: {username: 'Sanjay', password: 'sanjayhospital'}
====================

=== LOGIN SUCCESS ===
Status: 200
Response Data: { success: true, message: 'Login successful', token: 'e4f76e9...', data: {...} }
====================

💾 Saving login session...
✅ Login session saved successfully
👨‍⚕️ Doctor: Sanjay        ← THIS SHOULD NOW SHOW "Sanjay" (NOT "undefined")
🔑 Token present: true    ← THIS SHOULD NOW BE "true" (NOT "false")
```

**Verification Checklist:**
- [ ] Login succeeds with 200 status
- [ ] Console shows "Doctor: Sanjay" (not "undefined")
- [ ] Console shows "Token present: true" (not "false")
- [ ] App navigates to Home/Dashboard after 1 second
- [ ] Success toast shows "Welcome back, Dr. Sanjay!"

### Test 2: Verify Session Persists on App Restart 🔄

**Critical Test - This is the main issue that was fixed**

**Steps:**
1. Complete Test 1 successfully (app is on Home/Dashboard)
2. **Close the app completely** (swipe it away from recents, not just pressing home)
3. Wait 2 seconds
4. **Reopen the app** (tap the app icon)

**Expected Result:**

In Metro console, you should see:

```
=== CHECKING LOGIN STATUS ===

🔍 Session validity: ✅ Valid

✅ Valid session found, navigating to home
```

Then the app should:
- **NOT** show Welcome/Login screen
- **Directly show Home/Dashboard**
- **No prompt to login again**

**Verification Checklist:**
- [ ] App does NOT show Welcome screen
- [ ] App does NOT show Login screen
- [ ] App directly shows Home/Dashboard
- [ ] Console shows "Session validity: ✅ Valid"
- [ ] You are logged in without re-entering credentials

### Test 3: Verify Session is Cleared on Logout 🚪

**Steps:**
1. From Home/Dashboard (after Test 2)
2. Look for a logout button (usually in Profile or Settings)
3. Tap Logout

**Expected Result:**
```
=== LOGOUT ===
🚪 Starting logout process...
🗑️ Clearing login session...
✅ Login session cleared
🗑️ Doctor ID removed from storage
✅ Logout completed successfully
🗑️ All user data cleared from storage
===============
```

Then:
- App navigates to Welcome/Login screen
- Session data is cleared from AsyncStorage

**Verification Checklist:**
- [ ] Console shows logout messages
- [ ] App shows Welcome/Login screen after logout
- [ ] Can still login again (Test 1)

### Test 4: Verify Storage Content (Optional - Advanced)

If you want to verify the AsyncStorage content directly:

**Method 1: React Native Debugger**
```javascript
// In your app, add a temporary debug function
import AsyncStorage from '@react-native-async-storage/async-storage';

const debugStorage = async () => {
  const session = await AsyncStorage.getItem('doctorLoginSession');
  console.log('Stored Session:', JSON.parse(session));
};

// Call it after login
debugStorage();
```

**Expected Output:**
```javascript
{
  isLoggedIn: true,
  token: 'e4f76e9acdd3fb49c8cec5ba7ef1f09e',
  userData: {
    id: 1,
    name: 'Sanjay',
    email: 'sanjay.m@spiderindia.net',
    phone: '+91-9876543210',
    specialization: 'General Practitioner',
    // ... other fields
  },
  loginTime: '2025-12-04T12:34:56.000Z',
  username: 'Sanjay'
}
```

**Key things to verify:**
- [ ] `token` has a value (not empty)
- [ ] `userData.id` exists and equals 1
- [ ] `userData.name` equals "Sanjay"
- [ ] `isLoggedIn` equals true

## Troubleshooting

### Issue: Still Getting "Doctor: undefined" After Fix

**Cause:** You might be running an old build. Clear the cache:

```bash
# Clear Metro cache
npm start -- --reset-cache

# In another terminal, rebuild the app
npm run android   # or npm run ios
```

### Issue: Session Still Not Persisting

**Cause:** AsyncStorage might not be configured correctly or app state not being preserved.

**Steps to debug:**
1. Check Metro console for "❌ Error checking login status" messages
2. Verify no errors appear in the "=== CHECKING LOGIN STATUS ===" section
3. Make sure you're fully closing the app (not just backgrounding it)

### Issue: Login Works But App Crashes on Restart

**Cause:** Could be a crash in session restoration logic.

**Steps to debug:**
1. Check if there are any console errors in the "=== CHECKING LOGIN STATUS ===" section
2. Verify the session structure in AsyncStorage (Test 4)
3. Check App.jsx's `checkLoginStatus()` function for errors

## Success Indicators ✅

After this fix, you should see:

**After Login:**
```
👨‍⚕️ Doctor: Sanjay
🔑 Token present: true
```

**After App Restart:**
```
🔍 Session validity: ✅ Valid
✅ Valid session found, navigating to home
```

**After Logout:**
```
✅ Logout completed successfully
🗑️ All user data cleared from storage
```

If you see all of these, the session persistence is working correctly! 🎉

## Next Steps

Once this is verified working:

1. Test on a real Android device (not just emulator)
2. Test on iOS simulator if available
3. Test with different user accounts
4. Test edge cases:
   - Force quit app during login
   - Kill app and restart
   - Clear app cache between tests
   - Network disconnection scenarios
