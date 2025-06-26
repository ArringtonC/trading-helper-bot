// Design System Constants for Trading Helper Bot
// Implements the 10 UI/UX improvements with consistent styling

export const DesignSystem = {
  // Typography Hierarchy (Improvement #10)
  typography: {
    title: {
      fontSize: '24px',
      fontWeight: 700,
      lineHeight: '32px'
    },
    subtitle: {
      fontSize: '18px',
      fontWeight: 600,
      lineHeight: '24px'
    },
    body: {
      fontSize: '16px',
      fontWeight: 400,
      lineHeight: '22px'
    },
    caption: {
      fontSize: '14px',
      fontWeight: 400,
      lineHeight: '20px'
    },
    small: {
      fontSize: '12px',
      fontWeight: 400,
      lineHeight: '18px'
    }
  },

  // Color Palette
  colors: {
    // Primary Accent Color (Electric Blue)
    primary: '#1890ff',
    primaryHover: '#40a9ff',
    primaryActive: '#096dd9',

    // Secondary Accent (Teal)
    secondary: '#13c2c2',
    secondaryHover: '#36cfc9',
    secondaryActive: '#08979c',

    // Success/Profit Colors
    success: '#52c41a',
    successLight: '#b7eb8f',
    successDark: '#389e0d',

    // Warning/Caution Colors
    warning: '#faad14',
    warningLight: '#ffd666',
    warningDark: '#d48806',

    // Danger/Loss Colors
    danger: '#ff4d4f',
    dangerLight: '#ff7875',
    dangerDark: '#cf1322',

    // Neutral Colors
    gray: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#f0f0f0',
      300: '#d9d9d9',
      400: '#bfbfbf',
      500: '#8c8c8c',
      600: '#595959',
      700: '#434343',
      800: '#262626',
      900: '#1f1f1f'
    },

    // Psychology State Colors
    psychology: {
      optimal: '#52c41a',      // Stress 1-3
      good: '#1890ff',         // Stress 4-5
      caution: '#faad14',      // Stress 6-7
      danger: '#ff4d4f'        // Stress 8-10
    }
  },

  // Spacing System (12-column grid)
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
    xxxl: '64px'
  },

  // Grid System
  grid: {
    columns: 12,
    gutterWidth: '24px',
    containerMaxWidth: '1400px',
    breakpoints: {
      xs: '480px',
      sm: '576px',
      md: '768px',
      lg: '992px',
      xl: '1200px',
      xxl: '1600px'
    }
  },

  // Component Specific Styles
  components: {
    // Card Styles
    card: {
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      padding: '24px',
      heroCard: {
        background: 'linear-gradient(135deg, #e6f7ff 0%, #f6ffed 100%)',
        border: 'none',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
      }
    },

    // Button Styles
    button: {
      borderRadius: '6px',
      fontWeight: 500,
      primary: {
        background: '#1890ff',
        borderColor: '#1890ff'
      },
      secondary: {
        background: '#13c2c2',
        borderColor: '#13c2c2'
      }
    },

    // Progress Bar Styles
    progress: {
      strokeWidth: 12,
      success: '#52c41a',
      normal: '#1890ff',
      warning: '#faad14',
      danger: '#ff4d4f'
    },

    // Achievement Badge Styles
    achievement: {
      size: 48,
      backgroundColor: {
        unlocked: '#faad14',
        locked: '#d9d9d9'
      },
      progressCircle: {
        width: 40,
        strokeColor: {
          unlocked: '#52c41a',
          locked: '#d9d9d9'
        }
      }
    }
  },

  // Animation and Transitions
  animations: {
    transition: 'all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1)',
    hover: 'all 0.2s ease-in-out',
    pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
  },

  // Psychology Emotion Emojis
  emotions: {
    CALM: '😌',
    FOCUSED: '🎯',
    STRESSED: '😰',
    PANICKED: '😱',
    EUPHORIC: '🤩',
    FEARFUL: '😨'
  },

  // Time Block Icons for Daily Timeline
  timeBlocks: {
    morning: '🌅',
    premarket: '🔍',
    setup: '💎',
    execution: '⚔️',
    patience: '🎯',
    review: '📊'
  }
};

// CSS-in-JS Helper Functions
export const getTypographyStyle = (variant: keyof typeof DesignSystem.typography) => {
  return DesignSystem.typography[variant];
};

export const getColorStyle = (color: string, shade?: string) => {
  if (shade && color in DesignSystem.colors && typeof DesignSystem.colors[color as keyof typeof DesignSystem.colors] === 'object') {
    return (DesignSystem.colors[color as keyof typeof DesignSystem.colors] as any)[shade];
  }
  return DesignSystem.colors[color as keyof typeof DesignSystem.colors];
};

export const getSpacing = (size: keyof typeof DesignSystem.spacing) => {
  return DesignSystem.spacing[size];
};

// Ant Design Theme Override
export const antdThemeConfig = {
  token: {
    colorPrimary: DesignSystem.colors.primary,
    borderRadius: 8,
    fontSize: 16,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
  },
  components: {
    Card: {
      borderRadiusLG: 8,
      paddingLG: 24
    },
    Button: {
      borderRadius: 6,
      fontWeight: 500
    },
    Progress: {
      defaultColor: DesignSystem.colors.primary
    },
    Tabs: {
      fontSize: 16,
      fontSizeLG: 18
    }
  }
};

export default DesignSystem;