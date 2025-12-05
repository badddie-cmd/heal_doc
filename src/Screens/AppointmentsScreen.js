import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useTheme } from '../Context/ThemeContext';
import { PoppinsFonts } from '../Config/Fonts';
import { ApiService } from '../Utils/ApiService';
import { API_CONFIG } from '../Config/ApiConfig';

const AppointmentsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // API Base URL for image URLs (remove /api part for file paths)
  const API_BASE_URL = API_CONFIG.BASE_URL.replace('/public/api', '');

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    filterAppointments();
  }, [appointments, selectedFilter]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      console.log('📅 Fetching all appointments...');

      // Call API to get all appointments
      console.log('📡 Calling API: GET /doctor/appointments');
      const response = await ApiService.getDoctorAppointments();

      console.log('📥 API Response:', JSON.stringify(response, null, 2));

      if (!response.success) {
        throw new Error(`Failed to fetch appointments: ${response.error}`);
      }

      // Extract appointments data
      const apiAppointments = response.data?.data || [];
      console.log('📋 Raw Appointments from API:', apiAppointments);

      // Transform API response to match card component requirements
      const transformedAppointments = apiAppointments.map((apt) => ({
        id: apt.id,
        token: apt.token_number,
        patient_name: apt.patient_name,
        patient_image: apt.patient_image,
        patient_phone: apt.patient_phone,
        age: apt.age,
        symptoms: apt.symptoms,
        appointment_time: apt.scheduled_time,
        appointment_date: apt.appointment_date,
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

      // Sort appointments by time (earliest first)
      const sortedAppointments = transformedAppointments.sort((a, b) => {
        const timeA = a.appointment_time || '00:00';
        const timeB = b.appointment_time || '00:00';
        return timeA.localeCompare(timeB);
      });

      console.log('✅ Transformed & Sorted Appointments:', sortedAppointments);
      setAppointments(sortedAppointments);
      setError(null);
    } catch (err) {
      console.error('❌ Error fetching appointments:', err.message);
      console.error('❌ Error details:', {
        message: err.message,
        stack: err.stack
      });
      setError(err.message || 'Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  const filterAppointments = () => {
    let filtered = appointments;
    
    switch (selectedFilter) {
      case 'Scheduled':
        filtered = appointments.filter(appointment => appointment.status === 'scheduled');
        break;
      case 'Completed':
        filtered = appointments.filter(appointment => appointment.status === 'completed');
        break;
      case 'All':
      default:
        filtered = appointments;
        break;
    }
    
    setFilteredAppointments(filtered);
  };

  const navigateToAppointmentDetails = (appointment) => {
    navigation.navigate('AppointmentDetails', { appointment });
  };

  const renderFilterButton = (filter) => (
    <TouchableOpacity
      key={filter}
      style={[
        styles.filterButton,
        { 
          backgroundColor: selectedFilter === filter ? theme.colors.primary : theme.colors.cardBackground,
          borderColor: theme.colors.primary
        }
      ]}
      onPress={() => setSelectedFilter(filter)}
    >
      <Text style={[
        styles.filterButtonText,
        { color: selectedFilter === filter ? '#FFFFFF' : theme.colors.primary }
      ]}>
        {filter}
      </Text>
    </TouchableOpacity>
  );

  const renderAppointmentCard = (appointment, index) => (
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
                ? `${API_BASE_URL}/${appointment.patient.profile_image}`
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
          {/* Patient Name */}
          <Text style={[styles.patientName, { color: theme.colors.primary }]}>
            {appointment.patient?.name || appointment.sub_patient?.name || 'Unknown Patient'}
          </Text>

          {/* Patient Details - Columnar layout with aligned labels and values */}
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.text }]}>Age</Text>
              <Text style={[styles.detailColon, { color: theme.colors.text }]}>:</Text>
              <Text style={[styles.detailValueText, { color: theme.colors.text }]}>
                {appointment.patient?.age || appointment.sub_patient?.age || 'N/A'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.text }]}>Symptoms</Text>
              <Text style={[styles.detailColon, { color: theme.colors.text }]}>:</Text>
              <Text style={[styles.detailValueText, { color: theme.colors.text }]}>
                {appointment.details?.description || 'General Consultation'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.text }]}>On</Text>
              <Text style={[styles.detailColon, { color: theme.colors.text }]}>:</Text>
              <Text style={[styles.detailValueText, { color: theme.colors.text }]}>
                {appointment.appointment_time || 'N/A'}
              </Text>
            </View>
          </View>

          {/* Status Badge */}
          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    appointment.status === 'completed'
                      ? theme.colors.statusCompleted
                      : appointment.status === 'scheduled'
                      ? theme.colors.statusScheduled
                      : theme.colors.statusPending
                }
              ]}
            >
              <Text style={styles.statusText}>{appointment.status}</Text>
            </View>
          </View>
        </View>

        <View style={styles.arrowContainer}>
          <Icon name="chevron-right" size={20} color={theme.colors.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        {/* Header */}
        <LinearGradient
          colors={['#1A83FF', '#003784']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Appointments</Text>
          <TouchableOpacity style={styles.menuButton}>
            <Icon name="ellipsis-v" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </LinearGradient>

        {/* Filter Buttons */}
        <View style={styles.filterContainer}>
          {['All', 'Scheduled', 'Completed'].map(renderFilterButton)}
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.text }]}>
              Loading appointments...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Icon name="exclamation-circle" size={40} color="#FF6B6B" />
            <Text style={[styles.errorText, { color: theme.colors.text }]}>
              {error}
            </Text>
            <TouchableOpacity 
              style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
              onPress={fetchAppointments}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filteredAppointments.length > 0 ? (
          <ScrollView 
            style={styles.appointmentsList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.appointmentsListContent}
          >
            {filteredAppointments.map(renderAppointmentCard)}
          </ScrollView>
        ) : (
          <View style={styles.noAppointmentsContainer}>
            <Icon name="calendar-alt" size={40} color="#CCCCCC" />
            <Text style={[styles.noAppointmentsText, { color: theme.colors.text }]}>
              No {selectedFilter.toLowerCase()} appointments found
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: hp('1%'),
    paddingBottom: hp('2%'),
    paddingHorizontal: wp('4%'),
    marginBottom: hp('2%'),
    borderRadius: wp('2%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: wp('2%'),
  },
  title: {
    fontSize: wp('6%'),
    fontFamily: PoppinsFonts.Bold,
    color: '#FFFFFF',
    textAlign: 'center',
    flex: 1,
  },
  menuButton: {
    padding: wp('2%'),
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: hp('2%'),
    paddingHorizontal: wp('2%'),
  },
  filterButton: {
    paddingHorizontal: wp('6%'),
    paddingVertical: hp('1.2%'),
    borderRadius: wp('6%'),
    borderWidth: 1,
    minWidth: wp('20%'),
    alignItems: 'center',
  },
  filterButtonText: {
    fontSize: wp('3.5%'),
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: hp('2%'),
    fontSize: wp('4%'),
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp('10%'),
  },
  errorText: {
    fontSize: wp('4%'),
    textAlign: 'center',
    marginVertical: hp('2%'),
  },
  retryButton: {
    paddingHorizontal: wp('8%'),
    paddingVertical: hp('1.5%'),
    borderRadius: wp('6%'),
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: wp('4%'),
    fontWeight: '600',
  },
  appointmentsList: {
    flex: 1,
  },
  appointmentsListContent: {
    paddingBottom: hp('2%'),
  },
  appointmentCard: {
    marginHorizontal: wp('4%'),
    marginBottom: hp('2.2%'),
    borderRadius: wp('3.5%'),
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
    alignItems: 'flex-start',
  },
  patientImageContainer: {
    marginRight: wp('3.5%'),
    marginTop: hp('0.3%'),
  },
  patientImage: {
    width: wp('25%'),
    height: wp('25%'),
    borderRadius: wp('2.5%'),
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: wp('4.2%'),
    fontFamily: PoppinsFonts.Bold,
    marginBottom: hp('1%'),
  },
  detailsContainer: {
    marginBottom: hp('1%'),
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('0.45%'),
  },
  detailLabel: {
    fontSize: wp('3.4%'),
    fontFamily: PoppinsFonts.Regular,
    width: wp('18%'),
  },
  detailColon: {
    fontSize: wp('3.4%'),
    fontFamily: PoppinsFonts.Regular,
    marginHorizontal: wp('1.5%'),
  },
  detailValueText: {
    fontSize: wp('3.4%'),
    fontFamily: PoppinsFonts.SemiBold,
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
    paddingLeft: wp('1%'),
  },
  statusContainer: {
    marginTop: hp('0.8%'),
    alignItems: 'flex-start',
  },
  statusBadge: {
    paddingHorizontal: wp('5.5%'),
    paddingVertical: hp('0.75%'),
    borderRadius: wp('2.2%'),
  },
  statusText: {
    fontSize: wp('3.6%'),
    fontFamily: PoppinsFonts.Bold,
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  tokenNumber: {
    fontSize: wp('3.6%'),
    fontFamily: PoppinsFonts.Bold,
    backgroundColor: '#E3F2FD',
    paddingHorizontal: wp('2%'),
    paddingVertical: hp('0.3%'),
    borderRadius: wp('2%'),
    textAlign: 'center',
    minWidth: wp('9%'),
  },
  nameTokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp('0.8%'),
  },
  subPatientTitle: {
    fontSize: wp('3.2%'),
    fontFamily: PoppinsFonts.Bold,
    marginTop: hp('0.8%'),
    marginBottom: hp('0.3%'),
  },
  noAppointmentsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp('10%'),
  },
  noAppointmentsText: {
    fontSize: wp('4%'),
    textAlign: 'center',
    marginTop: hp('2%'),
  },
});

export default AppointmentsScreen;
