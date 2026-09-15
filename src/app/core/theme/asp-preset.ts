import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

/**
 * ASP PrimeNG preset.
 *
 * Built on Aura and overridden with the Assembly Services Portal identity:
 * deep blue primary, green secondary and a Ghanaian gold accent. The hex values
 * mirror `src/styles/_tokens.scss` so PrimeNG components and our own layout CSS
 * share one palette.
 *
 * Dark mode is driven by the `.app-dark` class on <html> (see ThemeService),
 * wired through `providePrimeNG({ theme: { options: { darkModeSelector } } })`.
 */

/** Deep blue ramp — the government-facing primary. */
const blue = {
  50: '#f3f8fc',
  100: '#e3eef7',
  200: '#c3dbed',
  300: '#95bfdd',
  400: '#5f9dc9',
  500: '#2b7cba',
  600: '#16619f',
  700: '#0f4c81', // brand primary
  800: '#0b3c68',
  900: '#072d4f',
  950: '#041d34',
};

/** Green ramp — success, revenue and secondary actions. */
const green = {
  50: '#f1fbf7',
  100: '#e0f5ed',
  200: '#b9e9d8',
  300: '#84d8bb',
  400: '#23b884',
  500: '#0e9f6e', // brand secondary
  600: '#0a8a5e',
  700: '#07724d',
  800: '#065c3f',
  900: '#054a34',
  950: '#02291d',
};

export const AspPreset = definePreset(Aura, {
  semantic: {
    primary: blue,
    focusRing: {
      width: '2px',
      style: 'solid',
      color: '{primary.color}',
      offset: '2px',
    },
    formField: {
      borderRadius: '10px',
      paddingX: '0.85rem',
      paddingY: '0.65rem',
    },
    content: {
      borderRadius: '12px',
    },
    colorScheme: {
      light: {
        primary: {
          color: '{blue.700}',
          contrastColor: '#ffffff',
          hoverColor: '{blue.800}',
          activeColor: '{blue.900}',
        },
        surface: {
          0: '#ffffff',
          50: '#f5f7fa',
          100: '#e8edf2',
          200: '#d7dfe7',
          300: '#b9c5d1',
          400: '#8697a9',
          500: '#61748a',
          600: '#43566a',
          700: '#2d3e50',
          800: '#1d2b3a',
          900: '#101a24',
          950: '#080f16',
        },
      },
      dark: {
        primary: {
          color: '{blue.300}',
          contrastColor: '{surface.900}',
          hoverColor: '{blue.200}',
          activeColor: '{blue.100}',
        },
      },
    },
  },
  components: {
    button: {
      root: {
        borderRadius: '10px',
        paddingX: '1.1rem',
        label: { fontWeight: '600' },
      },
    },
    card: {
      root: {
        borderRadius: '14px',
        shadow: '0 1px 2px rgba(16, 26, 36, 0.06)',
      },
      body: { padding: '1.4rem' },
    },
    datatable: {
      headerCell: {
        // Column headers read as labels, not shouty table furniture.
        background: '{surface.50}',
        color: '{surface.500}',
      },
    },
    tag: {
      root: { borderRadius: '999px', fontWeight: '600' },
    },
  },
});
