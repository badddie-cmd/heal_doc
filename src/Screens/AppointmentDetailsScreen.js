import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  Alert,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/FontAwesome5';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { useTheme } from '../Context/ThemeContext';
import { PoppinsFonts } from '../Config/Fonts';
import { ApiService } from '../Utils/ApiService';
import { API_CONFIG } from '../Config/ApiConfig';
import { TimeUtils } from '../Utils/TimeUtils';

const AppointmentDetailsScreen = ({ route, navigation }) => {
  const { appointment: initialAppointment } = route.params;
  const [appointment, setAppointment] = useState(initialAppointment);
  const [isUnavailable, setIsUnavailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);
  const theme = useTheme();

  // Fetch appointment details on component mount
  useEffect(() => {
    fetchAppointmentDetails();
  }, [initialAppointment?.id]);

  const fetchAppointmentDetails = async () => {
    try {
      setDataLoading(true);
      setError(null);

      const appointmentId = initialAppointment?.id;
      if (!appointmentId) {
        throw new Error('Appointment ID not found');
      }

      console.log('📡 Fetching appointment details for ID:', appointmentId);
      const response = await ApiService.getAppointmentDetails(appointmentId);

      console.log('📥 Appointment Details Response:', JSON.stringify(response, null, 2));

      if (!response.success) {
        throw new Error(`Failed to fetch appointment details: ${response.error}`);
      }

      const apiData = response.data?.data;
      if (!apiData) {
        throw new Error('No appointment data in API response');
      }

      // Transform API response to component format
      const transformedAppointment = {
        id: apiData.id,
        token: apiData.token_number,
        patient_name: apiData.patient?.name,
        patient_image: apiData.patient?.profile_image,
        patient_phone: apiData.patient?.phone,
        age: apiData.patient?.age,
        symptoms: apiData.symptoms,
        appointment_time: apiData.scheduled_time,
        appointment_date: apiData.appointment_date,
        status: apiData.status,
        details: {
          token: apiData.token_number,
          description: apiData.reason_for_visit || apiData.symptoms,
        },
        patient: {
          name: apiData.patient?.name,
          age: apiData.patient?.age,
          phone_number: apiData.patient?.phone,
          profile_image: apiData.patient?.profile_image,
          email: apiData.patient?.email,
          gender: apiData.patient?.gender,
        },
        sub_patient: {
          name: apiData.patient?.name,
          age: apiData.patient?.age,
          phone_number: apiData.patient?.phone,
          email: apiData.patient?.email,
          gender: apiData.patient?.gender,
        },
        description: apiData.reason_for_visit || apiData.symptoms,
      };

      console.log('✅ Transformed Appointment:', transformedAppointment);
      setAppointment(transformedAppointment);
    } catch (err) {
      console.error('❌ Error fetching appointment details:', err.message);
      console.error('❌ Error details:', {
        message: err.message,
        stack: err.stack
      });
      setError(err.message || 'Failed to load appointment details');
    } finally {
      setDataLoading(false);
    }
  };

  const handleAppointmentFinished = () => {
    Alert.alert(
      'Appointment Finished',
      'Are you sure you want to mark this appointment as finished?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Finish',
          style: 'default',
          onPress: () => {
            finishAppointment();
          },
        },
      ]
    );
  };

  const finishAppointment = async () => {
    try {
      setIsLoading(true);
      
      // Get current time in HH:MM:SS format
      const delayTime = TimeUtils.getCurrentTimeFormatted();
      
      // Get appointment ID
      const appointmentId = appointment.id || appointment.appointment_id;
      
      if (!appointmentId) {
        Alert.alert('Error', 'Appointment ID not found');
        return;
      }

      console.log('Finishing appointment with data:', {
        appointment_id: appointmentId,
        delay_time: delayTime
      });

      // Call API to update appointment
      const response = await ApiService.updateAppointment(appointmentId, delayTime);
      
      if (response.success) {
        // Update appointment status to completed locally
        appointment.status = 'completed';
        
        Alert.alert(
          'Success',
          'Appointment has been marked as finished successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.goBack();
              },
            },
          ]
        );
      } else {
        Alert.alert(
          'Error',
          response.error || 'Failed to update appointment. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error finishing appointment:', error);
      Alert.alert(
        'Error',
        'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const toggleUnavailable = () => {
    setIsUnavailable(!isUnavailable);
  };

  // API Base URL for image URLs
  const API_BASE_URL = API_CONFIG.BASE_URL.replace('/public/api', '');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar 
        barStyle={theme.isDarkMode ? "light-content" : "dark-content"} 
        backgroundColor={theme.colors.primary} 
      />
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
        <Text style={styles.headerTitle}>Appointments Details</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      {/* Loading State */}
      {dataLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Loading appointment details...
          </Text>
        </View>
      )}

      {/* Error State */}
      {error && !dataLoading && (
        <View style={styles.errorContainer}>
          <Icon name="exclamation-circle" size={40} color="#FF6B6B" />
          <Text style={[styles.errorText, { color: theme.colors.text }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
            onPress={fetchAppointmentDetails}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content */}
      {!dataLoading && !error && (
        <ScrollView style={styles.scrollView}>
          {/* Patient Details Card */}
          <View style={[styles.appointmentCard, { backgroundColor: theme.colors.cardBackground }]}>
          <Text style={[styles.cardTitle, { color: theme.colors.primary }]}>User Details</Text>
          <View style={styles.patientSection}>
            <View style={styles.profileImageContainer}>
              <Image
                source={{
                  uri: appointment.patient?.profile_image && appointment.patient.profile_image !== null
                    ? `${API_BASE_URL}/${appointment.patient.profile_image}`
                    : 'https://spiderdesk.asia/healto/profile_images/1757571656_stylish-handsome-indian-man-tshirt-pastel-wall 1.jpg',
                  headers: {
                    'Accept': 'image/*',
                  }
                }}
                style={styles.profileImage}
                defaultSource={require('../Assets/Images/phone2.png')}
                onError={(error) => {
                  console.log('❌ Patient profile image failed to load in details:', error.nativeEvent.error);
                }}
                onLoad={() => {
                  console.log('✅ Patient profile image loaded successfully in details');
                }}
              />
            </View>
            
            <View style={styles.patientDetails}>
              <Text style={[styles.patientName, { color: theme.colors.text }]}>
                <Text style={[styles.labelText, { color: theme.colors.text }]}>Name : </Text>
                <Text style={[styles.nameText, { color: theme.colors.primary }]}>{appointment.patient?.name || 'Unknown Patient'}</Text>
              </Text>
              <Text style={[styles.patientInfo, { color: theme.colors.text }]}>
                Contact : {appointment.patient?.phone_number || 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        {/* Sub-Patient Details Card */}
        {appointment.sub_patient && (
          <View style={[styles.appointmentCard, { backgroundColor: theme.colors.cardBackground }]}>
            <Text style={[styles.cardTitle, { color: theme.colors.primary }]}>Patient Details</Text>
            <View style={styles.subPatientDetails}>
              <Text style={[styles.patientName, { color: theme.colors.text }]}>
                <Text style={[styles.labelText, { color: theme.colors.text }]}>Name : </Text>
                <Text style={[styles.nameText, { color: theme.colors.primary }]}>{appointment.sub_patient.name}</Text>
              </Text>
              <Text style={[styles.patientInfo, { color: theme.colors.text }]}>
                Age : {appointment.sub_patient.age || 'N/A'}
              </Text>
              <Text style={[styles.patientInfo, { color: theme.colors.text }]}>
                Gender : {appointment.sub_patient.gender || 'N/A'}
              </Text>
              <Text style={[styles.patientInfo, { color: theme.colors.text }]}>
                Phone : {appointment.sub_patient.phone_number || 'N/A'}
              </Text>
              <Text style={[styles.patientInfo, { color: theme.colors.text }]}>
                Appointment Time : {appointment.appointment_time || 'N/A'}
              </Text>
              
              <View style={styles.tokenContainer}>
                <Text style={[styles.tokenLabel, { color: theme.colors.text }]}>Token No : </Text>
                <View style={styles.tokenBadge}>
                  <Text style={styles.tokenNumber}>
                    {appointment.details?.token || appointment.id}
                  </Text>
                </View>
              </View>
              <Text style={[styles.patientInfo, { color: theme.colors.text }]}>
                Email : {appointment.sub_patient.email || 'N/A'}
              </Text>
            </View>
          </View>
        )}

        {/* Reason For Visit */}
        <View style={[styles.reasonCard, { backgroundColor: theme.colors.cardBackground }]}>
          <Text style={[styles.reasonTitle, { color: theme.colors.primary }]}>Reason For Visit</Text>
          <Text style={[styles.reasonText, { color: theme.colors.text }]}>
            {appointment.details?.description || appointment.description || 'No specific reason mentioned for this visit.'}
          </Text>
        </View>


      </ScrollView>
      )}

      {/* Appointment Finished Button - Only show if appointment is not completed */}
      {!dataLoading && !error && appointment.status !== 'completed' && (
        <View style={[styles.buttonContainer, { backgroundColor: theme.colors.background }]}>
          <TouchableOpacity 
            style={[
              styles.finishButton, 
              { 
                backgroundColor: isLoading ? '#CCCCCC' : theme.colors.primary,
                opacity: isLoading ? 0.7 : 1
              }
            ]} 
            onPress={handleAppointmentFinished}
            disabled={isLoading}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={[styles.finishButtonText, { marginLeft: wp('2%') }]}>
                  Finishing...
                </Text>
              </View>
            ) : (
              <Text style={styles.finishButtonText}>Appointment Finished</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Show completion status if appointment is completed */}
      {!dataLoading && !error && appointment.status === 'completed' && (
        <View style={[styles.buttonContainer, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.completedStatusContainer, { backgroundColor: theme.colors.statusCompleted || '#4CAF50' }]}>
              <Icon name="check-circle" size={24} color="#FFFFFF" />
            <Text style={styles.completedStatusText}>Appointment Completed</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#4A90E2',
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.5%'),
// paddingTop: hp('3%'),
  },
  backButton: {
    padding: wp('2%'),
  },
  headerTitle: {
    fontSize: wp('5%'),
    fontFamily: PoppinsFonts.Bold,
    color: '#FFFFFF',
  },
  placeholder: {
    width: wp('10%'),
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: wp('5%'),
   // paddingVertical: hp('2%'),
  },
  appointmentCard: {
    borderRadius: wp('4%'),
    marginTop: hp('2%'),
    padding: wp('5%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: wp('5%'),
    fontFamily: PoppinsFonts.Bold,
   // marginBottom: hp('2.5%'),
    borderBottomWidth: 2,
    paddingBottom: hp('1.5%'),
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subPatientDetails: {
    flex: 1,
    borderRadius: wp('3%'),
    padding: wp('4%'),
    marginTop: hp('1%'),
  },
  patientSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: wp('3%'),
    padding: wp('3%'),
    marginTop: hp('1%'),
  },
  profileImageContainer: {
    marginRight: wp('4%'),
  },
  profileImage: {
    width: wp('25%'),
    height: wp('35%'),
    borderRadius: wp('3%'),
    borderWidth: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  profilePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitials: {
    fontSize: wp('6%'),
    fontFamily: PoppinsFonts.Bold,
  },
  patientDetails: {
    flex: 1,
  },
  patientName: {
    fontSize: wp('4.2%'),
    fontFamily: PoppinsFonts.Bold,
    marginBottom: hp('1.5%'),
    lineHeight: wp('5%'),
  },
  labelText: {
    fontSize: wp('4.5%'),
    fontFamily: PoppinsFonts.Bold,
  },
  nameText: {
    fontSize: wp('4.5%'),
    fontFamily: PoppinsFonts.Bold,
  },
  subPatientNameText: {
    fontSize: wp('3.5%'),
    fontFamily: PoppinsFonts.Bold,
    color: '#E74C3C',
  },
  patientInfo: {
    fontSize: wp('3.5%'),
    color: '#666666',
    marginBottom: hp('0.8%'),
  },
  tokenContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp('1%'),
  },
  tokenLabel: {
    fontSize: wp('3.5%'),
    color: '#666666',
  },
  tokenBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.5%'),
    borderRadius: wp('1%'),
    marginLeft: wp('2%'),
  },
  tokenNumber: {
    color: '#FFFFFF',
    fontSize: wp('3.5%'),
    fontFamily: PoppinsFonts.Bold,
  },
  reasonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: wp('3%'),
    marginTop: hp('2%'),
    padding: wp('4%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reasonTitle: {
    fontSize: wp('4%'),
    fontFamily: PoppinsFonts.Bold,
    color: '#4A90E2',
    marginBottom: hp('1%'),
  },
  reasonText: {
    fontSize: wp('3.5%'),
    color: '#666666',
    lineHeight: wp('5%'),
  },
  unavailableCard: {
    borderRadius: wp('3%'),
    marginTop: hp('2%'),
    padding: wp('4%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  unavailableContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  unavailableTextContainer: {
    flex: 1,
    marginRight: wp('4%'),
  },
  unavailableTitle: {
    fontSize: wp('4%'),
    fontFamily: PoppinsFonts.Bold,
    color: '#333333',
    marginBottom: hp('0.5%'),
  },
  unavailableDescription: {
    fontSize: wp('3%'),
    color: '#999999',
    lineHeight: wp('4%'),
  },
  buttonContainer: {
    padding: wp('4%'),
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  finishButton: {
    backgroundColor: '#4A90E2',
    borderRadius: wp('2%'),
    paddingVertical: hp('2%'),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  finishButtonText: {
    color: '#FFFFFF',
    fontSize: wp('4.5%'),
    fontFamily: PoppinsFonts.Bold,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: wp('2%'),
    paddingVertical: hp('2%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  completedStatusText: {
    color: '#FFFFFF',
    fontSize: wp('4.5%'),
    fontFamily: PoppinsFonts.Bold,
    marginLeft: wp('2%'),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp('10%'),
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
});

export default AppointmentDetailsScreen;
