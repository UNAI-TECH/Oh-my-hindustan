import React from 'react';
import { Image, StyleSheet, View, StyleProp, ViewStyle } from 'react-native';

interface PostsAppLogoProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
}

const lightLogo = require('../../assets/logo-postsapp-light.png');
const darkLogo = require('../../assets/logo-postsapp-dark.png');

const DIMENSIONS = {
  sm: { width: 108, height: 34 },
  md: { width: 132, height: 42 },
  lg: { width: 156, height: 50 },
};

/**
 * Renders the official PostsApp brand wordmark with contrast-matched variants
 * for light and dark surfaces.
 */
export default function PostsAppLogo({
  variant = 'light',
  size = 'md',
  style,
}: PostsAppLogoProps) {
  const dims = DIMENSIONS[size];
  return (
    <View style={[styles.wrapper, style]}>
      <Image
        source={variant === 'dark' ? darkLogo : lightLogo}
        style={{ width: dims.width, height: dims.height, resizeMode: 'contain' }}
        accessibilityLabel="PostsApp logo"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
