import { registerRootComponent } from 'expo';

import App from './App';

if (typeof document !== 'undefined') {
  document.getElementById('seo-prerender-wrap')?.remove();
  document.getElementById('seo-prerender')?.remove();
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
