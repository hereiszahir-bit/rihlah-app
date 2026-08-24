// Rihlah Design System — Dark-First Premium

export const colors = {
  // Core (dark-first)
  bg: '#0a0a0a',
  surface: '#141414',
  surfaceElevated: '#1a1a1a',
  text: '#f5f1ea',
  textSecondary: '#a8a29e',
  textTertiary: '#6b6560',
  textMuted: '#3d3935',

  // Accent
  terracotta: '#c4956a',
  olive: '#7a9a6a',
  gold: '#c4956a',
  cream: '#f5f1ea',
  dark: '#1a1a1a',
  warmGray: '#2a2725',
  lightGray: '#1e1c1a',

  // Functional
  border: '#1e1c1a',
  divider: '#1e1c1a',
  cardShadow: 'rgba(0, 0, 0, 0.3)',

  // Status
  success: '#7a9a6a',
  successBg: 'rgba(122, 154, 106, 0.15)',
  warning: '#c4956a',
  warningBg: 'rgba(196, 149, 106, 0.15)',
  error: '#c45a5a',
  errorBg: 'rgba(196, 90, 90, 0.15)',

  // Glass
  glass: 'rgba(20, 20, 20, 0.85)',
  glassBorder: 'rgba(255, 255, 255, 0.06)',
};

export const fonts = {
  serif: "'DM Serif Display', Georgia, serif",
  sans: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

export const radius = {
  sm: '10px',
  md: '14px',
  lg: '20px',
  xl: '28px',
  full: '9999px',
};

// Reusable text styles
export const type = {
  heroTitle: {
    fontFamily: fonts.serif,
    fontSize: '32px',
    fontWeight: '500',
    letterSpacing: '-0.5px',
    color: colors.text,
    lineHeight: 1.1,
  },
  pageTitle: {
    fontFamily: fonts.serif,
    fontSize: '28px',
    fontWeight: '500',
    color: colors.text,
    letterSpacing: '-0.3px',
  },
  sectionTitle: {
    fontFamily: fonts.serif,
    fontSize: '20px',
    fontWeight: '500',
    color: colors.text,
  },
  label: {
    fontSize: '11px',
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
    border: `1px solid ${colors.border}`,
  },
  pill: {
    display: 'inline-block',
    padding: '6px 14px',
    borderRadius: radius.full,
    fontSize: '12px',
    fontWeight: '500',
    background: colors.warmGray,
    color: colors.textSecondary,
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
    background: colors.terracotta,
    color: '#0a0a0a',
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
    border: `1.5px solid ${colors.warmGray}`,
    color: colors.textSecondary,
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
  frostedHeader: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    background: colors.glass,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderBottom: `1px solid ${colors.glassBorder}`,
  },
};
