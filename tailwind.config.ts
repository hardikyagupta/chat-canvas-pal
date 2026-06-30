import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
        manrope: ['Manrope', 'sans-serif'],
        mono: ['Manrope', 'sans-serif'],
        serif: ['Manrope', 'sans-serif'],
      },
      backgroundImage: {
        'main-app-bg': "url('/background.png')",
      },
      colors: {
        border: "oklch(var(--border) / <alpha-value>)",
        input: {
          DEFAULT: "oklch(var(--input) / <alpha-value>)",
          border: "oklch(var(--input-border) / <alpha-value>)"
        },
        ring: "oklch(var(--ring) / <alpha-value>)",
        background: "oklch(var(--background) / <alpha-value>)",
        foreground: {
          DEFAULT: "oklch(var(--foreground) / <alpha-value>)",
          muted: "oklch(var(--muted-foreground) / <alpha-value>)",
          tertiary: "oklch(var(--tertiary-foreground) / <alpha-value>)"
        },
        primary: {
          DEFAULT: "oklch(var(--primary) / <alpha-value>)",
          foreground: "oklch(var(--primary-foreground) / <alpha-value>)"
        },
        secondary: {
          DEFAULT: "oklch(var(--secondary) / <alpha-value>)",
          foreground: "oklch(var(--secondary-foreground) / <alpha-value>)"
        },
        destructive: {
          DEFAULT: "oklch(var(--destructive) / <alpha-value>)",
          foreground: "oklch(var(--destructive-foreground) / <alpha-value>)"
        },
        muted: {
          DEFAULT: "oklch(var(--muted) / <alpha-value>)",
          foreground: "oklch(var(--muted-foreground) / <alpha-value>)"
        },
        accent: {
          DEFAULT: "oklch(var(--accent) / <alpha-value>)",
          foreground: "oklch(var(--accent-foreground) / <alpha-value>)"
        },
        popover: {
          DEFAULT: "oklch(var(--popover) / <alpha-value>)",
          foreground: "oklch(var(--popover-foreground) / <alpha-value>)"
        },
        card: {
          DEFAULT: "oklch(var(--card) / <alpha-value>)",
          foreground: "oklch(var(--card-foreground) / <alpha-value>)"
        },
        sidebar: {
          DEFAULT: 'oklch(var(--sidebar-background) / <alpha-value>)',
          foreground: 'oklch(var(--sidebar-foreground) / <alpha-value>)',
          primary: 'oklch(var(--sidebar-primary) / <alpha-value>)',
          'primary-foreground': 'oklch(var(--sidebar-primary-foreground) / <alpha-value>)',
          accent: 'oklch(var(--sidebar-accent) / <alpha-value>)',
          'accent-foreground': 'oklch(var(--sidebar-accent-foreground) / <alpha-value>)',
          border: 'oklch(var(--sidebar-border) / <alpha-value>)',
          ring: 'oklch(var(--sidebar-ring) / <alpha-value>)'
        },
        'avatar-bg': 'var(--avatar-bg)',
        // Palette library (semantic names → OKLCH tokens; see COLORS.md)
        ink: 'var(--color-ink)',
        charcoal: 'var(--color-charcoal)',
        slate: 'var(--color-slate)',
        grey: 'var(--color-grey)',
        'grey-soft': 'var(--color-grey-soft)',
        'line-strong': 'var(--color-line-strong)',
        line: 'var(--color-line)',
        'line-input': 'var(--color-line-input)',
        'surface-2': 'var(--color-surface-2)',
        'surface-1': 'var(--color-surface-1)',
        'surface-0': 'var(--color-surface-0)',
        royal: {
          DEFAULT: 'var(--color-royal)',
          strong: 'var(--color-royal-strong)',
          pale: 'var(--color-royal-pale)',
          'pale-soft': 'var(--color-royal-pale-soft)',
        },
        navy: {
          DEFAULT: 'var(--color-navy)',
          deep: 'var(--color-navy-deep)',
          deepest: 'var(--color-navy-deepest)',
        },
        // Back-compat alias for the previous token name
        'cobalt-blue': 'var(--color-navy)',
        steel: 'var(--color-steel)',
        success: 'var(--color-success)',
        mint: 'var(--color-mint)',
        warning: 'var(--color-warning)',
        orange: 'var(--color-orange)',
        danger: 'var(--color-danger)',
        pink: 'var(--color-pink)',
        plum: 'var(--color-plum)',
      },
      borderRadius: {
        xl: "0.75rem",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)"
      },
      boxShadow: {
        header: 'var(--header-shadow)',
        footer: 'var(--footer-shadow)',
        input: 'var(--input-shadow)',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0'
          },
          to: {
            height: 'var(--radix-accordion-content-height)'
          }
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)'
          },
          to: {
            height: '0'
          }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out'
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
