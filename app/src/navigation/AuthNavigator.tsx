import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import Screens
import SplashScreen from '../screens/Auth/SplashScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import SignUpScreen from '../screens/Auth/SignUpScreen';
import ProfileSetupScreen from '../screens/Auth/ProfileSetupScreen';
import UsernameSetupScreen from '../screens/Auth/UsernameSetupScreen';
import LanguageSelectionScreen from '../screens/Auth/LanguageSelectionScreen';
import TopicSelectionScreen from '../screens/Auth/TopicSelectionScreen';
import HomeScreen from '../screens/Home/HomeScreen';

export type AuthStackParamList = {
  Splash: undefined;
  Login: undefined;
  SignUp: undefined;
  ProfileSetup: undefined;
  UsernameSetup: undefined;
  LanguageSelection: undefined;
  TopicSelection: undefined;
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
        name="UsernameSetup" 
        component={UsernameSetupScreen} 
        options={{ animation: 'slide_from_right', gestureEnabled: false }}
      />
      <Stack.Screen 
        name="LanguageSelection" 
        component={LanguageSelectionScreen} 
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen 
        name="TopicSelection" 
        component={TopicSelectionScreen} 
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
