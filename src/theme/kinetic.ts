export const kineticPalette = {
  primary: '#3525cd',
  primaryContainer: '#4f46e5',
  primaryFixed: '#e2dfff',
  primaryFixedDim: '#c3c0ff',
  onPrimary: '#ffffff',
  onPrimaryContainer: '#dad7ff',
  secondary: '#00687a',
  secondaryFixed: '#acedff',
  secondaryContainer: '#57dffe',
  tertiary: '#684000',
  tertiaryContainer: '#885500',
  tertiaryFixed: '#ffddb8',
  background: '#f8f9fa',
  surface: '#f8f9fa',
  surfaceLow: '#f3f4f5',
  surfaceHigh: '#e7e8e9',
  surfaceHighest: '#e1e3e4',
  surfaceLowest: '#ffffff',
  surfaceDim: '#d9dadb',
  outline: '#777587',
  outlineVariant: '#c7c4d8',
  onSurface: '#191c1d',
  onSurfaceVariant: '#464555',
  error: '#ba1a1a',
  errorContainer: '#ffdad6',
} as const;

export const kineticGradient = [kineticPalette.primary, kineticPalette.primaryContainer] as const;
export const kineticWarmGradient = ['#ffb95f', '#885500'] as const;

export const kineticRadii = {
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  pill: 999,
} as const;

export const kineticShadow = {
  shadowColor: kineticPalette.primary,
  shadowOffset: { width: 0, height: 18 },
  shadowOpacity: 0.16,
  shadowRadius: 36,
  elevation: 8,
} as const;

export const kineticTypography = {
  hero: 46,
  title: 32,
  section: 24,
  body: 16,
  caption: 12,
} as const;

export const kineticSpacing = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
} as const;
