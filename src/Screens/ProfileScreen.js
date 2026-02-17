import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/FontAwesome5';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { PoppinsFonts } from '../Config/Fonts';
import { useTheme } from '../Context/ThemeContext';
import { ApiService } from '../Utils/ApiService';
import { launchImageLibrary } from 'react-native-image-picker';
import { request, PERMISSIONS, RESULTS, check } from 'react-native-permissions';

const ProfileScreen = ({ navigation }) => {
  const theme = useTheme();
  const [doctorInfo, setDoctorInfo] = useState(null);
  const [specializations, setSpecializations] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [profileImageUri, setProfileImageUri] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showSpecializationDropdown, setShowSpecializationDropdown] = useState(false);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    email: '',
    gender: '',
    specialization: '',
    specializationId: null,
    qualification: '',
    experience: '',
    hospitalName: '',
    bloodGroup: '',
    address: '',
  });

  // API Base URL
  const API_BASE_URL = 'https://spidermart.in/healto';

  const GENDER_OPTIONS = ['male', 'female', 'other'];

  // Load doctor information from API
  useEffect(() => {
    loadDoctorInfo();
  }, []);

  const loadDoctorInfo = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('🔍 Loading Doctor Information from API...');

      // Call API to get doctor profile
      const profileResponse = await ApiService.getDoctorProfile();
      console.log('📥 Profile Response:', JSON.stringify(profileResponse, null, 2));

      if (!profileResponse.success) {
        throw new Error(`Failed to fetch doctor profile: ${profileResponse.error}`);
      }

      const doctor = profileResponse.data?.data?.doctor;
      if (!doctor) {
        throw new Error('No doctor data in API response');
      }

      console.log('✅ Doctor profile loaded successfully');
      setDoctorInfo(doctor);

      // Fetch specializations for dropdown
      console.log('📡 Fetching specializations...');
      const specsResponse = await ApiService.getDoctorSpecializations();
      console.log('📥 Specializations Response:', JSON.stringify(specsResponse, null, 2));

      if (specsResponse.success) {
        const specs = specsResponse.data?.data?.specializations || [];
        console.log('✅ Specializations loaded:', specs);
        setSpecializations(specs);
      } else {
        console.warn('⚠️ Failed to fetch specializations, using doctor\'s list');
        setSpecializations(doctor.specializations_list || []);
      }

      // Populate form data from doctor profile
      const primarySpecId = doctor.specializations_list?.[0]?.id;
      const primarySpecName = doctor.specializations_list?.[0]?.name;

      setFormData({
        fullName: doctor.name || '',
        phoneNumber: doctor.phone || '',
        email: doctor.email || '',
        gender: doctor.gender || 'male',
        specialization: primarySpecName || '',
        specializationId: primarySpecId || null,
        qualification: doctor.qualification || '',
        experience: doctor.experience_years?.toString() || '0',
        hospitalName: doctor.hospital?.name || '',
        bloodGroup: doctor.blood_group || '',
        address: doctor.address || '',
      });

      console.log('✅ Form data populated successfully');
    } catch (error) {
      console.error('❌ Error loading doctor info:', error);
      setError(error.message);
      Alert.alert('Error', `Failed to load profile: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Request photo library permission
  const requestPhotoPermission = async () => {
    try {
      console.log('=== REQUESTING PHOTO PERMISSION ===');
      
      let permission;
      
      if (Platform.OS === 'ios') {
        permission = PERMISSIONS.IOS.PHOTO_LIBRARY;
      } else {
        // For Android 13+ (API 33+), use READ_MEDIA_IMAGES, fallback to READ_EXTERNAL_STORAGE
        const androidVersion = Platform.Version;
        if (androidVersion >= 33) {
          permission = PERMISSIONS.ANDROID.READ_MEDIA_IMAGES;
        } else {
          permission = PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;
        }
      }
      
      console.log('Platform:', Platform.OS);
      console.log('Android Version:', Platform.Version);
      console.log('Permission to check:', permission);
      
      // Check current permission status
      const currentStatus = await check(permission);
      console.log(`Current permission status: ${currentStatus}`);
      
      if (currentStatus === RESULTS.GRANTED) {
        console.log('Permission already granted');
        return true;
      }
      
      if (currentStatus === RESULTS.BLOCKED || currentStatus === RESULTS.UNAVAILABLE) {
        console.log('Permission blocked or unavailable, need to go to settings');
        Alert.alert(
          'Permission Required',
          'Photo library access is required to select a profile picture. Please enable it in app settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => {
              console.log('User wants to go to settings');
              // You can add Linking.openSettings() here if needed
            }}
          ]
        );
        return false;
      }
      
      // Request permission
      console.log('Requesting permission:', permission);
      const result = await request(permission);
      console.log(`Permission request result: ${result}`);
      
      if (result === RESULTS.GRANTED) {
        console.log('Permission granted successfully');
        return true;
      } else {
        console.log('Permission denied by user');
        Alert.alert(
          'Permission Required',
          'Photo library access is required to select a profile picture. Please grant permission in settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => {
              console.log('User wants to go to settings');
            }}
          ]
        );
        return false;
      }
    } catch (error) {
      console.error('Error requesting photo permission:', error);
      Alert.alert('Error', 'Failed to request permission. Please try again.');
      return false;
    }
  };

  // Handle image picker
  const handleImagePicker = async () => {
    console.log('=== HANDLE IMAGE PICKER ===');
    console.log('isEditing:', isEditing);
    console.log('uploadingImage:', uploadingImage);
    
    if (!isEditing) {
      Alert.alert('Edit Mode Required', 'Please enable edit mode to change your profile picture.');
      return;
    }

    if (uploadingImage) {
      Alert.alert('Upload in Progress', 'Please wait for the current upload to complete.');
      return;
    }

    try {
      console.log('Requesting photo permission...');
      const hasPermission = await requestPhotoPermission();
      console.log('Permission granted:', hasPermission);
      
      if (!hasPermission) {
        console.log('Permission not granted, cannot open gallery');
        return;
      }

      console.log('Opening image library...');
      const options = {
        mediaType: 'photo',
        includeBase64: false,
        maxHeight: 2000,
        maxWidth: 2000,
        quality: 0.8,
        selectionLimit: 1,
        presentationStyle: 'pageSheet',
      };

      console.log('Image picker options:', options);
      
      launchImageLibrary(options, async (response) => {
        console.log('Image picker response:', response);
        
        if (response.didCancel) {
          console.log('Image picker cancelled by user');
          return;
        }
        
        if (response.errorMessage) {
          console.log('Image picker error:', response.errorMessage);
          Alert.alert('Error', `Failed to open gallery: ${response.errorMessage}`);
          return;
        }

        if (response.assets && response.assets.length > 0) {
          const asset = response.assets[0];
          console.log('Selected asset:', asset);
          
          if (asset.uri) {
            console.log('Image selected:', asset.uri);
            
            // Create complete file object
            const imageFile = {
              uri: asset.uri,
              type: asset.type || 'image/jpeg',
              name: asset.fileName || 'profile_image.jpg'
            };
            
            // Set profile image URI for UI display
            setProfileImageUri(asset.uri);
            
            // Upload image to API with complete file information
            await uploadImageToAPI(imageFile);
          } else {
            console.log('No URI found in selected asset');
            Alert.alert('Error', 'Failed to get image URI');
          }
        } else {
          console.log('No assets in response');
          Alert.alert('Error', 'No image selected');
        }
      });
    } catch (error) {
      console.error('Error in handleImagePicker:', error);
      Alert.alert('Error', 'Failed to open image picker. Please try again.');
    }
  };

  // Upload image to API
  const uploadImageToAPI = async (imageFile) => {
    if (!doctorInfo?.id) {
      Alert.alert('Error', 'Doctor ID not found. Please login again.');
      return;
    }

    try {
      setUploadingImage(true);
      console.log('Uploading profile image via doctor update API...');
      
      // Prepare data for API with image file
      const apiData = {
        doctor_id: doctorInfo.id,
        name: formData.fullName.trim(),
        qualification: formData.qualification.trim(),
        experience_years: parseInt(formData.experience) || 0,
        profile_image: imageFile, // Pass complete file object
        email: formData.email.trim(),
        phone: formData.phoneNumber.trim(),
      };

      console.log('📝 Uploading profile data with image:', { ...apiData, profile_image: '[Image File Object]' });

      // Call the doctor update API
      const response = await ApiService.updateDoctorProfile(apiData);
      
      if (response.success) {
        console.log('✅ Profile and image updated successfully via API');
        console.log('📝 API Response data:', response.data);
        
        // Update local doctor info
        const updatedDoctorInfo = {
          ...doctorInfo,
          ...response.data.data,
          profile_image: response.data.data.profile_image
        };
        
        setDoctorInfo(updatedDoctorInfo);
        console.log('✅ Local doctor info updated with complete API response data');
        
        Alert.alert('Success', 'Profile picture and data updated successfully!');
      } else {
        console.log('❌ Failed to upload profile image:', response.error);
        Alert.alert('Upload Failed', response.error || 'Failed to upload profile picture. Please try again.');
      }
    } catch (error) {
      console.error('Error uploading profile image:', error);
      Alert.alert('Error', 'Failed to upload profile picture. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!doctorInfo?.id) {
      Alert.alert('Error', 'Doctor ID not found. Please login again.');
      return;
    }

    // Validation
    if (!formData.fullName.trim()) {
      Alert.alert('Validation Error', 'Please enter your full name');
      return;
    }

    if (!formData.email.trim()) {
      Alert.alert('Validation Error', 'Please enter your email address');
      return;
    }

    if (!formData.phoneNumber.trim()) {
      Alert.alert('Validation Error', 'Please enter your phone number');
      return;
    }

    try {
      setSaving(true);
      console.log('🔄 Updating doctor profile via API...');

      // Prepare form-data (not JSON) - API expects form-data format
      const formDataToSend = new FormData();
      formDataToSend.append('doctor_id', doctorInfo.id);
      formDataToSend.append('name', formData.fullName.trim());
      formDataToSend.append('email', formData.email.trim());
      formDataToSend.append('phone', formData.phoneNumber.trim());
      formDataToSend.append('gender', formData.gender);
      formDataToSend.append('qualification', formData.qualification.trim());
      formDataToSend.append('experience_years', parseInt(formData.experience) || 0);
      formDataToSend.append('blood_group', formData.bloodGroup.trim());
      formDataToSend.append('address', formData.address.trim());

      // Add specialization ID if selected
      if (formData.specializationId) {
        formDataToSend.append('specialization_id', formData.specializationId);
      }

      // Add image file if user selected a new one
      if (profileImageUri) {
        const imageFile = {
          uri: profileImageUri,
          type: 'image/jpeg',
          name: 'profile_image.jpg'
        };
        formDataToSend.append('profile_image', imageFile);
        console.log('📸 Image file added to form data');
      }

      console.log('📝 Form data prepared for API submission');

      // Call the API with form-data
      const response = await ApiService.updateDoctorProfile(formDataToSend);

      if (response.success) {
        console.log('✅ Profile updated successfully via API');
        console.log('📝 API Response data:', response.data);

        // Update local doctor info with response data
        const updatedDoctorInfo = {
          ...doctorInfo,
          ...response.data.data
        };

        setDoctorInfo(updatedDoctorInfo);
        console.log('✅ Local doctor info updated with API response data');

        Alert.alert(
          'Success',
          'Profile updated successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                setIsEditing(false);
                setProfileImageUri(null);
                // Reload doctor info to get latest data
                loadDoctorInfo();
                // Navigate back to Home to trigger refresh
                navigation.navigate('Home', { refresh: true });
              }
            }
          ]
        );
      } else {
        console.log('❌ Failed to update profile via API:', response.error);
        Alert.alert('Error', response.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleEditMode = () => {
    setIsEditing(!isEditing);
    if (!isEditing) {
      setProfileImageUri(null); // Clear selected image when entering edit mode
    }
  };

  const getProfileImage = () => {
    // If user selected a new image, use that
    if (profileImageUri) {
      return { uri: profileImageUri };
    }
    
    // If doctor has a profile image from server, use that
    if (doctorInfo?.profile_image) {
      const baseUrl = 'https://spiderdesk.asia/healto/';
      return { 
        uri: doctorInfo.profile_image.startsWith('http') 
          ? doctorInfo.profile_image 
          : `${baseUrl}${doctorInfo.profile_image}`
      };
    }
    
    // Fallback to generated avatar
    return { 
      uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.fullName || 'Doctor')}&size=300&background=d4a574&color=fff&bold=true`
    };
  };

  const renderDropdownMenu = (fieldKey, options, isOpen, onSelect) => {
    if (!isOpen) return null;

    return (
      <View style={[styles.dropdownMenu, { backgroundColor: theme.colors.cardBackground }]}>
        <ScrollView
          style={styles.dropdownMenuScroll}
          showsVerticalScrollIndicator={true}
          scrollEnabled={true}
        >
          {options.map((option, index) => (
            <TouchableOpacity
              key={option.id || option}
              style={styles.dropdownItem}
              onPress={() => {
                onSelect(option);
                if (fieldKey === 'specialization') {
                  setShowSpecializationDropdown(false);
                } else if (fieldKey === 'gender') {
                  setShowGenderDropdown(false);
                }
              }}
            >
              <Text style={[styles.dropdownItemText, { color: theme.colors.text }]}>
                {option.name || option}
              </Text>
              {((fieldKey === 'specialization' && formData.specializationId === option.id) ||
                (fieldKey === 'gender' && formData.gender === option)) && (
                <Icon name="check" size={16} color="#0D6EFD" />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderInputField = (label, value, iconName, placeholder, fieldKey, isDropdown = false, dropdownKey = null) => (
    <View style={styles.inputContainer}>
      <Text style={[styles.inputLabel, { color: theme.colors.text }]}>{label}</Text>
      <View style={[styles.inputWrapper, {
        backgroundColor: theme.colors.inputBackground,
        borderColor: theme.colors.inputBorder
      }]}>
        <Icon name={iconName} size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
        {isDropdown ? (
          <>
            <TouchableOpacity
              style={styles.dropdownButton}
              disabled={!isEditing}
              onPress={() => {
                if (fieldKey === 'specialization') {
                  setShowSpecializationDropdown(!showSpecializationDropdown);
                  setShowGenderDropdown(false);
                } else if (fieldKey === 'gender') {
                  setShowGenderDropdown(!showGenderDropdown);
                  setShowSpecializationDropdown(false);
                }
              }}
            >
              <Text style={[styles.inputText, { color: theme.colors.inputText }]}>{value || placeholder}</Text>
              <Icon name={fieldKey === 'specialization' ? (showSpecializationDropdown ? 'chevron-up' : 'chevron-down') : (showGenderDropdown ? 'chevron-up' : 'chevron-down')} size={16} color={theme.colors.textSecondary} />
            </TouchableOpacity>
            {fieldKey === 'specialization' && renderDropdownMenu(
              'specialization',
              specializations,
              showSpecializationDropdown,
              (option) => {
                handleInputChange('specializationId', option.id);
                handleInputChange('specialization', option.name);
              }
            )}
            {fieldKey === 'gender' && renderDropdownMenu(
              'gender',
              GENDER_OPTIONS,
              showGenderDropdown,
              (option) => {
                handleInputChange('gender', option);
              }
            )}
          </>
        ) : (
          <TextInput
            style={[styles.textInput, { color: theme.colors.inputText }]}
            value={value}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.textTertiary}
            onChangeText={(text) => handleInputChange(fieldKey, text)}
            editable={isEditing}
          />
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'left', 'right']}>
      <StatusBar 
        barStyle="light-content" 
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
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity onPress={toggleEditMode}>
          <Icon name="edit" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>Loading profile...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Icon name="exclamation-circle" size={60} color={theme.colors.error} />
          <Text style={[styles.errorText, { color: theme.colors.text }]}>{error}</Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
            onPress={loadDoctorInfo}
          >
            <Text style={[styles.retryButtonText, { color: theme.colors.buttonText }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <KeyboardAvoidingView 
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
            {/* Profile Picture Section */}
            <View style={styles.profilePictureContainer}>
              <TouchableOpacity 
                style={styles.profilePictureWrapper}
                onPress={handleImagePicker}
                disabled={!isEditing || uploadingImage}
              >
            <Image 
                  source={getProfileImage()} 
                  style={styles.profilePicture}
                  resizeMode="cover"
                />
                {isEditing && (
                  <View style={styles.editImageOverlay}>
                    {uploadingImage ? (
                      <Icon name="spinner" size={20} color="#FFFFFF" />
                    ) : (
                      <Icon name="camera" size={20} color="#FFFFFF" />
                    )}
            </View>
                )}
              </TouchableOpacity>
              {isEditing && (
                <Text style={styles.editImageText}>Tap to change photo</Text>
          )}
        </View>

        {/* Basic Information Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>Basic Information</Text>
          
          {renderInputField('Full Name', formData.fullName, 'user', 'Enter full name', 'fullName')}
          {renderInputField('Phone Number', formData.phoneNumber, 'phone', 'Enter phone number', 'phoneNumber')}
          {renderInputField('Email', formData.email, 'envelope', 'Enter email address', 'email')}
          {renderInputField('Gender', formData.gender, 'venus-mars', 'Select gender', 'gender', true)}
        </View>

        {/* Professional Details Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>Professional Details</Text>

          {renderInputField('Specialization', formData.specialization, 'heart', 'Select specialization', 'specialization', true)}
          {renderInputField('Qualification', formData.qualification, 'graduation-cap', 'Enter qualification (e.g., MBBS, MD)', 'qualification')}
          {renderInputField('Year Of Experience', formData.experience, 'star', 'Enter years of experience', 'experience')}
          {renderInputField('Clinic/Hospital', formData.hospitalName, 'hospital', 'Clinic/Hospital name', 'hospitalName')}
          {renderInputField('Blood Group', formData.bloodGroup, 'droplet', 'Enter blood group', 'bloodGroup')}
          {renderInputField('Address', formData.address, 'map-marker', 'Enter address', 'address')}
        </View>

          </ScrollView>

          {/* Action Buttons */}
          {isEditing && (
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
                onPress={handleSaveChanges}
                disabled={saving}
              >
                <Text style={styles.saveButtonText}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2%'),
    borderBottomLeftRadius: wp('4%'),
    borderBottomRightRadius: wp('4%'),
  },
  backButton: {
    padding: wp('2%'),
  },
  headerTitle: {
    fontSize: wp('5%'),
    fontFamily: PoppinsFonts.SemiBold,
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: wp('4%'),
    paddingBottom: hp('2%'),
  },
  scrollContent: {
    paddingBottom: hp('2%'),
  },
  profilePictureContainer: {
    alignItems: 'center',
    paddingVertical: hp('4%'),
  },
  profilePictureWrapper: {
    width: wp('30%'),
    height: wp('30%'),
    borderRadius: wp('15%'),
    borderWidth: 3,
    borderColor: '#E0E0E0',
    padding: wp('1%'),
    backgroundColor: '#d4a574',
    position: 'relative',
  },
  profilePicture: {
    width: '100%',
    height: '100%',
    borderRadius: wp('14%'),
  },
  editImageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: wp('14%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  editImageText: {
    fontSize: wp('3.5%'),
    color: '#666',
    fontFamily: PoppinsFonts.Regular,
    marginTop: hp('1%'),
    textAlign: 'center',
  },
  themeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.8%'),
    borderRadius: wp('4%'),
    marginTop: hp('1%'),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  themeIndicatorText: {
    fontSize: wp('3%'),
    fontFamily: PoppinsFonts.Medium,
    marginLeft: wp('2%'),
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: wp('3%'),
    padding: wp('4%'),
    marginBottom: hp('1.5%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: wp('4.5%'),
    fontFamily: PoppinsFonts.Bold,
    marginBottom: hp('2%'),
  },
  inputContainer: {
    marginBottom: hp('2%'),
  },
  inputLabel: {
    fontSize: wp('3.8%'),
    fontFamily: PoppinsFonts.Medium,
    marginBottom: hp('0.8%'),
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: wp('2%'),
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('1.5%'),
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  inputIcon: {
    marginRight: wp('3%'),
  },
  textInput: {
    flex: 1,
    fontSize: wp('4%'),
    fontFamily: PoppinsFonts.Regular,
    color: '#333',
  },
  dropdownButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputText: {
    fontSize: wp('4%'),
    fontFamily: PoppinsFonts.Regular,
  },
  dropdownMenu: {
    marginTop: hp('0.5%'),
    borderRadius: wp('2%'),
    borderWidth: 1,
    borderColor: '#E0E0E0',
    maxHeight: hp('25%'),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  dropdownMenuScroll: {
    maxHeight: hp('25%'),
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('1.5%'),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownItemText: {
    fontSize: wp('4%'),
    fontFamily: PoppinsFonts.Regular,
  },
  buttonContainer: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2%'),
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#0D6EFD',
    borderRadius: wp('2%'),
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('6%'),
    alignItems: 'center',
    flex: 1,
    maxWidth: wp('80%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButtonText: {
    fontSize: wp('4.5%'),
    fontFamily: PoppinsFonts.SemiBold,
    color: '#fff',
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp('5%'),
  },
  loadingText: {
    fontSize: wp('4%'),
    fontFamily: PoppinsFonts.Medium,
    marginTop: hp('2%'),
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp('5%'),
  },
  errorText: {
    fontSize: wp('4%'),
    fontFamily: PoppinsFonts.Medium,
    textAlign: 'center',
    marginTop: hp('2%'),
    marginBottom: hp('3%'),
  },
  retryButton: {
    paddingHorizontal: wp('8%'),
    paddingVertical: hp('1.5%'),
    borderRadius: wp('2%'),
  },
  retryButtonText: {
    fontSize: wp('4%'),
    fontFamily: PoppinsFonts.Bold,
  },
});

export default ProfileScreen;
