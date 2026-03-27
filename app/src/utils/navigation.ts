import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef<any>();

export function navigate(name: string, params?: object) {
  if (navigationRef.isReady()) {
    if (params) {
      navigationRef.navigate(name, params);
    } else {
      navigationRef.navigate(name);
    }
  } else {
    // If navigation is not ready, we can queue it or handle it appropriately
    console.warn('[NAV] Navigation not ready for:', name);
  }
}

export const NavigationService = {
  navigate,
};
