import { createTheme } from '@mui/material/styles';

/**
 * MUI Theme configuration synchronized with Tailwind CSS and CSS Variables
 * This ensures consistency between MUI components and custom Tailwind components.
 */
const theme = createTheme({
  cssVariables: {
    colorSchemeSelector: 'class',
  },
  colorSchemes: {
    light: {
      palette: {
        primary: {
          main: 'var(--primary)',
          light: 'var(--primary-container)',
          dark: 'var(--primary-container)',
          contrastText: 'var(--on-primary)',
        },
        primaryChannel: undefined,
        secondary: {
          main: 'var(--secondary)',
          light: 'var(--secondary-container)',
          dark: 'var(--secondary-container)',
          contrastText: 'var(--on-secondary)',
        },
        secondaryChannel: undefined,
        error: {
          main: 'var(--error)',
          light: 'var(--error-container)',
          dark: 'var(--error-container)',
          contrastText: 'var(--on-error)',
        },
        background: {
          default: 'var(--background)',
          paper: 'var(--surface)',
        },
        paperChannel: undefined,
        text: {
          primary: 'var(--on-surface)',
          secondary: 'var(--on-surface-variant)',
        },
      },
    },
    dark: {
      palette: {
        primary: {
          main: 'var(--primary)',
          light: 'var(--primary-container)',
          dark: 'var(--primary-container)',
          contrastText: 'var(--on-primary)',
        },
        primaryChannel: undefined,
        secondary: {
          main: 'var(--secondary)',
          light: 'var(--secondary-container)',
          dark: 'var(--secondary-container)',
          contrastText: 'var(--on-secondary)',
        },
        secondaryChannel: undefined,
        error: {
          main: 'var(--error)',
          light: 'var(--error-container)',
          dark: 'var(--error-container)',
          contrastText: 'var(--on-error)',
        },
        background: {
          default: 'var(--background)',
          paper: 'var(--surface)',
        },
        paperChannel: undefined,
        text: {
          primary: 'var(--on-surface)',
          secondary: 'var(--on-surface-variant)',
        },
      },
    },
  },
  typography: {
    fontFamily: 'var(--font-main)',
    h1: { fontFamily: 'var(--font-headline)', fontWeight: 900 },
    h2: { fontFamily: 'var(--font-headline)', fontWeight: 900 },
    h3: { fontFamily: 'var(--font-headline)', fontWeight: 900 },
    h4: { fontFamily: 'var(--font-headline)', fontWeight: 900 },
    h5: { fontFamily: 'var(--font-headline)', fontWeight: 900 },
    h6: { fontFamily: 'var(--font-headline)', fontWeight: 900 },
    button: {
      fontFamily: 'var(--font-headline)',
      textTransform: 'uppercase',
      fontWeight: 900,
      letterSpacing: '0.05em',
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          padding: '10px 24px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          border: '1px solid var(--outline-variant)',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'filled',
      },
      styleOverrides: {
        root: {
          '& .MuiFilledInput-root': {
            borderRadius: '12px',
            backgroundColor: 'var(--surface-variant)',
            '&:before, &:after': {
              display: 'none',
            },
          },
        },
      },
    },
  },
});

export default theme;
