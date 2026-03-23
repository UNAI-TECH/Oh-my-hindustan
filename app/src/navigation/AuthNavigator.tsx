import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import Screens
import SplashScreen from '../screens/Auth/SplashScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import SignUpScreen from '../screens/Auth/SignUpScreen';
import ProfileSetupScreen from '../screens/Auth/ProfileSetupScreen';
import HomeScreen from '../screens/Home/HomeScreen';

export type AuthStackParamList = {
  Splash: undefined;
  Login: undefined;
  SignUp: undefined;
  ProfileSetup: undefined;
  Home: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  return (
    <Stack.Navigator 
      id="AuthStack"
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen 
        name="Login" 
        component={LoginScreen} 
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen 
        name="SignUp" 
        component={SignUpScreen} 
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen 
        name="ProfileSetup" 
        component={ProfileSetupScreen} 
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ animation: 'fade' }}
      />
    </Stack.Navigator>
  );
}
