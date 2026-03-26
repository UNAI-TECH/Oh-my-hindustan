import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';

import RootNavigator from './src/navigation/RootNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { FeedProvider } from './src/context/FeedContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { navigationRef } from './src/utils/navigation';

export default function App() {
  return (
    <AuthProvider>
      <FeedProvider>
        <NotificationProvider>
          <NavigationContainer ref={navigationRef}>
            <RootNavigator />
            <StatusBar style="auto" />
          </NavigationContainer>
        </NotificationProvider>
      </FeedProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
