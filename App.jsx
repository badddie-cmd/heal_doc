/**
 * Healto Doctor App
 * Healthcare management application
 *
 * @format
 */

import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { StatusBar, View, Text, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import BottomTabNavigator from './src/Navigation/BottomTap';
import LoginScreen from './src/Screens/LoginScreen';
import WelcomeScreen from './src/Screens/WelcomeScreen';
import AppointmentDetailsScreen from './src/Screens/AppointmentDetailsScreen';
import ProfileScreen from './src/Screens/ProfileScreen';
import { ThemeProvider } from './src/Context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isSessionValid, performLogout } from './src/Utils/StorageUtils';
import { PoppinsFonts } from './src/Config/Fonts';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

// Import vector icons to ensure they're loaded
import 'react-native-vector-icons/Ionicons';
import 'react-native-vector-icons/MaterialIcons';
import 'react-native-vector-icons/MaterialCommunityIcons';
import 'react-native-vector-icons/FontAwesome';
import 'react-native-vector-icons/FontAwesome5';
import 'react-native-vector-icons/Feather';
import 'react-native-vector-icons/Entypo';
import 'react-native-vector-icons/AntDesign';

const Stack = createStackNavigator();

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check for stored login data on app startup
  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      console.log('=== CHECKING LOGIN STATUS ===');

      // Check if session is valid using utility function
      const isValid = await isSessionValid();

      if (isValid) {
        console.log('✅ Valid session found, navigating to home');
        setIsLoggedIn(true);
      } else {
        console.log('⚠️ No valid session, navigating to welcome');
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error('❌ Error checking login status:', error);
      setIsLoggedIn(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = async () => {
    try {
      console.log('=== LOGOUT ===');
      const result = await performLogout();
      console.log('Logout result:', result.message);
      console.log('===============');
      setIsLoggedIn(false);
    } catch (error) {
      console.error('❌ Error during logout:', error);
      setIsLoggedIn(false);
    }
  };

  // Show loading screen while checking login status
  if (isLoading) {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {isLoggedIn ? (
              <>
                <Stack.Screen name="Main">
                  {(props) => <BottomTabNavigator {...props} onLogout={handleLogout} />}
                </Stack.Screen>
                <Stack.Screen 
                  name="AppointmentDetails" 
                  component={AppointmentDetailsScreen}
                  options={{
                    headerShown: false,
                  }}
                />
                <Stack.Screen 
                  name="Profile" 
                  component={ProfileScreen}
                  options={{
                    headerShown: false,
                  }}
                />
              </>
            ) : (
              <>
                <Stack.Screen name="Welcome" component={WelcomeScreen} />
                <Stack.Screen name="Login">
                  {(props) => <LoginScreen {...props} onLogin={handleLogin} />}
                </Stack.Screen>
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

const styles = {
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: hp('2%'),
    fontSize: wp('4%'),
    fontFamily: PoppinsFonts.Regular,
    color: '#4A90E2',
  },
};

export default App;
