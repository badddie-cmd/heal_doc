import { API_CONFIG, getApiUrl } from '../Config/ApiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Helper function to get auth token from storage
async function getAuthToken() {
  try {
    const sessionData = await AsyncStorage.getItem('doctorLoginSession');
    if (sessionData) {
      const parsed = JSON.parse(sessionData);
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
    console.log('🔐 Token found:', !!token);

    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    return await this.makeRequest(
      API_CONFIG.ENDPOINTS.DOCTOR_PROFILE,
      'GET',
      null,
      headers
    );
  }

  // Get all appointments
  static async getDoctorAppointments() {
    console.log('🔍 Making API call to doctor/appointments');
    console.log('🔍 Full URL:', getApiUrl(API_CONFIG.ENDPOINTS.DOCTOR_APPOINTMENTS));

    // Get token from storage and include in headers
    const token = await getAuthToken();
    console.log('🔐 Token found:', !!token);

    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    return await this.makeRequest(
      API_CONFIG.ENDPOINTS.DOCTOR_APPOINTMENTS,
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

  // Update doctor profile
  static async updateDoctorProfile(data) {
    console.log('🔍 Making API call to doctor-update with data:', data);
    console.log('🔍 Full URL:', `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DOCTOR_UPDATE}`);

    // Check if profile_image is included (file upload)
    if (data.profile_image && typeof data.profile_image === 'object' && data.profile_image.uri) {
      return await this.updateDoctorProfileWithImage(data);
    } else {
      return await this.makeRequest(
        API_CONFIG.ENDPOINTS.DOCTOR_UPDATE,
        'POST',
        data
      );
    }
  }

  // Update doctor profile with image upload
  static async updateDoctorProfileWithImage(data) {
    try {
      const url = getApiUrl(API_CONFIG.ENDPOINTS.DOCTOR_UPDATE);
      console.log('🌐 Making image upload request to:', url);
      
      // Create FormData for file upload
      const formData = new FormData();
      
      // Add all text fields
      Object.keys(data).forEach(key => {
        if (key !== 'profile_image' && data[key] !== null && data[key] !== undefined) {
          formData.append(key, data[key]);
        }
      });
      
      // Add image file
      if (data.profile_image) {
        formData.append('profile_image', {
          uri: data.profile_image.uri,
          type: data.profile_image.type || 'image/jpeg',
          name: data.profile_image.name || 'profile_image.jpg'
        });
      }

      console.log('📤 FormData prepared for image upload');

      const config = {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json',
        },
        body: formData,
      };

      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), API_CONFIG.TIMEOUT);
      });

      // Race between fetch and timeout
      const response = await Promise.race([
        fetch(url, config),
        timeoutPromise
      ]);
      
      console.log('📥 Image upload response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ Image upload error response body:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Image upload response data:', result);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error('❌ Image Upload Error:', error);
      return {
        success: false,
        error: error.message || 'An error occurred while uploading the image',
      };
    }
  }
}

export default ApiService;
