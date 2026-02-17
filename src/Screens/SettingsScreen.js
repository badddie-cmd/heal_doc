
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  Modal,
  TextInput,
  Platform,
  ActivityIndicator,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/FontAwesome5';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { PoppinsFonts } from '../Config/Fonts';
import { performLogout } from '../Utils/StorageUtils';
import { useTheme } from '../Context/ThemeContext';
import { ApiService } from '../Utils/ApiService';

const SettingsScreen = ({ navigation, onLogout }) => {
  const theme = useTheme();
  const [isAvailable, setIsAvailable] = useState(true);
  const [showUnavailableModal, setShowUnavailableModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [showReasonDropdown, setShowReasonDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // ✅ NEW: Date/Time picker states for unavailability period
  const [unavailableFromDate, setUnavailableFromDate] = useState(new Date());
  const [unavailableFromTime, setUnavailableFromTime] = useState(new Date());
  const [showFromDatePicker, setShowFromDatePicker] = useState(false);
  const [showFromTimePicker, setShowFromTimePicker] = useState(false);
  const [unavailableFromString, setUnavailableFromString] = useState('');

  const [unavailableUntilDate, setUnavailableUntilDate] = useState(new Date());
  const [unavailableUntilTime, setUnavailableUntilTime] = useState(new Date());
  const [showUntilDatePicker, setShowUntilDatePicker] = useState(false);
  const [showUntilTimePicker, setShowUntilTimePicker] = useState(false);
  const [unavailableUntilString, setUnavailableUntilString] = useState('');

  const unavailabilityReasons = [
    'Personal Emergency',
    'Medical Conference',
    'Vacation',
    'Sick Leave',
    'Equipment Maintenance',
    'Other'
  ];

  // ✅ NEW: Format date and time objects to "YYYY-MM-DD HH:MM:SS" format
  const formatDateTime = (date, time) => {
    if (!date || !time) return '';

    // Extract date components
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    // Extract time components
    const hours = String(time.getHours()).padStart(2, '0');
    const minutes = String(time.getMinutes()).padStart(2, '0');
    const seconds = '00';

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  // Load availability status on component mount
  useEffect(() => {
    loadAvailabilityStatus();
  }, []);

  const loadAvailabilityStatus = async () => {
    try {
      console.log('📡 Fetching doctor profile to get availability status...');
      const response = await ApiService.getDoctorProfile();

      if (response.success) {
        const doctorData = response.data?.data?.doctor;
        if (doctorData) {
          const available = doctorData.is_available === 1;
          console.log('✅ Availability status loaded:', available ? 'Available' : 'Unavailable');
          setIsAvailable(available);
        }
      } else {
        console.error('❌ Failed to fetch doctor profile:', response.error);
      }
    } catch (error) {
      console.error('❌ Error loading availability status:', error);
    }
  };

  const toggleAvailability = async () => {
    if (isAvailable) {
      // If currently available, show modal to select reason for unavailability
      setShowUnavailableModal(true);
    } else {
      // If currently unavailable, make available
      await makeAvailable();
    }
  };

  const makeAvailable = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Calling markDoctorAvailable API...');

      const response = await ApiService.markDoctorAvailable();
      console.log('✅ Mark Available Response:', JSON.stringify(response, null, 2));

      if (response.success) {
        // Refetch profile to get updated availability status
        console.log('📡 Refetching doctor profile...');
        await loadAvailabilityStatus();

        Alert.alert(
          'Success',
          'You are now available for appointments!',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Error',
          response.error || 'Failed to update availability. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('❌ Error making doctor available:', error);
      Alert.alert(
        'Error',
        'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ NEW: Handle from date picker change
  const handleFromDateChange = (event, selectedDate) => {
    if (event.type === 'dismissed') {
      setShowFromDatePicker(false);
      return;
    }

    if (selectedDate) {
      setUnavailableFromDate(selectedDate);
      // Update the display string
      const formattedDateTime = formatDateTime(selectedDate, unavailableFromTime);
      setUnavailableFromString(formattedDateTime);
    }

    if (Platform.OS === 'android') {
      setShowFromDatePicker(false);
    }
  };

  // ✅ NEW: Handle from time picker change
  const handleFromTimeChange = (event, selectedTime) => {
    if (event.type === 'dismissed') {
      setShowFromTimePicker(false);
      return;
    }

    if (selectedTime) {
      setUnavailableFromTime(selectedTime);
      // Update the display string
      const formattedDateTime = formatDateTime(unavailableFromDate, selectedTime);
      setUnavailableFromString(formattedDateTime);
    }

    if (Platform.OS === 'android') {
      setShowFromTimePicker(false);
    }
  };

  // ✅ NEW: Handle until date picker change
  const handleUntilDateChange = (event, selectedDate) => {
    if (event.type === 'dismissed') {
      setShowUntilDatePicker(false);
      return;
    }

    if (selectedDate) {
      setUnavailableUntilDate(selectedDate);
      // Update the display string
      const formattedDateTime = formatDateTime(selectedDate, unavailableUntilTime);
      setUnavailableUntilString(formattedDateTime);
    }

    if (Platform.OS === 'android') {
      setShowUntilDatePicker(false);
    }
  };

  // ✅ NEW: Handle until time picker change
  const handleUntilTimeChange = (event, selectedTime) => {
    if (event.type === 'dismissed') {
      setShowUntilTimePicker(false);
      return;
    }

    if (selectedTime) {
      setUnavailableUntilTime(selectedTime);
      // Update the display string
      const formattedDateTime = formatDateTime(unavailableUntilDate, selectedTime);
      setUnavailableUntilString(formattedDateTime);
    }

    if (Platform.OS === 'android') {
      setShowUntilTimePicker(false);
    }
  };

  const handleSubmitUnavailability = async () => {
    const reason = selectedReason === 'Other' ? customReason : selectedReason;

    // ✅ NEW: Validate reason
    if (!reason.trim()) {
      Alert.alert('Error', 'Please select or enter a reason for unavailability');
      return;
    }

    // ✅ NEW: Validate start date/time is filled
    if (!unavailableFromString.trim()) {
      Alert.alert('Error', 'Please select start date and time');
      return;
    }

    // ✅ NEW: Validate end date/time is filled
    if (!unavailableUntilString.trim()) {
      Alert.alert('Error', 'Please select end date and time');
      return;
    }

    // ✅ NEW: Validate end datetime is after start datetime
    try {
      const fromDateTime = new Date(unavailableFromString.replace(' ', 'T'));
      const untilDateTime = new Date(unavailableUntilString.replace(' ', 'T'));

      if (isNaN(fromDateTime.getTime()) || isNaN(untilDateTime.getTime())) {
        Alert.alert('Error', 'Invalid date/time format');
        return;
      }

      if (untilDateTime <= fromDateTime) {
        Alert.alert('Error', 'End date/time must be after start date/time');
        return;
      }
    } catch (error) {
      Alert.alert('Error', 'Invalid date/time. Please check and try again.');
      return;
    }

    try {
      setIsLoading(true);
      // ✅ NEW: Console log all parameters
      console.log('🔍 Calling markDoctorUnavailable API with:');
      console.log('  Reason:', reason);
      console.log('  From:', unavailableFromString);
      console.log('  Until:', unavailableUntilString);

      // ✅ UPDATED: Pass all 3 required parameters
      const response = await ApiService.markDoctorUnavailable(
        reason,
        unavailableFromString,
        unavailableUntilString
      );
      console.log('✅ Mark Unavailable Response:', JSON.stringify(response, null, 2));

      if (response.success) {
        console.log('✅ Doctor marked as unavailable successfully');

        // Refetch profile to get updated availability status
        console.log('📡 Refetching doctor profile...');
        await loadAvailabilityStatus();

        // Close modal and reset form
        handleCloseModal();

        Alert.alert('Success', 'You have been marked as unavailable.');
      } else {
        console.error('❌ Failed to mark doctor as unavailable:', response.error);
        Alert.alert('Error', `Failed to update availability: ${response.error}`);
      }
    } catch (error) {
      console.error('❌ Error calling markDoctorUnavailable API:', error);
      Alert.alert('Error', 'An error occurred while updating availability. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowUnavailableModal(false);
    setSelectedReason('');
    setCustomReason('');
    setShowReasonDropdown(false);
    // ✅ NEW: Reset date/time picker states
    setUnavailableFromDate(new Date());
    setUnavailableFromTime(new Date());
    setShowFromDatePicker(false);
    setShowFromTimePicker(false);
    setUnavailableFromString('');
    setUnavailableUntilDate(new Date());
    setUnavailableUntilTime(new Date());
    setShowUntilDatePicker(false);
    setShowUntilTimePicker(false);
    setUnavailableUntilString('');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout? This will clear all your data and you will need to login again.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🚪 User initiated logout...');
              
              // Show loading state
              Alert.alert('Logging out...', 'Please wait while we log you out.');
              
              // Perform logout
              const logoutResult = await performLogout();
              
              if (logoutResult.success) {
                console.log('✅ Logout successful, navigating to welcome screen');
                
                // Call the parent logout handler to update app state
                if (onLogout) {
                  onLogout();
                }
                
                // Show success message
                Alert.alert(
                  'Logged Out',
                  'You have been successfully logged out.',
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        // Navigation will be handled by the parent component
                        console.log('✅ Logout process completed');
                      }
                    }
                  ]
                );
              } else {
                console.error('❌ Logout failed:', logoutResult.message);
                Alert.alert('Error', 'Failed to logout. Please try again.');
              }
            } catch (error) {
              console.error('❌ Error during logout:', error);
              Alert.alert('Error', 'An unexpected error occurred during logout.');
            }
          },
        },
      ]
    );
  };

  const settingsSections = [
    {
      title: 'Account',
      items: [
        {
          id: 'profile',
          title: 'Profile Information',
          icon: 'user',
          onPress: () => navigation.navigate('Profile'),
        },
        {
          id: 'availability',
          title: 'Availability Status',
          icon: 'clock',
          onPress: toggleAvailability,
          rightComponent: (
            <View style={[styles.availabilityToggle, { backgroundColor: isAvailable ? theme.colors.statusCompleted : theme.colors.statusPending }]}>
              <View style={[styles.availabilityToggleThumb, { 
                backgroundColor: theme.colors.surface,
                transform: [{ translateX: isAvailable ? 20 : 0 }]
              }]} />
            </View>
          ),
        },
      ],
    },
    {
      title: 'Appearance',
      items: [
        {
          id: 'theme',
          title: 'Dark Mode',
          icon: 'moon',
          onPress: theme.toggleTheme,
          rightComponent: (
            <View style={[styles.themeToggle, { backgroundColor: theme.isDarkMode ? theme.colors.primary : theme.colors.border }]}>
              <View style={[styles.themeToggleThumb, { 
                backgroundColor: theme.colors.surface,
                transform: [{ translateX: theme.isDarkMode ? 20 : 0 }]
              }]} />
            </View>
          ),
        },
      ],
    },
    {
      title: 'Appointments',
      items: [
        {
          id: 'history',
          title: 'Appointment History\'s',
          icon: 'calendar-alt',
          onPress: () => navigation.navigate('AppointmentHistory'),
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          id: 'help',
          title: 'Help Centre',
          icon: 'headphones',
          onPress: () => console.log('Help Centre'),
        },
        {
          id: 'faq',
          title: 'FAQs',
          icon: 'question-circle',
          onPress: () => console.log('FAQs'),
        },
        {
          id: 'contact',
          title: 'Contact Support',
          icon: 'phone',
          onPress: () => console.log('Contact Support'),
        },
      ],
    },
    {
      title: 'Legal',
      items: [
        {
          id: 'terms',
          title: 'Terms & Condition',
          icon: 'file-alt',
          onPress: () => console.log('Terms & Condition'),
        },
        {
          id: 'privacy',
          title: 'Privacy Policy',
          icon: 'shield-alt',
          onPress: () => console.log('Privacy Policy'),
        },
        {
          id: 'contact-legal',
          title: 'Contact Support',
          icon: 'phone',
          onPress: () => console.log('Contact Support'),
        },
      ],
    },
    {
      title: 'Logout',
      items: [
        {
          id: 'logout',
          title: 'Logout',
          icon: 'sign-out-alt',
          onPress: handleLogout,
        },
      ],
    },
  ];

  const renderSettingItem = (item, isLast = false) => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.settingItem, 
        !isLast && styles.settingItemBorder,
        { borderBottomColor: theme.colors.border }
      ]}
      onPress={item.onPress}
    >
      <View style={styles.settingItemLeft}>
        <Icon 
          name={item.icon} 
          size={20} 
          color={item.id === 'logout' ? '#FF6B6B' : theme.colors.text} 
          style={styles.settingIcon} 
        />
        <Text style={[
          styles.settingText,
          { color: theme.colors.text },
          item.id === 'logout' && styles.logoutText
        ]}>
          {item.title}
        </Text>
      </View>
          {item.rightComponent ? item.rightComponent : <Icon name="chevron-right" size={16} color={theme.colors.textSecondary} />}
    </TouchableOpacity>
  );

  const renderSection = (section) => (
    <View key={section.title} style={[
      styles.section,
      section.title === 'Logout' && styles.logoutSection
    ]}>
      <View style={[
        styles.sectionCard,
        { backgroundColor: theme.colors.cardBackground },
        section.title === 'Logout' && styles.logoutCard
      ]}>
        <Text style={[
          styles.sectionTitle, 
          { 
            color: theme.colors.text,
            borderBottomColor: theme.colors.border
          }
        ]}>{section.title}</Text>
        {section.items.map((item, index) => 
          renderSettingItem(item, index === section.items.length - 1)
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'left', 'right']}>
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
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </LinearGradient>

      {/* Content */}
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {settingsSections.map(renderSection)}
      </ScrollView>

      {/* Unavailability Reason Modal */}
      <Modal
        visible={showUnavailableModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.cardBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.primary }]}>
                Mark Yourself Unavailable
              </Text>
              <TouchableOpacity onPress={handleCloseModal} style={styles.closeButton}>
                <Icon name="times" size={20} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            {/* ✅ NEW: ScrollView to handle modal content overflow */}
            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScrollContent}>

            <Text style={[styles.modalDescription, { color: theme.colors.textSecondary }]}>
              Let patients know why you're currently not available for appointments.
            </Text>

            <View style={styles.reasonSection}>
              <Text style={[styles.reasonLabel, { color: theme.colors.text }]}>Select Reason</Text>
              <TouchableOpacity
                style={[styles.reasonDropdown, { 
                  backgroundColor: theme.colors.inputBackground,
                  borderColor: theme.colors.inputBorder 
                }]}
                onPress={() => setShowReasonDropdown(!showReasonDropdown)}
              >
                <Text style={[styles.reasonDropdownText, { color: selectedReason ? theme.colors.text : theme.colors.textTertiary }]}>
                  {selectedReason || 'Select a reason'}
                </Text>
                <Icon name="chevron-down" size={16} color={theme.colors.textSecondary} />
              </TouchableOpacity>

              {showReasonDropdown && (
                <View style={[styles.reasonOptions, { backgroundColor: theme.colors.cardBackground }]}>
                  {unavailabilityReasons.map((reason, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.reasonOption}
                      onPress={() => {
                        setSelectedReason(reason);
                        setShowReasonDropdown(false);
                      }}
                    >
                      <Text style={[styles.reasonOptionText, { color: theme.colors.text }]}>
                        {reason}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {selectedReason === 'Other' && (
              <View style={styles.customReasonSection}>
                <Text style={[styles.customReasonLabel, { color: theme.colors.text }]}>
                  Other (enter manually)
                </Text>
                <TextInput
                  style={[styles.customReasonInput, {
                    backgroundColor: theme.colors.inputBackground,
                    borderColor: theme.colors.inputBorder,
                    color: theme.colors.text
                  }]}
                  placeholder="Enter your reason here..."
                  placeholderTextColor={theme.colors.textTertiary}
                  value={customReason}
                  onChangeText={setCustomReason}
                  multiline
                  numberOfLines={3}
                />
              </View>
            )}

            {/* ✅ NEW: Unavailable From Section */}
            <View style={styles.dateTimeSection}>
              <Text style={[styles.dateTimeSectionTitle, { color: theme.colors.text }]}>
                Unavailable From
              </Text>

              {/* From Date Picker */}
              <Text style={[styles.dateTimeLabel, { color: theme.colors.text }]}>
                Date
              </Text>
              <TouchableOpacity
                style={[styles.dateTimeButton, { borderColor: theme.colors.primary }]}
                onPress={() => setShowFromDatePicker(true)}
              >
                <Icon name="calendar-alt" size={16} color={theme.colors.primary} style={{ marginRight: wp('2%') }} />
                <Text style={[styles.dateTimeButtonText, { color: theme.colors.text }]}>
                  {unavailableFromDate ? unavailableFromDate.toLocaleDateString() : 'Select date'}
                </Text>
              </TouchableOpacity>

              {showFromDatePicker && (
                <DateTimePicker
                  value={unavailableFromDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleFromDateChange}
                />
              )}

              {/* From Time Picker */}
              <Text style={[styles.dateTimeLabel, { color: theme.colors.text, marginTop: hp('1.5%') }]}>
                Time
              </Text>
              <TouchableOpacity
                style={[styles.dateTimeButton, { borderColor: theme.colors.primary }]}
                onPress={() => setShowFromTimePicker(true)}
              >
                <Icon name="clock" size={16} color={theme.colors.primary} style={{ marginRight: wp('2%') }} />
                <Text style={[styles.dateTimeButtonText, { color: theme.colors.text }]}>
                  {unavailableFromTime ? unavailableFromTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Select time'}
                </Text>
              </TouchableOpacity>

              {showFromTimePicker && (
                <DateTimePicker
                  value={unavailableFromTime}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleFromTimeChange}
                />
              )}
            </View>

            {/* ✅ NEW: Unavailable Until Section */}
            <View style={styles.dateTimeSection}>
              <Text style={[styles.dateTimeSectionTitle, { color: theme.colors.text }]}>
                Unavailable Until
              </Text>

              {/* Until Date Picker */}
              <Text style={[styles.dateTimeLabel, { color: theme.colors.text }]}>
                Date
              </Text>
              <TouchableOpacity
                style={[styles.dateTimeButton, { borderColor: theme.colors.primary }]}
                onPress={() => setShowUntilDatePicker(true)}
              >
                <Icon name="calendar-alt" size={16} color={theme.colors.primary} style={{ marginRight: wp('2%') }} />
                <Text style={[styles.dateTimeButtonText, { color: theme.colors.text }]}>
                  {unavailableUntilDate ? unavailableUntilDate.toLocaleDateString() : 'Select date'}
                </Text>
              </TouchableOpacity>

              {showUntilDatePicker && (
                <DateTimePicker
                  value={unavailableUntilDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleUntilDateChange}
                />
              )}

              {/* Until Time Picker */}
              <Text style={[styles.dateTimeLabel, { color: theme.colors.text, marginTop: hp('1.5%') }]}>
                Time
              </Text>
              <TouchableOpacity
                style={[styles.dateTimeButton, { borderColor: theme.colors.primary }]}
                onPress={() => setShowUntilTimePicker(true)}
              >
                <Icon name="clock" size={16} color={theme.colors.primary} style={{ marginRight: wp('2%') }} />
                <Text style={[styles.dateTimeButtonText, { color: theme.colors.text }]}>
                  {unavailableUntilTime ? unavailableUntilTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Select time'}
                </Text>
              </TouchableOpacity>

              {showUntilDatePicker && (
                <DateTimePicker
                  value={unavailableUntilDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleUntilDateChange}
                />
              )}

              {showUntilTimePicker && (
                <DateTimePicker
                  value={unavailableUntilTime}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleUntilTimeChange}
                />
              )}
            </View>

            </ScrollView>
            {/* END: ScrollView */}

            <TouchableOpacity
              style={[styles.submitButton, { borderColor: theme.colors.primary, opacity: isLoading ? 0.7 : 1 }]}
              onPress={handleSubmitUnavailability}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <Text style={[styles.submitButtonText, { color: theme.colors.primary }]}>
                  Submit
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* No native date pickers; manual entry only */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: hp('2%'),
    paddingBottom: hp('3%'),
    paddingHorizontal: wp('5%'),
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: wp('4%'),
    padding: wp('2%'),
  },
  headerTitle: {
    fontSize: wp('6%'),
    fontFamily: PoppinsFonts.Bold,
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: wp('5%'),
    paddingTop: hp('2%'),
    paddingBottom: hp('25%'), // Increased padding to ensure logout button is completely visible above bottom tab
  },
  section: {
    marginBottom: hp('2%'),
  },
  sectionTitle: {
    fontSize: wp('4.5%'),
    fontFamily: PoppinsFonts.Bold,
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('4%'),
    borderBottomWidth: 1,
  },
  sectionCard: {
    borderRadius: wp('3%'),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('4%'),
  },
  settingItemBorder: {
    borderBottomWidth: 1,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    marginRight: wp('4%'),
    width: wp('5%'),
    textAlign: 'center',
  },
  settingText: {
    fontSize: wp('4%'),
    flex: 1,
    fontFamily: PoppinsFonts.Regular,
  },
  logoutSection: {
    marginBottom: hp('20%'), // Extra margin for logout section to ensure visibility
  },
  logoutCard: {
    borderColor: '#FF6B6B', // Red border for logout card
    borderWidth: 1,
  },
  logoutText: {
    color: '#FF6B6B', // Red text color for logout
    fontFamily: PoppinsFonts.Bold,
  },
  themeToggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  themeToggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  availabilityToggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  availabilityToggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp('5%'),
  },
  modalContent: {
    width: '100%',
    borderRadius: wp('4%'),
    padding: wp('5%'),
    maxHeight: hp('85%'),  // ✅ INCREASED: To accommodate date/time sections with scrolling
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('2%'),
  },
  modalTitle: {
    fontSize: wp('5%'),
    fontFamily: PoppinsFonts.Bold,
    flex: 1,
  },
  closeButton: {
    padding: wp('2%'),
  },
  modalDescription: {
    fontSize: wp('3.5%'),
    fontFamily: PoppinsFonts.Regular,
    marginBottom: hp('3%'),
    lineHeight: wp('4.5%'),
  },
  // ✅ NEW: Style for scrollable modal content
  modalScrollContent: {
    flexGrow: 0,
  },
  reasonSection: {
    marginBottom: hp('3%'),
  },
  reasonLabel: {
    fontSize: wp('4%'),
    fontFamily: PoppinsFonts.Medium,
    marginBottom: hp('1%'),
  },
  reasonDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.5%'),
    borderRadius: wp('2%'),
    borderWidth: 1,
  },
  reasonDropdownText: {
    fontSize: wp('3.8%'),
    fontFamily: PoppinsFonts.Regular,
    flex: 1,
  },
  reasonOptions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    borderRadius: wp('2%'),
    borderWidth: 1,
    borderColor: '#E0E0E0',
    zIndex: 1000,
    marginTop: hp('0.5%'),
  },
  reasonOption: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.5%'),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  reasonOptionText: {
    fontSize: wp('3.8%'),
    fontFamily: PoppinsFonts.Regular,
  },
  customReasonSection: {
    marginBottom: hp('3%'),
  },
  customReasonLabel: {
    fontSize: wp('4%'),
    fontFamily: PoppinsFonts.Medium,
    marginBottom: hp('1%'),
  },
  customReasonInput: {
    borderWidth: 1,
    borderRadius: wp('2%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.5%'),
    textAlignVertical: 'top',
    fontSize: wp('3.8%'),
    fontFamily: PoppinsFonts.Regular,
  },
  submitButton: {
    borderWidth: 2,
    borderRadius: wp('2%'),
    paddingVertical: hp('1.5%'),
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  submitButtonText: {
    fontSize: wp('4%'),
    fontFamily: PoppinsFonts.Bold,
  },
  // Date picker styles
  dateSection: {
    marginBottom: hp('3%'),
  },
  dateLabel: {
    fontSize: wp('4%'),
    fontFamily: PoppinsFonts.Medium,
    marginBottom: hp('2%'),
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: wp('3%'),
  },
  dateField: {
    flex: 1,
  },
  dateFieldLabel: {
    fontSize: wp('3.5%'),
    fontFamily: PoppinsFonts.Medium,
    marginBottom: hp('1%'),
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('1.5%'),
    borderRadius: wp('2%'),
    borderWidth: 1,
  },
  datePickerText: {
    fontSize: wp('3.5%'),
    fontFamily: PoppinsFonts.Regular,
    flex: 1,
  },
  dateInput: {
    marginTop: hp('1%'),
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('1%'),
    borderRadius: wp('2%'),
    borderWidth: 1,
    fontSize: wp('3.2%'),
    fontFamily: PoppinsFonts.Regular,
  },
  // ✅ NEW: Styles for date/time picker sections
  dateTimeSection: {
    marginBottom: hp('3%'),
  },
  dateTimeSectionTitle: {
    fontSize: wp('4%'),
    fontFamily: PoppinsFonts.Bold,
    marginBottom: hp('1.5%'),
  },
  dateTimeLabel: {
    fontSize: wp('3.5%'),
    fontFamily: PoppinsFonts.Medium,
    marginBottom: hp('0.8%'),
  },
  dateTimeButton: {
    borderWidth: 1,
    borderRadius: wp('2%'),
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('1.2%'),
    marginBottom: hp('1.5%'),
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateTimeButtonText: {
    fontSize: wp('3.5%'),
    fontFamily: PoppinsFonts.Regular,
    marginLeft: wp('2%'),
    flex: 1,
  },
});

export default SettingsScreen;