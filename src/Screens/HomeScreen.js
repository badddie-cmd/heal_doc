import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/FontAwesome5';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { getDoctorId, setDoctorId } from '../Utils/StorageUtils';
import { useTheme } from '../Context/ThemeContext';
import { PoppinsFonts } from '../Config/Fonts';
import { ApiService } from '../Utils/ApiService';
import { API_CONFIG } from '../Config/ApiConfig';

const HomeScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  // State management for dashboard data
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [doctorInfo, setDoctorInfo] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // API Base URL for image URLs (remove /api part for file paths)
  const API_BASE_URL = API_CONFIG.BASE_URL.replace('/public/api', '');
  
  // Always use API calls - no mock data
  const ENABLE_API_CALLS = true;
  
  // Fallback data when API is not available
  const FALLBACK_DATA = {
    total_patients_today: 0,
    pending_patients: 0,
    appointments: []
  };
  


  // Function to fetch dashboard data
  // Helper function to format today's date as "DD MMM, YYYY" (e.g., "04 Dec, 2025")
  const formatTodayDate = () => {
    const today = new Date();
    const days = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = String(today.getDate()).padStart(2, '0');
    const month = days[today.getMonth()];
    const year = today.getFullYear();
    return `${day} ${month}, ${year}`;
  };

  const fetchDashboardData = async (doctorIdParam = null) => {
    try {
      setLoading(true);
      setError(null);

      console.log('=== FETCHING DASHBOARD DATA ===');
      const todayDate = formatTodayDate();
      console.log('📅 Today\'s Date:', todayDate);

      // Call both APIs: doctor profile and appointments
      console.log('📡 Calling API: GET /doctor/profile');
      const profileResponse = await ApiService.getDoctorProfile();

      console.log('📡 Calling API: GET /doctor/appointments');
      const appointmentsResponse = await ApiService.getDoctorAppointments();

      // Check if both API calls were successful
      if (!profileResponse.success) {
        throw new Error(`Failed to fetch doctor profile: ${profileResponse.error}`);
      }

      if (!appointmentsResponse.success) {
        throw new Error(`Failed to fetch appointments: ${appointmentsResponse.error}`);
      }

      // Extract doctor profile data
      const doctorProfileData = profileResponse.data?.data?.doctor;
      if (!doctorProfileData) {
        throw new Error('No doctor profile data in API response');
      }

      console.log('✅ Doctor Profile Retrieved:', doctorProfileData.name);
      setDoctorInfo({
        id: doctorProfileData.id,
        name: doctorProfileData.name,
        email: doctorProfileData.email,
        phone: doctorProfileData.phone,
        profile_image: doctorProfileData.profile_image,
        specialization_id: doctorProfileData.specialization_ids,
        experience_years: doctorProfileData.experience_years,
        qualification: doctorProfileData.qualification,
        rating: doctorProfileData.rating,
        info: doctorProfileData.info,
        gender: doctorProfileData.gender,
        blood_group: doctorProfileData.blood_group,
        address: doctorProfileData.address,
        dob: doctorProfileData.dob,
        reviews: doctorProfileData.reviews,
      });

      // Extract all appointments data
      const allAppointments = appointmentsResponse.data?.data || [];
      console.log('📊 Total Appointments from API:', allAppointments.length);
      console.log('📋 All Appointments:', allAppointments);

      // Filter appointments for today only
      const todayAppointments = allAppointments.filter(apt => {
        console.log(`🔍 Comparing "${apt.appointment_date}" with "${todayDate}"`);
        return apt.appointment_date === todayDate;
      });

      console.log(`📅 Today's Appointments (${todayDate}):`, todayAppointments.length);
      console.log('📅 Today\'s Appointments:', todayAppointments);

      // Calculate statistics from today's appointments
      const totalPatientsToday = todayAppointments.length;
      const pendingPatientsToday = todayAppointments.filter(apt => apt.status === 'scheduled').length;

      console.log('📈 Statistics:');
      console.log(`   Total Patients Today: ${totalPatientsToday}`);
      console.log(`   Pending Patients Today: ${pendingPatientsToday}`);

      // Map appointments to UI format
      const mappedAppointments = todayAppointments.map(apt => ({
        id: apt.id,
        token: apt.token_number,
        patient_name: apt.patient_name,
        patient_image: apt.patient_image,
        patient_phone: apt.patient_phone,
        age: apt.age,
        symptoms: apt.symptoms,
        appointment_time: apt.scheduled_time,
        status: apt.status,
        details: {
          token: apt.token_number,
          description: apt.symptoms,
        },
        patient: {
          name: apt.patient_name,
          age: apt.age,
          profile_image: apt.patient_image,
        },
        sub_patient: {
          name: apt.patient_name,
          age: apt.age,
        }
      }));

      // Sort by scheduled time (earliest first)
      mappedAppointments.sort((a, b) => {
        const timeA = a.appointment_time || '00:00';
        const timeB = b.appointment_time || '00:00';
        return timeA.localeCompare(timeB);
      });

      console.log('✅ Mapped Appointments:', mappedAppointments);

      // Prepare final dashboard data
      const finalDashboardData = {
        total_patients_today: totalPatientsToday,
        pending_patients: pendingPatientsToday,
        completed_patients: todayAppointments.filter(apt => apt.status === 'completed').length,
        appointments: mappedAppointments
      };

      console.log('📊 Final Dashboard Data:', finalDashboardData);
      setDashboardData(finalDashboardData);
      console.log('=== DASHBOARD DATA FETCH COMPLETE ===');

    } catch (err) {
      console.error('❌ Error fetching dashboard data:', err.message);
      console.error('❌ Error details:', {
        message: err.message,
        stack: err.stack
      });
      setError(err.message || 'Failed to fetch dashboard data');
      Alert.alert('Error', 'Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Navigation function for appointment details
  const navigateToAppointmentDetails = (appointment) => {
    console.log('📱 Navigating to appointment details:', appointment);
    navigation.navigate('AppointmentDetails', { appointment });
  };

  // Fetch data on component mount
  useEffect(() => {
    const initializeData = async () => {
      // Load doctor info first
      await loadDoctorInfo();
    };
    
    initializeData();
  }, []);

  // Fetch dashboard data when doctorInfo is available
  useEffect(() => {
    if (doctorInfo?.id) {
      fetchDashboardData();
    }
  }, [doctorInfo]);

  // Listen for navigation focus to refresh data when returning from ProfileScreen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('🔄 HomeScreen focused - refreshing data...');
      const refreshData = async () => {
        await loadDoctorInfo();
        if (doctorInfo?.id) {
          await fetchDashboardData();
        }
      };
      refreshData();
    });

    return unsubscribe;
  }, [navigation, doctorInfo]);

  // Handle refresh parameter from ProfileScreen
  useEffect(() => {
    if (route?.params?.refresh) {
      console.log('🔄 Refresh parameter received - refreshing all data...');
      refreshAllData();
      // Clear the refresh parameter
      navigation.setParams({ refresh: false });
    }
  }, [route?.params?.refresh]);

  // Function to load doctor information from API and return it
  const loadDoctorInfoAndReturn = async () => {
    try {
      console.log('🔍 Loading Doctor Information from API...');

      // Get doctor ID from login session data
      const sessionData = await AsyncStorage.getItem('doctorLoginSession');
      console.log('🔍 Retrieved doctorLoginSession:', !!sessionData ? 'Found' : 'Not found');

      if (!sessionData) {
        throw new Error('Login session not found in storage');
      }

      const parsedData = JSON.parse(sessionData);
      if (!parsedData.userData || !parsedData.userData.id) {
        throw new Error('Doctor ID not found in login session');
      }

      const doctorId = parsedData.userData.id;
      console.log('🔍 Retrieved doctor ID from session:', doctorId);

      // Call API to get doctor edit data
      const response = await ApiService.getDoctorEditData(doctorId);
      console.log('🔍 API Response:', JSON.stringify(response, null, 2));
      
      if (response.success) {
        console.log('✅ API call successful');
        if (response.data && response.data.status) {
          const doctorData = response.data.data;
          console.log('🩺 Doctor Data from API:', doctorData);
          
          // Extract doctor information (same structure as ProfileScreen)
          const doctorInfo = {
            id: doctorData.id,
            name: doctorData.name,
            email: doctorData.email,
            phone: doctorData.phone,
            profile_image: doctorData.profile_image,
            specialization_id: doctorData.specialization_id,
            experience_years: doctorData.experience_years,
            qualification: doctorData.qualification,
            rating: doctorData.rating,
            info: doctorData.info,
            gender: doctorData.gender,
            blood_group: doctorData.blood_group,
            address: doctorData.address,
            dob: doctorData.dob,
            reviews: doctorData.reviews,
            clinic_id: doctorData.clinic_id,
            created_at: doctorData.created_at,
            updated_at: doctorData.updated_at
          };
          
          console.log('✅ Extracted Doctor Info:', doctorInfo);
          console.log('👨‍⚕️ Doctor Name:', doctorInfo.name);
          console.log('🎓 Qualification:', doctorInfo.qualification);
          console.log('⏰ Experience:', doctorInfo.experience_years, 'years');
          console.log('⭐ Rating:', doctorInfo.rating);
          console.log('📧 Email:', doctorInfo.email);
          console.log('📱 Phone:', doctorInfo.phone);
          console.log('🏥 Specialization ID:', doctorInfo.specialization_id);
          console.log('📍 Address:', doctorInfo.address);
          console.log('🖼️ Profile Image:', doctorInfo.profile_image);
          console.log('🖼️ Full Image URL:', `${API_BASE_URL.replace('/api', '')}/${doctorInfo.profile_image}`);
          
          setDoctorInfo(doctorInfo);
          
          // Save doctor ID for API calls
          await setDoctorId(doctorData.id.toString());
          console.log('💾 Doctor ID saved:', doctorData.id.toString());
          
          console.log('✅ Doctor information loaded successfully from API');
          return doctorInfo;
        } else {
          console.log('❌ API response data.status is false:', response.data);
          throw new Error(response.data?.message || 'API returned status false');
        }
      } else {
        console.log('❌ API call failed:', response.error);
        throw new Error(response.error || 'Failed to load doctor information');
      }
    } catch (error) {
      console.error('❌ Error loading doctor info:', error);
      setError(error.message);
      throw error;
    }
  };

  // Function to load doctor information from API
  const loadDoctorInfo = async () => {
    try {
      await loadDoctorInfoAndReturn();
    } catch (error) {
      console.error('❌ Error loading doctor info:', error);
      setError(error.message);
    }
  };

  // Pull to refresh function
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      console.log('🔄 Refreshing data...');
      // Load doctor info first, then fetch dashboard data
      await loadDoctorInfo();
      await fetchDashboardData();
      console.log('✅ Data refreshed successfully');
    } catch (error) {
      console.error('❌ Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // General refresh function that can be called from anywhere
  const refreshAllData = async () => {
    try {
      console.log('🔄 Refreshing all data...');
      await loadDoctorInfo();
      if (doctorInfo?.id) {
        await fetchDashboardData();
      }
      console.log('✅ All data refreshed successfully');
    } catch (error) {
      console.error('❌ Error refreshing all data:', error);
    }
  };

  // Log dashboard data whenever it changes
  useEffect(() => {
    if (dashboardData) {
      console.log('📊 Dashboard Data Updated:', dashboardData);
      console.log('📊 Dashboard Data Structure:', JSON.stringify(dashboardData, null, 2));
      console.log('📈 Total Patients Today:', dashboardData.total_patients_today);
      console.log('⏳ Pending Patients:', dashboardData.pending_patients);
      console.log('📅 Appointments Count:', dashboardData.appointments?.length || 0);
      
      if (dashboardData.appointments && dashboardData.appointments.length > 0) {
        console.log('📅 Appointments Details:', dashboardData.appointments);
        // Log each appointment individually
        dashboardData.appointments.forEach((appointment, index) => {
          console.log(`👤 Appointment ${index + 1}:`, {
            name: appointment.patient_name,
            age: appointment.age,
            symptoms: appointment.symptoms,
            time: appointment.appointment_time
          });
        });
      }
    }
  }, [dashboardData]);

  // Loading component
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar 
          barStyle={theme.isDarkMode ? "light-content" : "dark-content"} 
          backgroundColor={theme.colors.background} 
        />
        <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error component
  if (error) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={styles.errorContainer}>
              <Icon name="exclamation-circle" size={60} color="#FF6B8A" />
          <Text style={styles.errorText}>Failed to load dashboard</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchDashboardData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar 
        barStyle={theme.isDarkMode ? "light-content" : "dark-content"} 
        backgroundColor={theme.colors.background} 
      />
      <ScrollView 
        style={[styles.scrollView, { paddingTop: insets.top }]} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        
        {/* Header with Profile */}
        <View style={styles.header}>
          <View style={styles.profileSection}>
            <View style={styles.profileImageContainer}>
              {doctorInfo?.profile_image ? (
                <Image 
                  source={{ 
                    uri: `${API_BASE_URL.replace('/api', '')}/${doctorInfo.profile_image}`,
                    headers: {
                      'Accept': 'image/*',
                    }
                  }} 
                  style={styles.profileImage}
                  defaultSource={require('../Assets/Images/phone2.png')}
                  onError={(error) => {
                    console.log('❌ Profile image failed to load:', error.nativeEvent.error);
                    console.log('🖼️ Attempted URL:', `${API_BASE_URL.replace('/api', '')}/${doctorInfo.profile_image}`);
                    console.log('🔄 Trying alternative URL formats...');
                  }}
                  onLoad={() => {
                    console.log('✅ Profile image loaded successfully');
                    console.log('🖼️ Image URL:', `${API_BASE_URL.replace('/api', '')}/${doctorInfo.profile_image}`);
                  }}
                />
              ) : (
              <View style={[styles.profileImage, styles.profilePlaceholder]}>
                <Icon name="user" size={40} color="#4A90E2" />
              </View>
              )}
            </View>
            <View style={styles.greetingSection}>
              <Text style={[styles.greetingText, { color: theme.colors.text }]}>Hello,</Text>
              <Text style={[styles.doctorName, { color: theme.colors.primary }]}>
                Dr. {doctorInfo?.name || 'Doctor'}
              </Text>
              {doctorInfo?.qualification && (
                <Text style={[styles.doctorQualification, { color: theme.colors.textSecondary }]}>
                  {doctorInfo.qualification} • {doctorInfo.experience_years} years exp
                </Text>
              )}
              {doctorInfo?.rating && (
                <View style={styles.ratingContainer}>
                <Text style={styles.ratingText}>Rating: ⭐️</Text>
                  <Text style={styles.ratingText}>
                    {doctorInfo.rating}/5
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>



        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[
              styles.statCardInner, 
              { backgroundColor: theme.colors.cardPrimary }
            ]}>
              <Text style={[styles.statNumber, { color: theme.colors.cardText }]}>
                {dashboardData?.total_patients_today || 0}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.cardTextSecondary }]}>Total Patients Today</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={[
              styles.statCardInner, 
              { backgroundColor: theme.colors.cardSecondary }
            ]}>
              <Text style={[styles.pendingNumber, { color: theme.colors.cardText }]}>
                {dashboardData?.pending_patients || 0}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.cardTextSecondary }]}>Pending Patients</Text>
            </View>
          </View>
        </View>

        {/* Today Appointments Section */}
        <View style={styles.appointmentsSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Today Appointments</Text>
           
          </View>

          {/* Appointment Cards */}
          {dashboardData?.appointments && dashboardData.appointments.length > 0 ? (
            dashboardData.appointments.map((appointment, index) => (
              <TouchableOpacity 
                key={appointment.id || index} 
                style={[styles.appointmentCard, { backgroundColor: theme.colors.cardBackground }]}
                onPress={() => navigateToAppointmentDetails(appointment)}
                activeOpacity={0.7}
              >
            <View style={styles.appointmentContent}>
              <View style={styles.patientImageContainer}>
                <Image 
                  source={{ 
                    uri: appointment.patient?.profile_image && appointment.patient.profile_image !== null 
                      ? `${API_BASE_URL.replace('/api', '')}/${appointment.patient.profile_image}`
                      : 'https://spiderdesk.asia/healto/profile_images/1757571656_stylish-handsome-indian-man-tshirt-pastel-wall 1.jpg',
                    headers: {
                      'Accept': 'image/*',
                    }
                  }} 
                  style={styles.patientImage}
                  defaultSource={require('../Assets/Images/phone2.png')}
                  onError={(error) => {
                    console.log('❌ Patient profile image failed to load for:', appointment.patient?.name);
                  }}
                  onLoad={() => {
                    console.log('✅ Patient profile image loaded for:', appointment.patient?.name);
                  }}
                />
              </View>
              
              <View style={styles.patientInfo}>
                <View style={styles.nameTokenRow}>
                  <Text style={[styles.patientName, { color: theme.colors.primary }]}>
                    {appointment.patient?.name || appointment.sub_patient?.name || 'Unknown Patient'}
                  </Text>
                  <Text style={[styles.tokenNumber, { color: theme.colors.primary }]}>
                    #{appointment.details?.token || appointment.token || 'N/A'}
                  </Text>
                </View>
                
                <Text style={[styles.patientDetail, { color: theme.colors.text }]}>
                  Age : <Text style={[styles.patientDetailBold, { color: theme.colors.text }]}>{appointment.patient?.age || appointment.sub_patient?.age || 'N/A'}</Text>
                </Text>
                
                <Text style={[styles.patientDetail, { color: theme.colors.text }]}>
                  Symptoms : <Text style={[styles.patientDetailBold, { color: theme.colors.text }]}>{appointment.details?.description || 'General Consultation'}</Text>
                </Text>
                
                <Text style={[styles.patientDetail, { color: theme.colors.text }]}>
                  On : <Text style={[styles.patientDetailBold, { color: theme.colors.text }]}>{appointment.appointment_time || 'N/A'}</Text>
                </Text>
                
                <View style={styles.statusContainer}>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: appointment.status === 'completed' ? theme.colors.statusCompleted : 
                                     appointment.status === 'scheduled' ? theme.colors.statusScheduled : theme.colors.statusPending }
                  ]}>
                    <Text style={styles.statusText}>{appointment.status}</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.arrowContainer}>
                <Icon name="chevron-right" size={20} color={theme.colors.primary} />
              </View>
            </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.noAppointmentsContainer}>
              <Icon name="calendar-alt" size={40} color="#CCCCCC" />
              <Text style={styles.noAppointmentsText}>No appointments for today</Text>
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: wp('5%'),
  },
  header: {
    paddingTop: hp('1.2%'),
    paddingBottom: hp('2.5%'),
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImageContainer: {
    marginRight: wp('4%'),
  },
  profileImage: {
    width: wp('25%'),
    height: wp('25%'),
    borderRadius: wp('12.5%'),
    borderWidth: 3,
    borderColor: '#E8F4FD',
  },
  profilePlaceholder: {
    backgroundColor: '#E8F4FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  greetingSection: {
    flex: 1,
  },
  greetingText: {
    fontSize: wp('7%'),
    fontFamily: PoppinsFonts.Bold,
    color: '#000000',
    marginBottom: hp('0.6%'),
  },
  doctorName: {
    fontSize: wp('7%'),
    fontFamily: PoppinsFonts.Bold,
    color: '#4A90E2',
  },
  doctorQualification: {
    fontSize: wp('3%'),
    color: '#666666',
    marginTop: hp('0.3%'),
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp('0.3%'),
  },
  ratingText: {
    fontSize: wp('2.8%'),
    color: '#FFD700',
    marginLeft: wp('1%'),
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp('3.7%'),
  },
  statCard: {
    flex: 1,
    marginHorizontal: wp('1.2%'),
  },
  statCardInner: {
    padding: wp('5%'),
    borderRadius: wp('3.7%'),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  statNumber: {
    fontSize: wp('10%'),
    fontFamily: PoppinsFonts.Bold,
    marginBottom: hp('0.6%'),
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  pendingNumber: {
    fontSize: wp('10%'),
    fontFamily: PoppinsFonts.Bold,
    marginBottom: hp('0.6%'),
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  statLabel: {
    fontSize: wp('3.8%'),
    fontFamily: PoppinsFonts.SemiBold,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  appointmentsSection: {
    marginBottom: hp('12.3%'),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('2.5%'),
  },
  sectionTitle: {
    fontSize: wp('4.5%'),
    fontFamily: PoppinsFonts.Bold,
    color: '#000000',
  },
  seeAllText: {
    fontSize: wp('3.5%'),
    color: '#000000',
    fontWeight: '500',
  },
  appointmentCard: {
    marginHorizontal: wp('4%'),
    marginBottom: hp('2%'),
    borderRadius: wp('3%'),
    padding: wp('4%'),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  appointmentContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  patientImageContainer: {
    marginRight: wp('4%'),
  },
  patientImage: {
    width: wp('25%'),
    height: wp('30%'),
    borderRadius: wp('2%'),
  },
  patientInfo: {
    flex: 1,
  },
  nameTokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp('1%'),
  },
  patientName: {
    fontSize: wp('4.2%'),
    fontFamily: PoppinsFonts.Bold,
    flex: 1,
  },
  patientDetail: {
    fontSize: wp('3.5%'),
    fontFamily: PoppinsFonts.Regular,
    marginBottom: hp('0.8%'),
    lineHeight: wp('4.5%'),
  },
  patientDetailBold: {
    fontFamily: PoppinsFonts.Bold,
  },
  arrowContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: wp('2%'),
  },
  statusContainer: {
    marginTop: hp('1%'),
    alignItems: 'flex-start',
  },
  statusBadge: {
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.5%'),
    borderRadius: wp('2%'),
  },
  statusText: {
    fontSize: wp('3%'),
    fontFamily: PoppinsFonts.Bold,
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  tokenNumber: {
    fontSize: wp('4%'),
    fontFamily: PoppinsFonts.Bold,
    backgroundColor: '#E3F2FD',
    paddingHorizontal: wp('2%'),
    paddingVertical: hp('0.3%'),
    borderRadius: wp('2%'),
    textAlign: 'center',
    minWidth: wp('8%'),
  },
  patientNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('0.5%'),
  },
  patientName: {
    fontSize: wp('4%'),
    fontFamily: PoppinsFonts.Bold,
    flex: 1,
  },
  tokenNumber: {
    fontSize: wp('4%'),
    fontFamily: PoppinsFonts.Bold,
    backgroundColor: '#E3F2FD',
    paddingHorizontal: wp('2%'),
    paddingVertical: hp('0.3%'),
    borderRadius: wp('2%'),
    textAlign: 'center',
    minWidth: wp('8%'),
  },
  tokenTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: hp('0.5%'),
    marginBottom: hp('0.5%'),
  },
  subPatientTitle: {
    fontSize: wp('3.2%'),
    fontFamily: PoppinsFonts.Bold,
    marginTop: hp('0.8%'),
    marginBottom: hp('0.3%'),
  },
  patientDetail: {
    fontSize: wp('3.5%'),
    fontFamily: PoppinsFonts.Medium,
    color: '#000000',
    marginBottom: hp('0.25%'),
  },
  patientInitials: {
    fontSize: wp('4%'),
    fontFamily: PoppinsFonts.Bold,
    color: '#4A90E2',
  },
  patientPlaceholder: {
    backgroundColor: '#E8F4FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp('5%'),
  },
  loadingText: {
    fontSize: wp('4%'),
    color: '#4A90E2',
    marginTop: hp('2%'),
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp('5%'),
  },
  errorText: {
    fontSize: wp('4%'),
    color: '#FF6B8A',
    marginTop: hp('2%'),
    marginBottom: hp('3%'),
    textAlign: 'center',
    fontWeight: '500',
  },
  retryButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: wp('8%'),
    paddingVertical: hp('1.5%'),
    borderRadius: wp('2%'),
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: wp('4%'),
    fontFamily: PoppinsFonts.Bold,
  },
  noAppointmentsContainer: {
    alignItems: 'center',
    paddingVertical: hp('4%'),
  },
  noAppointmentsText: {
    fontSize: wp('3.5%'),
    color: '#CCCCCC',
    marginTop: hp('1%'),
    fontWeight: '500',
  },
  dataSourceIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp('0.5%'),
  },
  dataSourceText: {
    fontSize: wp('2.5%'),
    color: '#4A90E2',
    marginLeft: wp('1%'),
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButton: {
    padding: wp('2%'),
    marginRight: wp('2%'),
    borderRadius: wp('2%'),
    backgroundColor: '#F0F8FF',
  },
  storageButton: {
    padding: wp('2%'),
    marginRight: wp('2%'),
    borderRadius: wp('2%'),
    backgroundColor: '#F0F8FF',
  },
  testButton: {
    padding: wp('2%'),
    marginRight: wp('2%'),
    borderRadius: wp('2%'),
    backgroundColor: '#F0F8FF',
  },
  realDataButton: {
    padding: wp('2%'),
    marginRight: wp('3%'),
    borderRadius: wp('2%'),
    backgroundColor: '#F0F8FF',
  },
  debugPanel: {
    backgroundColor: '#F8F9FA',
    padding: wp('3%'),
    marginBottom: hp('2%'),
    borderRadius: wp('2%'),
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  debugTitle: {
    fontSize: wp('3.5%'),
    fontFamily: PoppinsFonts.Bold,
    color: '#495057',
    marginBottom: hp('1%'),
  },
  debugText: {
    fontSize: wp('3%'),
    color: '#6C757D',
    marginBottom: hp('0.5%'),
  },
});

export default HomeScreen;
