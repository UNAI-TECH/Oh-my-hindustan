import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';

import RootNavigator from './src/navigation/RootNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { FeedProvider } from './src/context/FeedContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { InteractionProvider } from './src/context/InteractionContext';
import { navigationRef } from './src/utils/navigation';
import { ThemeProvider } from './src/context/ThemeContext';
import './src/lib/i18n';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <InteractionProvider>
          <FeedProvider>
            <NotificationProvider>
              <NavigationContainer ref={navigationRef}>
                <RootNavigator />
                <StatusBar style="auto" />
              </NavigationContainer>
            </NotificationProvider>
          </FeedProvider>
        </InteractionProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
