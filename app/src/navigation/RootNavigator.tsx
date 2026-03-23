import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Auth Screens
import SplashScreen from '../screens/Auth/SplashScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import SignUpScreen from '../screens/Auth/SignUpScreen';
import ProfileSetupScreen from '../screens/Auth/ProfileSetupScreen';

// Main / Detail Screens
import HomeFeedScreen from '../screens/Main/HomeFeedScreen';
import ExploreScreen from '../screens/Main/ExploreScreen';
import LibraryScreen from '../screens/Other/LibraryScreen';
import ArticleDetailScreen from '../screens/Main/ArticleDetailScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import CreatorProfileScreen from '../screens/Profile/CreatorProfileScreen';
import NotificationScreen from '../screens/Other/NotificationScreen';
import InterestsSelectionScreen from '../screens/Other/InterestsSelectionScreen';
import SettingsScreen from '../screens/Other/SettingsScreen';
import SearchScreen from '../screens/Other/SearchScreen';

// Creator Studio Screens
import CreatorDashboardScreen from '../screens/Creator/CreatorDashboardScreen';
import CreatorAnalyticsScreen from '../screens/Creator/CreatorAnalyticsScreen';
import ContentEditorScreen from '../screens/Creator/ContentEditorScreen';

// Admin Dashboards
import AdminOverviewScreen from '../screens/Admin/AdminOverviewScreen';
import AdminMonetizationScreen from '../screens/Admin/AdminMonetizationScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <Stack.Navigator 
      id="MainStack" 
      initialRouteName="Splash" 
      screenOptions={{ headerShown: false, animation: 'fade' }}
    >
      {/* Auth Flow */}
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="SignUp" component={SignUpScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} options={{ animation: 'slide_from_right' }} />

      {/* Main Tabs Equivalent Screens */}
      <Stack.Screen name="Home" component={HomeFeedScreen} />
      <Stack.Screen name="Explore" component={ExploreScreen} />
      <Stack.Screen name="Library" component={LibraryScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />

      {/* Details & Other Screens */}
      <Stack.Screen name="ArticleDetail" component={ArticleDetailScreen} options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="CreatorProfile" component={CreatorProfileScreen} />
      <Stack.Screen name="Notifications" component={NotificationScreen} />
      <Stack.Screen name="InterestsSelection" component={InterestsSelectionScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
      
      {/* Creator Studio Screens */}
      <Stack.Screen name="CreatorDashboard" component={CreatorDashboardScreen} />
      <Stack.Screen name="CreatorAnalytics" component={CreatorAnalyticsScreen} />
      <Stack.Screen name="ContentEditor" component={ContentEditorScreen} />

      {/* Admin Dashboard Screens */}
      <Stack.Screen name="AdminOverview" component={AdminOverviewScreen} />
      <Stack.Screen name="AdminMonetization" component={AdminMonetizationScreen} />
    </Stack.Navigator>
  );
}
