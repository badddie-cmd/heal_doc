// API Configuration
export const API_CONFIG = {
  // Updated to match Postman collection base URL
  BASE_URL: 'https://spidermart.in/healto/public/api',

  // API Endpoints
  ENDPOINTS: {
    DOCTOR_LOGIN: '/doctor/login',
    DOCTOR_LOGOUT: '/doctor/logout',
    DOCTOR_PROFILE: '/doctor/profile',
    DOCTOR_EDIT: '/doctor/edit',
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
    DOCTOR_INACTIVE: '/doctor/inactive',
    DOCTOR_UPDATE: '/doctor/update-profile',
    DOCTOR_APPOINTMENT_HISTORY: '/doctor/appointment-history',
  },

  // Request timeout in milliseconds
  TIMEOUT: 10000,
};

// Helper function to get full API URL
export const getApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};


