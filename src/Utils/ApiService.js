import { API_CONFIG, getApiUrl } from '../Config/ApiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Helper function to get auth token from storage
async function getAuthToken() {
  try {
    const sessionData = await AsyncStorage.getItem('doctorLoginSession');
    if (sessionData) {
      const parsed = JSON.parse(sessionData);
      console.log('parsed token:', parsed)
      return parsed.token;
    }
    return null;
  } catch (error) {
    console.error('❌ Error getting auth token:', error);
    return null;
  }
}

// API Service for making HTTP requests
export class ApiService {
  static async makeRequest(endpoint, method = 'POST', data = null, headers = {}) {
    try {
      const url = getApiUrl(endpoint);
      console.log('🌐 Making request to:', url);
      console.log('📤 Request method:', method);
      console.log('📤 Request data:', data);
      
      const config = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...headers,
        },
      };

      if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        config.body = JSON.stringify(data);
      }

      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), API_CONFIG.TIMEOUT);
      });

      // Race between fetch and timeout
      const response = await Promise.race([
        fetch(url, config),
        timeoutPromise
      ]);
      
      console.log('📥 Response status:', response.status);
      console.log('📥 Response headers:', response.headers);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ Error response body:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Response data:', result);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error('❌ API Request Error:', error);
      return {
        success: false,
        error: error.message || 'An error occurred while making the request',
      };
    }
  }

  // Start appointment
  static async startAppointment(appointmentId) {
    console.log('🔍 Making API call to doctor/appointments/:id/start');
    console.log('🔍 Appointment ID:', appointmentId);
    console.log('🔍 Full URL:', getApiUrl(`/doctor/appointments/${appointmentId}/start`));

    // Get token from storage and include in headers
    const token = await getAuthToken();
    console.log('🔐 Token found:', !!token);

    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    return await this.makeRequest(
      `/doctor/appointments/${appointmentId}/start`,
      'POST',
      null,
      headers
    );
  }

  // End appointment
  static async endAppointment(appointmentId) {
    console.log('🔍 Making API call to doctor/appointments/:id/end');
    console.log('🔍 Appointment ID:', appointmentId);
    console.log('🔍 Full URL:', getApiUrl(`/doctor/appointments/${appointmentId}/end`));

    // Get token from storage and include in headers
    const token = await getAuthToken();
    console.log('🔐 Token found:', !!token);

    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    return await this.makeRequest(
      `/doctor/appointments/${appointmentId}/end`,
      'POST',
      null,
      headers
    );
  }

  // ✅ UPDATED: Mark doctor as unavailable (with start/end dates)
  static async markDoctorUnavailable(reason, unavailableFrom, unavailableUntil) {
    console.log('🔍 Making API call to doctor/mark-unavailable');
    console.log('🔍 Parameters:', { reason, unavailableFrom, unavailableUntil });
    console.log('🔍 Full URL:', getApiUrl('/doctor/mark-unavailable'));

    // Get token from storage and include in headers
    const token = await getAuthToken();
    console.log('🔐 Token found:', !!token);

    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    // ✅ NEW: Use FormData for multipart/form-data request
    try {
      const url = getApiUrl('/doctor/mark-unavailable');
      console.log('🌐 Making form-data request to:', url);

      const formData = new FormData();
      formData.append('reason', reason);
      formData.append('unavailable_from', unavailableFrom);  // "2026-01-25 09:00:00"
      formData.append('unavailable_until', unavailableUntil);  // "2026-01-27 18:00:00"

      console.log('📋 FormData prepared with:', { reason, unavailableFrom, unavailableUntil });

      const config = {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          ...headers,
          // Don't set Content-Type header - fetch will set it automatically with boundary for FormData
        },
        body: formData,
      };

      console.log('📤 FormData prepared for submission');

      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 30000);  // 30 second timeout
      });

      // Race between fetch and timeout
      const response = await Promise.race([
        fetch(url, config),
        timeoutPromise
      ]);

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ Error response body:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Response data:', result);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error('❌ API Request Error:', error);
      return {
        success: false,
        error: error.message || 'An error occurred while marking unavailable',
      };
    }
  }

  // Mark doctor as available
  static async markDoctorAvailable() {
    console.log('🔍 Making API call to doctor/mark-available');
    console.log('🔍 Full URL:', getApiUrl('/doctor/mark-available'));

    // Get token from storage and include in headers
    const token = await getAuthToken();
    console.log('🔐 Token found:', !!token);

    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    return await this.makeRequest(
      '/doctor/mark-available',
      'POST',
      null,
      headers
    );
  }

  // Update appointment with delay time
  static async updateAppointment(appointmentId, delayTime) {
    const data = {
      appointment_id: appointmentId,
      delay_time: delayTime,
    };

    return await this.makeRequest(
      API_CONFIG.ENDPOINTS.APPOINTMENT_UPDATE,
      'POST',
      data
    );
  }

  // Get doctor profile (logged in user)
  static async getDoctorProfile() {
    console.log('🔍 Making API call to doctor/profile');
    console.log('🔍 Full URL:', getApiUrl(API_CONFIG.ENDPOINTS.DOCTOR_PROFILE));

    // Get token from storage and include in headers
    const token = await getAuthToken();
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    return await this.makeRequest(
      API_CONFIG.ENDPOINTS.DOCTOR_PROFILE,
      'GET',
      null,
      headers
    );
  }

  // Get all appointments with optional filters
  static async getDoctorAppointments(filters = {}) {
    console.log('🔍 Making API call to doctor/appointments');

    // Build query string from filters
    const queryParams = new URLSearchParams();

    if (filters.status) queryParams.append('status', filters.status);
    if (filters.date) queryParams.append('date', filters.date);
    if (filters.start_date) queryParams.append('start_date', filters.start_date);
    if (filters.end_date) queryParams.append('end_date', filters.end_date);
    if (filters.patient_name) queryParams.append('patient_name', filters.patient_name);
    if (filters.sort_by) queryParams.append('sort_by', filters.sort_by);
    if (filters.page) queryParams.append('page', filters.page);
    if (filters.per_page) queryParams.append('per_page', filters.per_page);

    const endpoint = `${API_CONFIG.ENDPOINTS.DOCTOR_APPOINTMENTS}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    console.log('🔍 Full URL:', getApiUrl(endpoint));
    console.log('📊 Applied filters:', filters);

    // Get token from storage and include in headers
    const token = await getAuthToken();
    console.log('🔐 Token found:', !!token);

    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    return await this.makeRequest(
      endpoint,
      'GET',
      null,
      headers
    );
  }

  // Get today's appointments only
  static async getDoctorTodayAppointments() {
    console.log('🔍 Making API call to doctor/today-appointments');
    console.log('🔍 Full URL:', getApiUrl(API_CONFIG.ENDPOINTS.DOCTOR_TODAY_APPOINTMENTS));

    // Get token from storage and include in headers
    const token = await getAuthToken();

    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    return await this.makeRequest(
      API_CONFIG.ENDPOINTS.DOCTOR_TODAY_APPOINTMENTS,
      'GET',
      null,
      headers
    );
  }

  // Get appointment details by ID
  static async getAppointmentDetails(appointmentId) {
    console.log('🔍 Making API call to doctor/appointments/:id');
    console.log('🔍 Appointment ID:', appointmentId);
    console.log('🔍 Full URL:', getApiUrl(`/doctor/appointments/${appointmentId}`));

    // Get token from storage and include in headers
    const token = await getAuthToken();
    console.log('🔐 Token found:', !!token);

    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    return await this.makeRequest(
      `/doctor/appointments/${appointmentId}`,
      'GET',
      null,
      headers
    );
  }

  // Get appointment history (completed appointments)
  static async getAppointmentHistory() {
    console.log('🔍 Making API call to doctor/appointment-history');
    console.log('🔍 Full URL:', getApiUrl('/doctor/appointment-history'));

    // Get token from storage and include in headers
    const token = await getAuthToken();
    console.log('🔐 Token found:', !!token);

    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    return await this.makeRequest(
      '/doctor/appointment-history',
      'GET',
      null,
      headers
    );
  }

  // Get doctor specializations for dropdown
  static async getDoctorSpecializations() {
    console.log('🔍 Making API call to doctor/specializations');
    console.log('🔍 Full URL:', getApiUrl('/doctor/specializations'));

    // Get token from storage and include in headers
    const token = await getAuthToken();
    console.log('🔐 Token found:', !!token);

    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    return await this.makeRequest(
      '/doctor/specializations',
      'GET',
      null,
      headers
    );
  }

  // Get doctor edit data
  static async getDoctorEditData(doctorId) {
    // For GET requests, we need to append the doctor_id as a query parameter
    const endpoint = `${API_CONFIG.ENDPOINTS.DOCTOR_EDIT}?doctor_id=${doctorId}`;

    console.log('🔍 Making API call to doctor-edit with doctor_id:', doctorId);
    console.log('🔍 Full URL:', `${API_CONFIG.BASE_URL}${endpoint}`);

    return await this.makeRequest(
      endpoint,
      'GET',
      null // No data needed for GET request
    );
  }

  // Mark doctor as inactive
  static async markDoctorInactive(doctorId, startDate, endDate, content, clinicId = 1) {
    const data = {
      doctor_id: doctorId,
      start_date: startDate,
      end_date: endDate,
      content: content,
      clinic_id: clinicId
    };

    console.log('🔍 Making API call to doctor-inactive with data:', data);
    console.log('🔍 Full URL:', `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DOCTOR_INACTIVE}`);

    return await this.makeRequest(
      API_CONFIG.ENDPOINTS.DOCTOR_INACTIVE,
      'POST',
      data
    );
  }

  // Update doctor profile (handles both FormData and plain objects)
  static async updateDoctorProfile(data) {
    console.log('🔍 Making API call to doctor/update-profile');
    console.log('🔍 Full URL:', `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DOCTOR_UPDATE}`);

    // Get token from storage and include in headers
    const token = await getAuthToken();
    console.log('🔐 Token found:', !!token);
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    // Check if data is FormData (used when form submission includes multiple fields)
    if (data instanceof FormData) {
      console.log('📋 Data is FormData, handling with proper form-data headers');
      return await this.updateDoctorProfileWithFormData(data, headers);
    } else {
      // For plain objects, use makeRequest
      console.log('📋 Data is plain object, using makeRequest');
      return await this.makeRequest(
        API_CONFIG.ENDPOINTS.DOCTOR_UPDATE,
        'POST',
        data,
        headers
      );
    }
  }

  // Update doctor profile with FormData (for multipart/form-data requests)
  static async updateDoctorProfileWithFormData(formData, headers) {
    try {
      const url = getApiUrl(API_CONFIG.ENDPOINTS.DOCTOR_UPDATE);
      console.log('🌐 Making form-data request to:', url);

      const config = {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          ...headers,
          // Don't set Content-Type header - fetch will set it automatically with boundary for FormData
        },
        body: formData,
      };

      console.log('📤 FormData prepared for submission');

      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), API_CONFIG.TIMEOUT);
      });

      // Race between fetch and timeout
      const response = await Promise.race([
        fetch(url, config),
        timeoutPromise
      ]);

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ Error response body:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Response data:', result);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error('❌ API Request Error:', error);
      return {
        success: false,
        error: error.message || 'An error occurred while updating the profile',
      };
    }
  }
}

export default ApiService;
