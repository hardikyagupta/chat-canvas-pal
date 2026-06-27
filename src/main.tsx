import React from 'react';
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import '@fontsource/manrope/300.css'
import '@fontsource/manrope/400.css'
import '@fontsource/manrope/500.css'
import '@fontsource/manrope/600.css'
import '@fontsource/manrope/700.css'
import '@fontsource/manrope/800.css'
import './index.css'
import { ThemeProvider } from '../components/theme-provider'

console.log('Initializing application...');

try {
  const root = createRoot(document.getElementById("root")!);
  console.log('Root created successfully');
  root.render(
    <React.StrictMode>
      <ThemeProvider defaultTheme="light" storageKey="ui-theme">
        <App />
      </ThemeProvider>
    </React.StrictMode>
  );
  console.log('App rendered successfully');
} catch (error) {
  console.error('Error during application initialization:', error);
}
