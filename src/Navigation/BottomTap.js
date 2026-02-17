import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Image, View, Text } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import HomeScreen from '../Screens/HomeScreen';
import AppointmentsScreen from '../Screens/AppointmentsScreen';
import SettingsScreen from '../Screens/SettingsScreen';
import { PoppinsFonts } from '../Config/Fonts';

const Tab = createBottomTabNavigator();

// Custom Tab Bar with Gradient Background
const CustomTabBar = (props) => {
  return (
    <View style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: hp('13.5%'),
      paddingBottom: hp('2.5%'),
    }}>
      <LinearGradient
        colors={['#1A83FF', '#003784']}
        start={{ x: 0.0143, y: 0 }}
        end={{ x: 0.9611, y: 1 }}
        style={{
          flex: 1,
          borderRadius: wp('6.25%'),
          marginHorizontal: wp('5%'),
          marginBottom: hp('2.5%'),
          height: hp('8.75%'),
          paddingBottom: hp('1.25%'),
          paddingTop: hp('1.25%'),
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5,
        }}
      >
        <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
          {props.state.routes.map((route, index) => {
            const { options } = props.descriptors[route.key];
            const isFocused = props.state.index === index;
            
            const onPress = () => {
              const event = props.navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                props.navigation.navigate(route.name);
              }
            };

            let iconSource;
            if (route.name === 'Home') {
              iconSource = require('../Assets/Images/Home_icon.png');
            } else if (route.name === 'Appointments') {
              iconSource = require('../Assets/Images/Appointment_icon.png');
            } else if (route.name === 'Settings') {
              iconSource = require('../Assets/Images/Settings.png');
            }

            return (
              <View 
                key={route.key}
                style={{ 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flex: 1,
                }}
                onTouchEnd={onPress}
              >
                <Image 
                  source={iconSource} 
                  style={{ 
                    width: wp('6%'), 
                    height: wp('6%'), 
                    tintColor: 'white',
                    opacity: isFocused ? 1 : 0.7
                  }} 
                  resizeMode="contain"
                />
                {isFocused && (
                  <View 
                    style={{
                      position: 'absolute',
                      bottom: -hp('1%'),
                      width: wp('7.5%'),
                      height: hp('0.375%'),
                      backgroundColor: 'white',
                      borderRadius: wp('0.5%'),
                    }}
                  />
                )}
                <View style={{ marginTop: hp('0.6%') }}>
                  <Text style={{
                    fontSize: wp('3%'),
                    fontFamily: PoppinsFonts.Medium,
                    //fontWeight: '500',
                    color: 'white',
                    textAlign: 'center',
                  }}>
                    {options.tabBarLabel || route.name}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </LinearGradient>
    </View>
  );
};

const BottomTabNavigator = ({ onLogout }) => {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen 
        name="Appointments" 
        component={AppointmentsScreen}
        options={{
          title: 'Appointments',
          tabBarLabel: 'Appointments',
        }}
      />
      <Tab.Screen 
        name="Settings" 
        options={{
          title: 'Settings',
          tabBarLabel: 'Settings',
        }}
      >
        {(props) => <SettingsScreen {...props} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;
