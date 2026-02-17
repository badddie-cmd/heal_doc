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
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useTheme } from '../Context/ThemeContext';
import { PoppinsFonts } from '../Config/Fonts';
import { ApiService } from '../Utils/ApiService';
import { API_CONFIG } from '../Config/ApiConfig';

const AppointmentHistoryScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // API Base URL for image URLs (remove /api part for file paths)
  const API_BASE_URL = API_CONFIG.BASE_URL.replace('/public/api', '');

  useEffect(() => {
    fetchAppointmentHistory();
  }, []);

  const fetchAppointmentHistory = async () => {
    try {
      setLoading(true);
      console.log('📅 Fetching appointment history...');

      // Call API to get appointment history
      console.log('📡 Calling API: GET /doctor/appointment-history');
      const response = await ApiService.getAppointmentHistory();

      console.log('📥 API Response:', JSON.stringify(response, null, 2));

      if (!response.success) {
        throw new Error(`Failed to fetch appointment history: ${response.error}`);
      }

      // Extract appointments data
      const apiAppointments = response.data?.data || [];
      console.log('📋 Raw Appointments from API:', apiAppointments);

      // Transform API response to match card component requirements
      const transformedAppointments = apiAppointments.map((apt) => ({
        id: apt.id,
        token: apt.token_number,
        appointment_number: apt.appointment_number,
        patient_name: apt.patient_name,
        patient_image: apt.patient_image,
        patient_phone: apt.patient_phone,
        age: apt.age,
        symptoms: apt.symptoms,
        appointment_date: apt.appointment_date,
        appointment_time: apt.scheduled_time,
        expected_time: apt.expected_time,
        actual_start_time: apt.actual_start_time,
        actual_end_time: apt.actual_end_time,
        status: apt.status,
        is_delayed: apt.is_delayed,
        delay_minutes: apt.delay_minutes,
        queue_position: apt.queue_position,
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

      console.log('✅ Transformed Appointments:', transformedAppointments);
      setAppointments(transformedAppointments);
      setError(null);
    } catch (err) {
      console.error('❌ Error fetching appointment history:', err.message);
      console.error('❌ Error details:', {
        message: err.message,
        stack: err.stack
      });
      setError(err.message || 'Failed to fetch appointment history');
    } finally {
      setLoading(false);
    }
  };

  const renderAppointmentCard = (appointment, index) => (
    <TouchableOpacity
      key={appointment.id || index}
      style={[styles.appointmentCard, { backgroundColor: theme.colors.cardBackground }]}
      activeOpacity={0.7}
    >
      <View style={styles.appointmentContent}>
        <View style={styles.patientImageContainer}>
          <Image
            source={{
              uri: appointment.patient?.profile_image && appointment.patient.profile_image !== null
                ? appointment.patient.profile_image.startsWith('http')
                  ? appointment.patient.profile_image
                  : `${API_BASE_URL}/${appointment.patient.profile_image}`
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
            {appointment.patient?.name || 'Unknown Patient'}
          </Text>

          {/* Patient Details - Columnar layout with aligned labels and values */}
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.text }]}>Age</Text>
              <Text style={[styles.detailColon, { color: theme.colors.text }]}>:</Text>
              <Text style={[styles.detailValueText, { color: theme.colors.text }]}>
                {appointment.patient?.age || 'N/A'}
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

          {/* Timing Information */}
          <View style={styles.timingContainer}>
            <View style={styles.timingRow}>
              <Text style={[styles.timingLabel, { color: theme.colors.textSecondary }]}>
                Start
              </Text>
              <Text style={[styles.timingValue, { color: theme.colors.text }]}>
                {appointment.actual_start_time || 'N/A'}
              </Text>
            </View>
            <View style={styles.timingRow}>
              <Text style={[styles.timingLabel, { color: theme.colors.textSecondary }]}>
                End
              </Text>
              <Text style={[styles.timingValue, { color: theme.colors.text }]}>
                {appointment.actual_end_time || 'N/A'}
              </Text>
            </View>
          </View>

          {/* Delay Badge */}
          {appointment.is_delayed && (
            <View style={styles.delayBadge}>
              <Icon name="clock" size={12} color="#FF6B6B" />
              <Text style={styles.delayText}>
                Delayed by {appointment.delay_minutes} min
              </Text>
            </View>
          )}
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
          <Text style={styles.title}>Appointment History</Text>
          <View style={styles.placeholder} />
        </LinearGradient>

        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.text }]}>
              Loading appointment history...
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
              onPress={fetchAppointmentHistory}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : appointments.length > 0 ? (
          <ScrollView
            style={styles.appointmentsList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.appointmentsListContent}
          >
            {appointments.map(renderAppointmentCard)}
          </ScrollView>
        ) : (
          <View style={styles.noAppointmentsContainer}>
            <Icon name="calendar-alt" size={40} color="#CCCCCC" />
            <Text style={[styles.noAppointmentsText, { color: theme.colors.text }]}>
              No appointment history found
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
  placeholder: {
    width: wp('10%'),
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
    paddingHorizontal: wp('4%'),
    paddingBottom: hp('2%'),
  },
  appointmentCard: {
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
  timingContainer: {
    flexDirection: 'row',
    gap: wp('2%'),
    marginBottom: hp('1%'),
  },
  timingRow: {
    flex: 1,
  },
  timingLabel: {
    fontSize: wp('2.8%'),
    fontFamily: PoppinsFonts.Regular,
    marginBottom: hp('0.3%'),
  },
  timingValue: {
    fontSize: wp('3%'),
    fontFamily: PoppinsFonts.SemiBold,
  },
  delayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.5%'),
    borderRadius: wp('2%'),
    gap: wp('1.5%'),
  },
  delayText: {
    fontSize: wp('2.8%'),
    color: '#FF6B6B',
    fontFamily: PoppinsFonts.SemiBold,
  },
  arrowContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: wp('1%'),
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

export default AppointmentHistoryScreen;
