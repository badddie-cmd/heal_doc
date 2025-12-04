import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/FontAwesome5';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { PoppinsFonts } from '../Config/Fonts';
import { API_CONFIG, getApiUrl } from '../Config/ApiConfig';
import { saveLoginSession } from '../Utils/StorageUtils';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginScreen = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both username and password');
      return;
    }

    setIsLoading(true);

    // Prepare login payload matching API specification
    const loginPayload = {
      username: username.trim(),
      password: password.trim(),
    };

    // Build API URL using config
    const loginUrl = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DOCTOR_LOGIN}`;

    console.log('=== DOCTOR LOGIN ===');
    console.log('URL:', loginUrl);
    console.log('Payload:', loginPayload);
    console.log('====================');

    try {
      // Make API call with proper axios config
      const response = await axios.post(loginUrl, loginPayload, {
        timeout: API_CONFIG.TIMEOUT,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      console.log('=== LOGIN SUCCESS ===');
      console.log('Status:', response.status);
      console.log('Response Data:', response.data);
      console.log('====================');

      // Check for successful response
      if (response.data && response.data.success === true) {
        // Extract token and user data from response
        const { token, data } = response.data;

        // Prepare session data
        const sessionData = {
          isLoggedIn: true,
          token: token,
          userData: data.doctor,
          loginTime: new Date().toISOString(),
          username: username.trim(),
        };

        // Save login session using utility function
        await saveLoginSession(sessionData);

        // Show success toast
        Toast.show({
          type: 'success',
          text1: 'Login Successful',
          text2: `Welcome back, Dr. ${data?.name || 'Doctor'}!`,
          position: 'top',
        });

        // Navigate after brief delay
        setTimeout(() => {
          if (onLogin) {
            onLogin();
          }
        }, 1000);
      } else if (response.status === 200) {
        // Success status but check response structure
        console.warn('Response status 200 but success flag not true:', response.data);
        Alert.alert('Login Error', 'Unexpected response format from server');
      }
    } catch (error) {
      // Determine user-friendly error message
      let errorMessage = 'Login failed. Please try again.';

      if (error.response) {
        const status = error.response.status;
        const responseData = error.response.data;

        if (status === 401) {
          errorMessage = responseData?.message || 'Invalid username or password';
        } else if (status === 400) {
          errorMessage = responseData?.message || 'Please check your credentials';
        } else if (status === 422) {
          errorMessage = 'Please provide valid username and password';
        } else {
          errorMessage = responseData?.message || `Server error: ${status}`;
        }
      } else if (error.request && !error.response) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else {
        errorMessage = error.message || 'An unexpected error occurred';
      }

      Alert.alert('Login Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollViewContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Background Gradient */}
          <LinearGradient
            colors={['#E8F4FD', '#FFFFFF']}
            style={styles.gradientBackground}
          >
            {/* Header Image */}
            <View style={styles.imageContainer}>
              <Image
                source={require('../Assets/Images/Login.png')}
                style={styles.loginImage}
                resizeMode="contain"
              />
            </View>

            {/* Login Form */}
            <View style={styles.formContainer}>
              <Text style={styles.loginTitle}>Log in</Text>
              
              {/* Username Input */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Username"
                  placeholderTextColor="#999999"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Password"
                  placeholderTextColor="#999999"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={togglePasswordVisibility}
                >
                  <Icon
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={wp('5%')}
                    color="#999999"
                  />
                </TouchableOpacity>
              </View>

              {/* Sign In Button */}
              <TouchableOpacity
                style={[styles.signInButton, isLoading && styles.signInButtonDisabled]}
                onPress={handleSignIn}
                activeOpacity={0.8}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={['#003784', '#1A83FF']}
                  start={{ x: 0.0143, y: 0 }}
                  end={{ x: 0.9611, y: 1 }}
                  style={styles.gradientButton}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.signInButtonText}>Sign In</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </ScrollView>
      </KeyboardAvoidingView>
      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  keyboardAvoidingView: {
    flex: 1,
  },

  imageContainer: {
    flex: 0.4,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp('5%'),
    paddingTop: hp('3%'),
  },
  loginImage: {
    width: wp('80%'),
    height: hp('50%'),
  },
  formContainer: {
    flex: 0.6,
    paddingHorizontal: wp('8%'),
    paddingTop: hp('2%'),
  },
  loginTitle: {
    fontSize: wp('8%'),
    fontFamily: PoppinsFonts.Bold,
    color: '#4A90E2',
    textAlign: 'center',
    marginBottom: hp('3%'),
  },
  inputContainer: {
    position: 'relative',
    marginBottom: hp('2.5%'),
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: wp('3%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('2%'),
    fontSize: wp('4%'),
    fontFamily: PoppinsFonts.Regular,
    color: '#333333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  eyeIcon: {
    position: 'absolute',
    right: wp('4%'),
    top: hp('2%'),
    padding: wp('1%'),
  },
  signInButton: {
    borderRadius: wp('3%'),
    marginTop: hp('3%'),
    shadowColor: '#4A90E2',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  gradientButton: {
    borderRadius: wp('3%'),
    paddingVertical: hp('2.5%'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInButtonText: {
    fontSize: wp('4.5%'),
    fontFamily: PoppinsFonts.Bold,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  signInButtonDisabled: {
    opacity: 0.7,
  },
});

export default LoginScreen;