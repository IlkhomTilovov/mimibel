export interface ThemeColors {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
  warmCream: string;
  warmBeige: string;
  warmBrown: string;
  darkWood: string;
  goldAccent: string;
  sageGreen: string;
}

export interface ThemeTypography {
  fontSans: string;
  fontSerif: string;
  fontHeading: string;
}

export interface ThemeComponentStyles {
  borderRadius: string;
  buttonRadius: string;
  cardRadius: string;
  shadowSm: string;
  shadowMd: string;
  shadowLg: string;
}

export interface ThemeLayoutSettings {
  containerMaxWidth: string;
  sectionSpacing: string;
  cardPadding: string;
}

export interface Theme {
  id?: string;
  name: string;
  slug: string;
  colorPalette: ThemeColors;
  typography: ThemeTypography;
  componentStyles: ThemeComponentStyles;
  layoutSettings: ThemeLayoutSettings;
  isActive?: boolean;
  isDark: boolean;
}
