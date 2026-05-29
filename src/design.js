// Rihlah Design System — Variant C: Premium Editorial

export const colors = {
  // Core
  bg: '#f8f6f2',
  surface: '#ffffff',
  text: '#1a1a1a',
  textSecondary: '#6b6b6b',
  textTertiary: '#999999',
  textMuted: '#b0ab9f',

  // Accent
  dark: '#1a1a1a',
  gold: '#c9a96e',
  cream: '#f8f6f2',
  warmGray: '#e8e5e0',
  lightGray: '#f0ede8',

  // Functional
  border: '#e8e5e0',
  divider: '#e8e5e0',
  cardShadow: 'rgba(0, 0, 0, 0.06)',

  // Status
  success: '#2e7d32',
  successBg: '#e8f5e9',
  warning: '#e65100',
  warningBg: '#fff3e0',
  error: '#dc2626',
  errorBg: '#fef2f2',
};

export const fonts = {
  serif: "'Playfair Display', Georgia, serif",
  sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

export const radius = {
  sm: '10px',
  md: '14px',
  lg: '20px',
  full: '9999px',
};

// Reusable text styles
export const type = {
  heroTitle: {
    fontFamily: fonts.serif,
    fontSize: '28px',
    fontWeight: '500',
    letterSpacing: '-0.3px',
    color: colors.text,
  },
  pageTitle: {
    fontFamily: fonts.serif,
    fontSize: '24px',
    fontWeight: '500',
    color: colors.text,
  },
  sectionTitle: {
    fontFamily: fonts.serif,
    fontSize: '20px',
    fontWeight: '500',
    color: colors.text,
  },
  label: {
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    color: colors.textTertiary,
  },
  body: {
    fontSize: '15px',
    lineHeight: '1.6',
    color: colors.textSecondary,
  },
  caption: {
    fontSize: '13px',
    color: colors.textTertiary,
  },
};

// Common component styles
export const components = {
  card: {
    background: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    boxShadow: `0 2px 8px ${colors.cardShadow}`,
  },
  cardDark: {
    background: colors.dark,
    color: colors.cream,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  pill: {
    display: 'inline-block',
    padding: '6px 14px',
    borderRadius: radius.full,
    fontSize: '12px',
    fontWeight: '500',
    background: colors.lightGray,
    color: colors.text,
  },
  btnPrimary: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: '14px 28px',
    borderRadius: radius.md,
    fontSize: '15px',
    fontWeight: '600',
    border: 'none',
    cursor: 'pointer',
    background: colors.dark,
    color: colors.surface,
  },
  btnOutline: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: '14px 28px',
    borderRadius: radius.md,
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    background: 'transparent',
    border: `1.5px solid ${colors.dark}`,
    color: colors.dark,
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    border: `1.5px solid ${colors.warmGray}`,
    borderRadius: radius.md,
    fontSize: '15px',
    fontFamily: fonts.sans,
    background: colors.surface,
    color: colors.text,
    outline: 'none',
    boxSizing: 'border-box',
  },
  divider: {
    height: '1px',
    background: colors.divider,
    margin: '20px 24px',
  },
};
