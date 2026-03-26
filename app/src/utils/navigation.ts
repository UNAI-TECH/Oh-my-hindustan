import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export function navigate(name: string, params?: object) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name as never, params as never);
  } else {
    // If navigation is not ready, we can queue it or handle it appropriately
    console.warn('[NAV] Navigation not ready for:', name);
  }
}

export const NavigationService = {
  navigate,
};
