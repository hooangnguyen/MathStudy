import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import 'katex/dist/katex.min.css';
import { FirebaseProvider } from './context/FirebaseProvider';
import ErrorBoundary from './components/common/ErrorBoundary';

// Suppress specific third-party errors that might be injected by browser extensions
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

const shouldSuppress = (arg: any) => {
  if (!arg) return false;
  try {
    const errorString = (
      typeof arg === 'string' ? arg :
        arg instanceof Error ? arg.message :
          JSON.stringify(arg)
    ).toLowerCase();
    // Chỉ lọc lỗi do tiện ích ví crypto chèn vào trang. Không lọc các cụm chung chung
    // như "failed to connect"/"extension" vì sẽ nuốt mất lỗi thật (vd. mất kết nối Firestore).
    return errorString.includes('metamask') ||
      errorString.includes('coinbase') ||
      errorString.includes('chrome-extension://') ||
      errorString.includes('moz-extension://');
  } catch (e) {
    return false;
  }
};

console.error = (...args) => {
  if (args.some(shouldSuppress)) return;
  originalConsoleError(...args);
};

console.warn = (...args) => {
  if (args.some(shouldSuppress)) return;
  originalConsoleWarn(...args);
};

window.addEventListener('unhandledrejection', (event) => {
  if (shouldSuppress(event.reason)) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }
});

window.addEventListener('error', (event) => {
  const isExtensionError = event.filename && (
    event.filename.startsWith('chrome-extension://') ||
    event.filename.startsWith('moz-extension://')
  );

  if (isExtensionError || shouldSuppress(event.error) || shouldSuppress(event.message)) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <FirebaseProvider>
        <App />
      </FirebaseProvider>
    </ErrorBoundary>
  </StrictMode>,
);
