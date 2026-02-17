import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  TextInput,
  Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
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

const AppointmentsScreen = ({ navigation }) => {
  const theme = useTheme();

  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Inline filter states
  const [showDateFilters, setShowDateFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Date picker states
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [startDateObj, setStartDateObj] = useState(new Date());
  const [endDateObj, setEndDateObj] = useState(new Date());

  // Debounce ref for search
  const searchDebounceRef = useRef(null);

  // API Base URL for image URLs (remove /api part for file paths)
  const API_BASE_URL = API_CONFIG.BASE_URL.replace('/public/api', '');

  useEffect(() => {
    fetchAppointments();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for navigation parameters to refresh appointments
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeFocus', () => {
      const params = navigation.getState().routes[navigation.getState().index]?.params;
      if (params?.refreshAppointments || params?.appointmentUpdated) {
        console.log('🔄 Detected appointment update - refreshing appointments list...');
        fetchAppointments();
      }
    });

    return unsubscribe;
  }, [navigation]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    filterAppointments();
  }, [appointments, selectedFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAppointments = async (filters = {}) => {
    try {
      setLoading(true);
      console.log('\n=== 📅 FETCHING APPOINTMENTS ===');
      console.log('⏰ Timestamp:', new Date().toISOString());

      // Handle patient name from filters or searchQuery
      let patientName;
      if ('patient_name' in filters) {
        patientName = filters.patient_name || undefined;
      } else {
        patientName = searchQuery.trim() || undefined;
      }

      // Build filter object (SIMPLIFIED - Patient Name & Date only, no sort)
      const apiFilters = {
        ...filters,
        status: selectedFilter !== 'All' ? selectedFilter.toLowerCase() : undefined,
        patient_name: patientName,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      };

      // Remove undefined and null values
      Object.keys(apiFilters).forEach(key => {
        if (apiFilters[key] === undefined || apiFilters[key] === null) {
          delete apiFilters[key];
        }
      });

      // Call API to get all appointments with filters
      console.log('📡 Calling API: GET /doctor/appointments with filters:', apiFilters);
      const response = await ApiService.getDoctorAppointments(apiFilters);

      console.log('\n=== 🔍 API RESPONSE ANALYSIS ===');
      console.log('Response structure:', {
        success: response.success,
        hasData: !!response.data,
        dataType: typeof response.data,
        dataKeys: response.data ? Object.keys(response.data).slice(0, 5) : 'N/A',
      });

      if (!response.success) {
        throw new Error(`Failed to fetch appointments: ${response.error}`);
      }

      // Extract appointments data - handle different response formats
      let apiAppointments = [];

      // Try different possible data locations
      if (response.data?.data && Array.isArray(response.data.data)) {
        // Format: { success: true, data: { data: [...] } }
        apiAppointments = response.data.data;
        console.log('✅ Found appointments in response.data.data (wrapped array)');
      } else if (Array.isArray(response.data)) {
        // Format: { success: true, data: [...] }
        apiAppointments = response.data;
        console.log('✅ Found appointments in response.data (direct array)');
      } else if (response.data?.appointments && Array.isArray(response.data.appointments)) {
        // Format: { success: true, data: { appointments: [...] } }
        apiAppointments = response.data.appointments;
        console.log('✅ Found appointments in response.data.appointments');
      }

      console.log('📋 Total appointments found:', apiAppointments.length);
      if (apiAppointments.length > 0) {
        console.log('  First appointment ID:', apiAppointments[0].id);
        console.log('  Last appointment ID:', apiAppointments[apiAppointments.length - 1].id);
      }
      console.log('=== END API RESPONSE ANALYSIS ===\n');

      // Transform API response to match card component requirements
      console.log('=== 🔄 TRANSFORMING APPOINTMENTS ===');
      const transformedAppointments = apiAppointments.map((apt, index) => {
        console.log(`  [${index}] Transforming appointment ID: ${apt.id}`);
        return {
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
        };
      });

      console.log('✅ Total transformed:', transformedAppointments.length);

      // Backend handles sorting, no client-side sort needed
      console.log('=== 📊 SETTING STATE ===');
      setAppointments(transformedAppointments);
      setError(null);
      console.log('✅ State updated successfully');
      console.log('=== END TRANSFORMATION ===\n');
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
    console.log('\n=== 🔍 FILTERING APPOINTMENTS ===');
    console.log('Current filter:', selectedFilter);
    console.log('Total appointments before filter:', appointments.length);

    let filtered = appointments;

    switch (selectedFilter) {
      case 'Scheduled':
        filtered = appointments.filter(appointment => {
          const isScheduled = appointment.status === 'scheduled';
          console.log(`  Appointment ${appointment.id}: status="${appointment.status}" → ${isScheduled ? 'INCLUDED' : 'EXCLUDED'}`);
          return isScheduled;
        });
        console.log(`✅ Found ${filtered.length} scheduled appointments`);
        break;
      case 'Completed':
        filtered = appointments.filter(appointment => {
          const isCompleted = appointment.status === 'completed';
          console.log(`  Appointment ${appointment.id}: status="${appointment.status}" → ${isCompleted ? 'INCLUDED' : 'EXCLUDED'}`);
          return isCompleted;
        });
        console.log(`✅ Found ${filtered.length} completed appointments`);
        break;
      case 'All':
      default:
        filtered = appointments;
        console.log(`✅ Showing all ${filtered.length} appointments`);
        break;
    }

    console.log('Total after filter:', filtered.length);
    if (filtered.length === 0) {
      console.log('⚠️ WARNING: No appointments after filtering!');
      console.log('  Original appointments:', appointments.map(a => `${a.id}(${a.status})`).join(', '));
    }
    console.log('=== END FILTERING ===\n');

    setFilteredAppointments(filtered);
  };

  // Debounced search effect
  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    setIsSearching(true);

    searchDebounceRef.current = setTimeout(() => {
      console.log('🔍 Executing debounced search for patient:', searchQuery);
      fetchAppointments();
      setIsSearching(false);
    }, 500);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleApplyDateFilters = () => {
    console.log('🔎 Applying date filters...');
    fetchAppointments();
    setShowDateFilters(false);
  };

  const handleClearDateFilters = () => {
    console.log('🗑️ Clearing date filters...');
    setStartDate('');
    setEndDate('');
    setStartDateObj(new Date());
    setEndDateObj(new Date());
    fetchAppointments();
  };

  const handleClearSearch = () => {
    console.log('🗑️ Clearing search...');
    setSearchQuery('');
    setIsSearching(false);
    // Explicitly clear search filter
    fetchAppointments({ patient_name: null });
  };

  const navigateToAppointmentDetails = (appointment) => {
    navigation.navigate('AppointmentDetails', { appointment });
  };

  // Handle start date picker change
  const handleStartDateChange = (event, selectedDate) => {
    if (event.type === 'dismissed') {
      setShowStartDatePicker(false);
      return;
    }

    if (selectedDate) {
      setStartDateObj(selectedDate);
      // Format date as YYYY-MM-DD
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      setStartDate(`${year}-${month}-${day}`);
    }

    if (Platform.OS === 'android') {
      setShowStartDatePicker(false);
    }
  };

  // Handle end date picker change
  const handleEndDateChange = (event, selectedDate) => {
    if (event.type === 'dismissed') {
      setShowEndDatePicker(false);
      return;
    }

    if (selectedDate) {
      setEndDateObj(selectedDate);
      // Format date as YYYY-MM-DD
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      setEndDate(`${year}-${month}-${day}`);
    }

    if (Platform.OS === 'android') {
      setShowEndDatePicker(false);
    }
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

  // Inline date range filter component
  const renderDateRangeFilter = () => (
    <View style={[styles.dateFilterContainer, { backgroundColor: theme.colors.cardBackground }]}>
      {/* Header with toggle */}
      <View style={styles.dateFilterHeader}>
        <View style={styles.dateFilterTitleContainer}>
          <Icon name="calendar-alt" size={16} color={theme.colors.primary} />
          <Text style={[styles.dateFilterTitle, { color: theme.colors.text }]}>
            Filter by Date Range
          </Text>
        </View>
        <TouchableOpacity onPress={() => setShowDateFilters(false)}>
          <Icon name="chevron-up" size={16} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {/* Date pickers side by side */}
      <View style={styles.datePickersRow}>
        {/* From Date */}
        <TouchableOpacity
          style={[
            styles.datePickerButton,
            styles.datePickerButtonHalf,
            {
              borderColor: startDate ? theme.colors.primary : theme.colors.text,
              backgroundColor: startDate ? theme.colors.primary : '#F0F7FF'
            }
          ]}
          onPress={() => setShowStartDatePicker(true)}
        >
          <Icon
            name="calendar-alt"
            size={14}
            color={startDate ? '#FFFFFF' : theme.colors.primary}
            style={{ marginRight: wp('1.5%') }}
          />
          <Text
            style={[
              styles.datePickerButtonText,
              {
                color: startDate ? '#FFFFFF' : theme.colors.primary,
                fontSize: wp('3.2%')
              }
            ]}
          >
            {startDate || 'From'}
          </Text>
        </TouchableOpacity>

        {/* To Date */}
        <TouchableOpacity
          style={[
            styles.datePickerButton,
            styles.datePickerButtonHalf,
            {
              borderColor: endDate ? theme.colors.primary : theme.colors.text,
              backgroundColor: endDate ? theme.colors.primary : '#F0F7FF'
            }
          ]}
          onPress={() => setShowEndDatePicker(true)}
        >
          <Icon
            name="calendar-alt"
            size={14}
            color={endDate ? '#FFFFFF' : theme.colors.primary}
            style={{ marginRight: wp('1.5%') }}
          />
          <Text
            style={[
              styles.datePickerButtonText,
              {
                color: endDate ? '#FFFFFF' : theme.colors.primary,
                fontSize: wp('3.2%')
              }
            ]}
          >
            {endDate || 'To'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Date pickers */}
      {showStartDatePicker && (
        <DateTimePicker
          value={startDateObj}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleStartDateChange}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={endDateObj}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleEndDateChange}
        />
      )}

      {/* Action buttons */}
      <View style={styles.dateFilterActions}>
        <TouchableOpacity
          style={[
            styles.dateActionButton,
            {
              backgroundColor: theme.colors.cardBackground,
              borderColor: theme.colors.primary
            }
          ]}
          onPress={handleClearDateFilters}
        >
          <Icon name="times-circle" size={14} color={theme.colors.primary} />
          <Text style={[styles.dateActionButtonText, { color: theme.colors.primary }]}>
            Clear Dates
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.dateActionButton,
            { backgroundColor: theme.colors.primary }
          ]}
          onPress={handleApplyDateFilters}
        >
          <Icon name="check" size={14} color="#FFFFFF" />
          <Text style={[styles.dateActionButtonText, { color: '#FFFFFF' }]}>
            Apply Filters
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter info */}
      {(startDate || endDate) && (
        <View style={[styles.filterInfoInline, { backgroundColor: '#E3F2FD' }]}>
          <Icon name="info-circle" size={14} color={theme.colors.primary} />
          <Text style={[styles.filterInfoTextInline, { color: theme.colors.text }]}>
            {startDate && endDate
              ? `Showing appointments from ${startDate} to ${endDate}`
              : startDate
              ? `Showing appointments from ${startDate}`
              : `Showing appointments until ${endDate}`}
          </Text>
        </View>
      )}
    </View>
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
              uri: (() => {
                // Try direct full URL from patient_image (API response from appointments list)
                if (appointment.patient_image && appointment.patient_image !== null) {
                  // Check if it's already a full URL
                  if (appointment.patient_image.startsWith('http')) {
                    return appointment.patient_image;
                  }
                  // Otherwise prepend API base URL
                  return `${API_BASE_URL}/${appointment.patient_image}`;
                }

                // Try profile_image from patient object (API response from appointment details)
                if (appointment.patient?.profile_image && appointment.patient.profile_image !== null) {
                  // Check if it's already a full URL
                  if (appointment.patient.profile_image.startsWith('http')) {
                    return appointment.patient.profile_image;
                  }
                  // Otherwise prepend API base URL
                  return `${API_BASE_URL}/${appointment.patient.profile_image}`;
                }

                // Fallback to default image
                return 'https://spiderdesk.asia/healto/profile_images/1757571656_stylish-handsome-indian-man-tshirt-pastel-wall 1.jpg';
              })(),
              headers: {
                'Accept': 'image/*',
              }
            }}
            style={styles.patientImage}
            defaultSource={require('../Assets/Images/phone2.png')}
            onError={(error) => {
              console.log('❌ Patient profile image failed to load for:', appointment.patient?.name || appointment.patient_name);
              console.log('  Attempted URI:', appointment.patient_image || appointment.patient?.profile_image);
            }}
            onLoad={() => {
              console.log('✅ Patient profile image loaded for:', appointment.patient?.name || appointment.patient_name);
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
              <Text style={styles.statusText}>
                {appointment.status === 'in_progress' ? 'Ongoing' : appointment.status}
              </Text>
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
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setShowDateFilters(!showDateFilters)}
          >
            <Icon name="calendar-alt" size={24} color="#FFFFFF" />
            {(startDate || endDate) && (
              <View style={styles.headerDateBadge}>
                <Text style={styles.headerDateBadgeText}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        </LinearGradient>

        {/* Inline Date Filter - Always Visible */}
        {showDateFilters && renderDateRangeFilter()}

        {/* Search Bar - Always Visible */}
        <View style={[styles.searchContainer, { backgroundColor: theme.colors.background }]}>
          <View
            style={[
              styles.searchBar,
              {
                borderColor: theme.colors.primary,
                backgroundColor: theme.colors.cardBackground,
              }
            ]}
          >
            <Icon
              name="search"
              size={16}
              color={theme.colors.text}
              style={{ marginRight: wp('2%') }}
            />
            <TextInput
              style={[
                styles.searchInput,
                { color: theme.colors.text }
              ]}
              placeholder="Search by patient name..."
              placeholderTextColor={theme.colors.text}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={handleClearSearch}>
                <Icon name="times-circle" size={16} color={theme.colors.text} />
              </TouchableOpacity>
            )}
            {isSearching && (
              <ActivityIndicator
                size="small"
                color={theme.colors.primary}
                style={{ marginLeft: wp('1%') }}
              />
            )}
          </View>
        </View>

        {/* Filter Buttons - Always Visible */}
        <View style={styles.filterContainer}>
          {['All', 'Scheduled', 'Completed'].map(renderFilterButton)}
        </View>

        {/* Content - Loading/Error/Appointments */}
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
    marginBottom: hp('1.5%'),
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
    position: 'relative',
  },
  headerDateBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: wp('5%'),
    height: wp('5%'),
    borderRadius: wp('2.5%'),
    backgroundColor: '#FFC107',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerDateBadgeText: {
    fontSize: wp('3%'),
    fontFamily: PoppinsFonts.Bold,
    color: '#FFFFFF',
  },

  // Inline Date Filter Styles
  dateFilterContainer: {
    marginHorizontal: wp('4%'),
    marginBottom: hp('1.5%'),
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('1.5%'),
    borderRadius: wp('2%'),
    borderLeftWidth: 4,
    borderLeftColor: '#0D6EFD',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  dateFilterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp('1%'),
  },
  dateFilterTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateFilterTitle: {
    fontSize: wp('3.8%'),
    fontFamily: PoppinsFonts.SemiBold,
    marginLeft: wp('2%'),
  },
  datePickersRow: {
    flexDirection: 'row',
    gap: wp('2%'),
    marginBottom: hp('1%'),
  },
  datePickerButton: {
    borderWidth: 1,
    borderRadius: wp('4%'),
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('1%'),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  datePickerButtonHalf: {
    flex: 1,
  },
  datePickerButtonText: {
    fontSize: wp('3.8%'),
    fontFamily: PoppinsFonts.SemiBold,
  },
  dateFilterActions: {
    flexDirection: 'row',
    gap: wp('2%'),
    marginBottom: hp('0.5%'),
  },
  dateActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('1%'),
    borderRadius: wp('2%'),
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dateActionButtonText: {
    fontSize: wp('3.2%'),
    fontFamily: PoppinsFonts.SemiBold,
    marginLeft: wp('1%'),
  },
  filterInfoInline: {
    flexDirection: 'row',
    paddingHorizontal: wp('2.5%'),
    paddingVertical: hp('0.8%'),
    borderRadius: wp('1.5%'),
    alignItems: 'center',
  },
  filterInfoTextInline: {
    fontSize: wp('3%'),
    fontFamily: PoppinsFonts.Regular,
    marginLeft: wp('1.5%'),
    flex: 1,
  },

  // Search Bar Styles
  searchContainer: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1%'),
    marginBottom: hp('1%'),
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: wp('3%'),
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('1.2%'),
  },
  searchInput: {
    flex: 1,
    fontSize: wp('3.6%'),
    fontFamily: PoppinsFonts.Regular,
    marginHorizontal: wp('2%'),
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: hp('2%'),
    fontFamily: PoppinsFonts.Regular,
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
    fontFamily: PoppinsFonts.SemiBold,
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
    paddingBottom: hp('12%'),
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
