import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
export const STORAGE_KEYS = {
  DOCTOR_LOGIN_SESSION: 'doctorLoginSession',
  DOCTOR_ID: 'doctor_id',
  USER_DATA: 'user_data',
  AUTH_TOKEN: 'auth_token',
};

// Doctor ID management
export const setDoctorId = async (doctorId) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.DOCTOR_ID, doctorId);
    console.log('✅ Doctor ID saved to storage:', doctorId);
    return true;
  } catch (error) {
    console.error('❌ Error saving doctor ID:', error);
    return false;
  }
};

export const getDoctorId = async () => {
  try {
    const doctorId = await AsyncStorage.getItem(STORAGE_KEYS.DOCTOR_ID);
    console.log('🔍 Doctor ID retrieved from storage:', doctorId);
    return doctorId;
  } catch (error) {
    console.error('❌ Error retrieving doctor ID:', error);
    return null;
  }
};

export const removeDoctorId = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.DOCTOR_ID);
    console.log('🗑️ Doctor ID removed from storage');
    return true;
  } catch (error) {
    console.error('❌ Error removing doctor ID:', error);
    return false;
  }
};

// Generic storage functions
export const setStorageItem = async (key, value) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    console.log(`✅ ${key} saved to storage:`, value);
    return true;
  } catch (error) {
    console.error(`❌ Error saving ${key}:`, error);
    return false;
  }
};

export const getStorageItem = async (key) => {
  try {
    const item = await AsyncStorage.getItem(key);
    const parsedItem = item ? JSON.parse(item) : null;
    console.log(`🔍 ${key} retrieved from storage:`, parsedItem);
    return parsedItem;
  } catch (error) {
    console.error(`❌ Error retrieving ${key}:`, error);
    return null;
  }
};

export const clearStorage = async () => {
  try {
    await AsyncStorage.clear();
    console.log('🗑️ All storage cleared');
    return true;
  } catch (error) {
    console.error('❌ Error clearing storage:', error);
    return false;
  }
};

// Session management functions
export const saveLoginSession = async (sessionData) => {
  try {
    console.log('💾 Saving login session...');
    console.log('🔐 DEBUG - Session data received:', {
      isLoggedIn: sessionData?.isLoggedIn,
      tokenValue: sessionData?.token,
      tokenPresent: !!sessionData?.token,
      userId: sessionData?.userData?.id,
      userName: sessionData?.userData?.name,
    });
    await AsyncStorage.setItem(
      STORAGE_KEYS.DOCTOR_LOGIN_SESSION,
      JSON.stringify(sessionData)
    );
    console.log('✅ Login session saved successfully');
    console.log('👨‍⚕️ Doctor:', sessionData?.userData?.name);
    console.log('🔑 Token present:', !!sessionData?.token);
    console.log('🔐 DEBUG - Stored data check:', JSON.stringify(sessionData).substring(0, 100) + '...');
    return true;
  } catch (error) {
    console.error('❌ Error saving login session:', error);
    return false;
  }
};

export const getLoginSession = async () => {
  try {
    const sessionData = await AsyncStorage.getItem(STORAGE_KEYS.DOCTOR_LOGIN_SESSION);

    if (!sessionData) {
      console.log('⚠️ No login session found');
      return null;
    }

    const parsedSession = JSON.parse(sessionData);
    console.log('✅ Login session retrieved');
    console.log('👨‍⚕️ Doctor:', parsedSession?.userData?.name);
    console.log('🔑 Token present:', !!parsedSession?.token);
    console.log('🔐 DEBUG - Retrieved session full check:', {
      tokenValue: parsedSession?.token,
      tokenType: typeof parsedSession?.token,
      userId: parsedSession?.userData?.id,
    });
    return parsedSession;
  } catch (error) {
    console.error('❌ Error retrieving login session:', error);
    return null;
  }
};

export const isSessionValid = async () => {
  try {
    const session = await getLoginSession();

    if (!session) {
      console.log('❌ No session found');
      return false;
    }

    // Check all required fields
    const isValid =
      session.isLoggedIn === true &&
      !!session.token &&
      !!session.userData &&
      !!session.userData.id;

    console.log('🔍 Session validity:', isValid ? '✅ Valid' : '❌ Invalid');
    return isValid;
  } catch (error) {
    console.error('❌ Error validating session:', error);
    return false;
  }
};

export const clearLoginSession = async () => {
  try {
    console.log('🗑️ Clearing login session...');
    await AsyncStorage.removeItem(STORAGE_KEYS.DOCTOR_LOGIN_SESSION);
    console.log('✅ Login session cleared');
    return true;
  } catch (error) {
    console.error('❌ Error clearing login session:', error);
    return false;
  }
};

// Logout function - clears all user data and login status
export const performLogout = async () => {
  try {
    console.log('🚪 Starting logout process...');

    // Clear login session
    await clearLoginSession();

    // Clear other user data
    await removeDoctorId();

    console.log('✅ Logout completed successfully');
    console.log('🗑️ All user data cleared from storage');

    return {
      success: true,
      message: 'Logout completed successfully'
    };
  } catch (error) {
    console.error('❌ Error during logout:', error);
    return {
      success: false,
      message: error.message || 'Failed to logout'
    };
  }
};
