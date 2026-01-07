/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#667eea',
          dark: '#764ba2',
        },
        secondary: {
          pink: '#f093fb',
          cyan: '#4facfe',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      aspectRatio: {
        'video': '16 / 9',
        'square': '1 / 1',
        'portrait': '3 / 4',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        'slide-in-right': 'slideInRight 0.5s ease-out forwards',
        'slide-in-left': 'slideInLeft 0.5s ease-out forwards',
        'bounce-gentle': 'bounceGentle 2s infinite',
        'pulse-soft': 'pulseSoft 3s infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'shimmer': 'shimmer 2s linear infinite',
        'spin-slow': 'spin 3s linear infinite',
        'wiggle': 'wiggle 1s ease-in-out infinite',
        'heartbeat': 'heartbeat 1.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(50px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-50px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        bounceGentle: {
          '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' },
          '40%': { transform: 'translateY(-10px)' },
          '60%': { transform: 'translateY(-5px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(102, 126, 234, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(102, 126, 234, 0.8)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        heartbeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
      },
    },
  },
  plugins: [],
}
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#667eea',
          dark: '#764ba2',
        },
        secondary: {
          pink: '#f093fb',
          cyan: '#4facfe',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      scale: {
        '102': '1.02',
        '103': '1.03',
        '104': '1.04',
      },
      animation: {
        'draw-check': 'drawCheck 3s ease-in-out infinite',
        'ticket-tear-left': 'ticketTearLeft 4s ease-in-out infinite',
        'ticket-tear-right': 'ticketTearRight 4s ease-in-out infinite',
        'coin-drop': 'coinDrop 3s ease-in-out infinite',
        'coin-shadow': 'coinShadow 3s ease-in-out infinite',
        'tent-build': 'tentBuild 4s ease-in-out infinite',
        'pole-grow': 'poleGrow 4s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'fade-in-down': 'fadeInDown 0.6s ease-out',
        'slide-in-left': 'slideInLeft 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.5s ease-out',
        'bounce-gentle': 'bounceGentle 2s infinite',
        'pulse-slow': 'pulse 3s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-100px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(100px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        drawCheck: {
          '0%, 20%': { strokeDashoffset: '100', opacity: '0' },
          '40%, 80%': { strokeDashoffset: '0', opacity: '1' },
          '100%': { strokeDashoffset: '0', opacity: '1' },
        },
        ticketTearLeft: {
          '0%, 20%': { transform: 'translateX(0) rotate(0deg)' },
          '40%, 60%': { transform: 'translateX(-15px) rotate(-10deg)' },
          '80%, 100%': { transform: 'translateX(0) rotate(0deg)' },
        },
        ticketTearRight: {
          '0%, 20%': { transform: 'translateX(0) rotate(0deg)' },
          '40%, 60%': { transform: 'translateX(15px) rotate(10deg)' },
          '80%, 100%': { transform: 'translateX(0) rotate(0deg)' },
        },
        coinDrop: {
          '0%': { transform: 'translateY(-30px) scale(0.5)', opacity: '0' },
          '30%': { transform: 'translateY(0) scale(1)', opacity: '1' },
          '50%, 100%': { transform: 'translateY(0) scale(1)', opacity: '1' },
        },
        },
        coinShadow: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '30%': { transform: 'scale(1)', opacity: '0.5' },
          '50%, 100%': { transform: 'scale(1)', opacity: '0.5' },
        },
        tentBuild: {
          '0%, 20%': { transform: 'scaleY(0)', opacity: '0' },
          '50%, 100%': { transform: 'scaleY(1)', opacity: '1' },
        },
        poleGrow: {
          '0%, 40%': { transform: 'scaleY(0)', opacity: '0' },
          '70%, 100%': { transform: 'scaleY(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
