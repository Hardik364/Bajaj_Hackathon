module.exports = {
  // ... other config
  theme: {
    extend: {
      animation: {
        'fade-in-down': 'fadeInDown 1s ease-out',
        'fade-in-up': 'fadeInUp 1s ease-out',
        'fade-in': 'fadeIn 1.5s ease-out',
      },
      keyframes: {
        fadeInDown: {
          '0%': {
            opacity: '0',
            transform: 'translateY(-20px)'
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)'
          },
        },
        fadeInUp: {
          '0%': {
            opacity: '0',
            transform: 'translateY(20px)'
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)'
          },
        },
        fadeIn: {
          '0%': {
            opacity: '0'
          },
          '100%': {
            opacity: '1'
          },
        }
      }
    }
  }
} 