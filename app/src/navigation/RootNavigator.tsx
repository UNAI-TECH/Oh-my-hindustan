import React from 'react';
import { Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Auth Screens
import SplashScreen from '../screens/Auth/SplashScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import SignUpScreen from '../screens/Auth/SignUpScreen';
import OTPScreen from '../screens/Auth/OTPScreen';
import AuthCallbackScreen from '../screens/Auth/AuthCallbackScreen';
import ProfileSetupScreen from '../screens/Auth/ProfileSetupScreen';
import UsernameSetupScreen from '../screens/Auth/UsernameSetupScreen';
import ProfileImageUploadScreen from '../screens/Auth/ProfileImageUploadScreen';

// Main / Detail Screens
import HomeFeedScreen from '../screens/Main/HomeFeedScreen';
import ExploreScreen from '../screens/Main/ExploreScreen';
import LibraryScreen from '../screens/Other/LibraryScreen';
import ArticleDetailScreen from '../screens/Main/ArticleDetailScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import CreatorProfileScreen from '../screens/Profile/CreatorProfileScreen';
import CreatorsDirectoryScreen from '../screens/Profile/CreatorsDirectoryScreen';
import NotificationScreen from '../screens/Other/NotificationScreen';
import InterestsSelectionScreen from '../screens/Other/InterestsSelectionScreen';
import SettingsScreen from '../screens/Other/SettingsScreen';
import PersonalDetailsScreen from '../screens/Other/PersonalDetailsScreen';
import PrivacySecurityScreen from '../screens/Other/PrivacySecurityScreen';
import SearchScreen from '../screens/Other/SearchScreen';
import StaticInfoScreen from '../screens/Other/StaticInfoScreen';
import NotFoundScreen from '../screens/Other/NotFoundScreen';
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
      screenListeners={{
        state: () => {
          if (Platform.OS === 'web' && typeof document !== 'undefined') {
            const active = document.activeElement as HTMLElement | null;
            if (active && typeof active.blur === 'function' && active !== document.body) {
              active.blur();
            }
          }
        },
      }}
    >
      {/* Auth Flow */}
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="SignUp" component={SignUpScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="OTP" component={OTPScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="AuthCallback" component={AuthCallbackScreen} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="UsernameSetup" component={UsernameSetupScreen} options={{ animation: 'slide_from_right', gestureEnabled: false }} />
      <Stack.Screen name="ProfileImageUpload" component={ProfileImageUploadScreen} options={{ animation: 'slide_from_right' }} />

      {/* Main Public & Reader Screens */}
      <Stack.Screen name="Home" component={HomeFeedScreen} />
      <Stack.Screen name="Explore" component={ExploreScreen} />
      <Stack.Screen name="StoryFeed" component={StoryFeedScreen} />
      <Stack.Screen name="Library" component={LibraryScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />

      {/* Details & Discovery Screens */}
      <Stack.Screen name="ArticleDetail" component={ArticleDetailScreen} options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="StoryViewer" component={StoryViewerScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="CreatorProfile" component={CreatorProfileScreen} />
      <Stack.Screen name="CreatorsDirectory" component={CreatorsDirectoryScreen} />
      <Stack.Screen name="Notifications" component={NotificationScreen} />
      <Stack.Screen name="InterestsSelection" component={InterestsSelectionScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="PersonalDetails" component={PersonalDetailsScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="PrivacySecurity" component={PrivacySecurityScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="StaticInfo" component={StaticInfoScreen} />
      <Stack.Screen name="NotFound" component={NotFoundScreen} />

      {/* Legacy Creator Studio Screens */}
      <Stack.Screen name="CreatorDashboard" component={CreatorDashboardScreen} />
      <Stack.Screen name="CreatorAnalytics" component={CreatorAnalyticsScreen} />
      <Stack.Screen name="ContentEditor" component={ContentEditorScreen} options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="CreatorContent" component={CreatorContentScreen} />
      <Stack.Screen name="CreatorComments" component={CreatorCommentsScreen} />
      <Stack.Screen name="CreatorSettings" component={CreatorSettingsScreen} />
      <Stack.Screen name="CreatorEarn" component={CreatorEarnScreen} />
      <Stack.Screen name="CreatorSubtitles" component={CreatorSubtitlesScreen} />
      <Stack.Screen name="CreatorFeedback" component={CreatorFeedbackScreen} />

      {/* Legacy Admin Screens */}
      <Stack.Screen name="AdminOverview" component={AdminOverviewScreen} />
      <Stack.Screen name="AdminMonetization" component={AdminMonetizationScreen} />
    </Stack.Navigator>
  );
}
