import { registerRootComponent } from 'expo';
import { Platform } from 'react-native';

// import App from './App';

// Inject Arabic/Kurdish-compatible fonts on web so Kurdish text renders correctly.
// React Native Web often renders text in <div> elements with specific inline styles,
// which can cause characters to fall back to a system font that lacks Kurdish glyphs.
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  // Load Noto Naskh Arabic (Traditional) and Noto Sans Arabic (Modern UI)
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href =
    'https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;500;600;700&family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap';
  document.head.appendChild(link);

  const style = document.createElement('style');
  style.textContent = `
    /* Force all elements to inherit font-family so the global stack is respected
       even within React Native Web's auto-generated container structure. */
    *, *::before, *::after {
      font-family: inherit;
    }

    /* Global fallback: include Arabic fonts in the base font stack for all common elements.
       This ensures Arabic/Kurdish script always resolves to a proper font even in LTR contexts. */
    html, body, div, span, p {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu,
                   'Noto Naskh Arabic', 'Noto Sans Arabic', Arial, sans-serif;
    }

    /* Kurdish / Arabic script: Force the correct font for the whole page when in RTL mode. */
    :lang(ar), :lang(ku), [dir="rtl"], [dir="rtl"] * {
      font-family: 'Noto Naskh Arabic', 'Noto Sans Arabic', Arial, sans-serif !important;
    }

    /* Ensure correct directionality and bidi rendering for mixed LTR/RTL content */
    * {
      unicode-bidi: plaintext;
    }
  `;
  document.head.appendChild(style);
}

// react-grab dynamically replaced React internals which could cause infinite loops.
// Removed for stability.

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately.
import React from 'react';
import { Text, View } from 'react-native';
import App from './App';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: 'red', padding: 40, justifyContent: 'center' }}>
          <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>APP CRASHED!</Text>
          <Text style={{ color: 'white', fontSize: 14 }}>{String(this.state.error)}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

function SafeApp() {
  return <ErrorBoundary><App /></ErrorBoundary>;
}

registerRootComponent(SafeApp);
