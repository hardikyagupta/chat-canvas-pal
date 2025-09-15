'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
// Correct import using relative path from components/ to src/components/ui/
import { Button } from '../src/components/ui/button';

type Theme = 'dark' | 'light' | 'system';

// === Start Reverting to Context Provider ===
interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  attribute?: string; // Keep for potential compatibility
  enableSystem?: boolean;
}

interface ThemeProviderState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  resolvedTheme?: 'dark' | 'light';
}

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
  toggleTheme: () => null,
};

const ThemeProviderContext = React.createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'ui-theme',
  attribute = 'class', // attribute determines where the class is applied (html tag)
  enableSystem = true,
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(() => {
    if (typeof window === 'undefined') {
      return defaultTheme;
    }
    return (localStorage.getItem(storageKey) as Theme) || defaultTheme;
  });
  const [resolvedTheme, setResolvedTheme] = React.useState<'dark' | 'light'>();

  React.useEffect(() => {
    const root = window.document.documentElement; // Target the <html> tag
    let effectiveTheme = theme;

    if (enableSystem && theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      effectiveTheme = mediaQuery.matches ? 'dark' : 'light';
      setResolvedTheme(effectiveTheme); // Update resolved state

      const handleChange = () => {
        const newSystemTheme = mediaQuery.matches ? 'dark' : 'light';
        setResolvedTheme(newSystemTheme);
        // Only update root class if the preference is still 'system'
        if (theme === 'system') { 
          root.classList.remove('light', 'dark');
          root.classList.add(newSystemTheme);
        }
      };

      mediaQuery.addEventListener('change', handleChange);
      // Apply initial system theme class
      root.classList.remove('light', 'dark');
      root.classList.add(effectiveTheme);
      return () => mediaQuery.removeEventListener('change', handleChange);

    } else {
      // Handle explicit light/dark themes
      setResolvedTheme(effectiveTheme as 'light' | 'dark');
      root.classList.remove('light', 'dark');
      root.classList.add(effectiveTheme);
    }

  }, [theme, enableSystem]); // Rerun effect if theme preference or system enabling changes

  const setTheme = (newTheme: Theme) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, newTheme);
    }
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    // Determine the next theme based on the *resolved* theme
    const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme); // Set the preference explicitly
  };

  const value = {
    theme,
    setTheme,
    toggleTheme,
    resolvedTheme
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

// Hook to use the context
export function useTheme() {
  const context = React.useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider');

  return context;
}
// === End Reverting to Context Provider ===


// ThemeToggle Button Component (Now uses the context via useTheme)
export function ThemeToggle() {
  // Get toggle function from context
  const { toggleTheme } = useTheme(); 

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="h-7 w-7 text-foreground/60 hover:bg-muted/50 hover:text-foreground/80"
    >
      {/* Sun icon should be visible in DARK mode (to switch to Light) */}
      <Sun className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      {/* Moon icon should be visible in LIGHT mode (to switch to Dark) */}
      <Moon className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
} 