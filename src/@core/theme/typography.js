const typography = fontFamily => ({
  fontFamily:
    typeof fontFamily === 'undefined' || fontFamily === ''
      ? [
          '"Public Sans"',
          'sans-serif',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
          '"Apple Color Emoji"',
          '"Segoe UI Emoji"',
          '"Segoe UI Symbol"'
        ].join(',')
      : fontFamily,
  fontSize: 12.5,
  h1: {
    fontSize: '2.5rem',
    fontWeight: 500,
    lineHeight: 1.4
  },
  h2: {
    fontSize: '2rem',
    fontWeight: 500,
    lineHeight: 1.4
  },
  h3: {
    fontSize: '1.5rem',
    fontWeight: 500,
    lineHeight: 1.5
  },
  h4: {
    fontSize: '1.25rem',
    fontWeight: 500,
    lineHeight: 1.5
  },
  h5: {
    fontSize: '1rem',
    fontWeight: 500,
    lineHeight: 1.5
  },
  h6: {
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: 1.4
  },
  subtitle1: {
    fontSize: '0.875rem',
    lineHeight: 1.4
  },
  subtitle2: {
    fontSize: '0.75rem',
    fontWeight: 400,
    lineHeight: 1.5
  },
  body1: {
    fontSize: '0.875rem',
    lineHeight: 1.4
  },
  body2: {
    fontSize: '0.75rem',
    lineHeight: 1.5
  },
  button: {
    fontSize: '0.875rem',
    lineHeight: 1.4,
    textTransform: 'none'
  },
  caption: {
    fontSize: '0.75rem',
    lineHeight: 1.3,
    letterSpacing: '0.4px'
  },
  overline: {
    fontSize: '0.625rem',
    lineHeight: 1.2,
    letterSpacing: '0.8px'
  }
})

export default typography
