import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Auth Screens
import SplashScreen from '../screens/Auth/SplashScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import SignUpScreen from '../screens/Auth/SignUpScreen';
import OTPScreen from '../screens/Auth/OTPScreen';
import ProfileSetupScreen from '../screens/Auth/ProfileSetupScreen';
import UsernameSetupScreen from '../screens/Auth/UsernameSetupScreen';
import LanguageSelectionScreen from '../screens/Auth/LanguageSelectionScreen';
import TopicSelectionScreen from '../screens/Auth/TopicSelectionScreen';
import ProfileImageUploadScreen from '../screens/Auth/ProfileImageUploadScreen';

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
import PersonalDetailsScreen from '../screens/Other/PersonalDetailsScreen';
import PrivacySecurityScreen from '../screens/Other/PrivacySecurityScreen';
import SearchScreen from '../screens/Other/SearchScreen';
import StoryFeedScreen from '../screens/Main/StoryFeedScreen';
import StoryViewerScreen from '../screens/Main/StoryViewerScreen';

// Creator Studio Screens
import CreatorDashboardScreen from '../screens/Creator/CreatorDashboardScreen';
import CreatorAnalyticsScreen from '../screens/Creator/CreatorAnalyticsScreen';
import ContentEditorScreen from '../screens/Creator/ContentEditorScreen';
import CreatorContentScreen from '../screens/Creator/CreatorContentScreen';
import CreatorCommentsScreen from '../screens/Creator/CreatorCommentsScreen';
import CreatorSettingsScreen from '../screens/Creator/CreatorSettingsScreen';
import CreatorEarnScreen from '../screens/Creator/CreatorEarnScreen';
import CreatorSubtitlesScreen from '../screens/Creator/CreatorSubtitlesScreen';
import CreatorFeedbackScreen from '../screens/Creator/CreatorFeedbackScreen';

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
      <Stack.Screen name="OTP" component={OTPScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="UsernameSetup" component={UsernameSetupScreen} options={{ animation: 'slide_from_right', gestureEnabled: false }} />
      <Stack.Screen name="LanguageSelection" component={LanguageSelectionScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="TopicSelection" component={TopicSelectionScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="ProfileImageUpload" component={ProfileImageUploadScreen} options={{ animation: 'slide_from_right' }} />

      {/* Main Tabs Equivalent Screens */}
      <Stack.Screen name="Home" component={HomeFeedScreen} />
      <Stack.Screen name="Explore" component={ExploreScreen} />
      <Stack.Screen name="StoryFeed" component={StoryFeedScreen} />
      <Stack.Screen name="Library" component={LibraryScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />

      {/* Details & Other Screens */}
      <Stack.Screen name="ArticleDetail" component={ArticleDetailScreen} options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="StoryViewer" component={StoryViewerScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="CreatorProfile" component={CreatorProfileScreen} />
      <Stack.Screen name="Notifications" component={NotificationScreen} />
      <Stack.Screen name="InterestsSelection" component={InterestsSelectionScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="PersonalDetails" component={PersonalDetailsScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="PrivacySecurity" component={PrivacySecurityScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="Search" component={SearchScreen} />
      
      {/* Creator Studio Screens */}
      <Stack.Screen name="CreatorDashboard" component={CreatorDashboardScreen} />
      <Stack.Screen name="CreatorAnalytics" component={CreatorAnalyticsScreen} />
      <Stack.Screen name="ContentEditor" component={ContentEditorScreen} options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="CreatorContent" component={CreatorContentScreen} />
      <Stack.Screen name="CreatorComments" component={CreatorCommentsScreen} />
      <Stack.Screen name="CreatorSettings" component={CreatorSettingsScreen} />
      <Stack.Screen name="CreatorEarn" component={CreatorEarnScreen} />
      <Stack.Screen name="CreatorSubtitles" component={CreatorSubtitlesScreen} />
      <Stack.Screen name="CreatorFeedback" component={CreatorFeedbackScreen} />

      {/* Admin Dashboard Screens */}
      <Stack.Screen name="AdminOverview" component={AdminOverviewScreen} />
      <Stack.Screen name="AdminMonetization" component={AdminMonetizationScreen} />
    </Stack.Navigator>
  );
}
