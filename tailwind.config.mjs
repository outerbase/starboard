/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme')

export default {
    mode: 'jit',
    darkMode: 'class',
    content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
    theme: {
        extend: {
            fontSize: {
                sm: ['12px', '18px'],
                base: ['14px', '21px'],
                lg: ['16px', '24px'],
                xl: ['20px', '28px'],
                '2xl': ['24px', '32px'],
                '3xl': ['30px', '40px'],
            },
            colors: {
                theme: {
                    primary: 'var(--primary-color, black)',
                    secondary: 'var(--secondary-color, white)',
                    tertiary: 'var(--tertiary-color, purple)',
                    success: 'var(--success-color, green)',
                    warning: 'var(--warning-color, yellow)',
                    error: 'var(--error-color, red)',
                },

                light: {
                    primary: {
                        400: '#834FF8',
                        500: '#A27BFA',
                        600: '#C1A7FC',
                        700: '#E0D3FD',
                    },
                    feedback: {
                        success: '#32D583',
                        warning: '#FDB022',
                        error: '#F0384E',
                    },
                    gray: {
                        100: '#FFFFFF',
                        200: '#F9F9F9',
                        300: '#EEEEEE',
                        400: '#D0D0D0',
                        500: '#959497',
                        600: '#5E5D61',
                        700: '#343438',
                        800: '#05040D',
                    },
                },
                dark: {
                    primary: {
                        400: '#834FF8',
                        500: '#633CBD',
                        600: '#442982',
                        700: '#2F1D5B',
                    },
                    feedback: {
                        success: '#32D583',
                        warning: '#FDB022',
                        error: '#F0384E',
                    },

                    gray: {
                        100: '#05040D',
                        200: '#121119',
                        300: '#1E1F24',
                        400: '#343438',
                        500: '#5E5D61',
                        600: '#959497',
                        700: '#C0C0C0',
                        800: '#FFFFFF',
                    },
                },
                canonical: {
                    purple: '#6B57E8',
                    yellow: '#FBE67F',
                    orange: '#F09252;',
                    red: '#EB4E43',
                    blue: '#70B6F9',
                    pink: '#E4AEFA',
                    green: '#79E2BE',
                    ycombinator: '#FB651E',
                },
            },
            keyframes: {
                swirl: {
                    '0%': {
                        boxShadow: '-1px -1px 1px rgba(255, 255, 255, 0.5)',
                    },
                    '25%': {
                        boxShadow: '1px -1px 1px rgba(255, 255, 255, 0.5)',
                    },
                    '50%': {
                        boxShadow: '1px 1px 1px rgba(255, 255, 255, 0.5)',
                    },
                    '75%': {
                        boxShadow: '-1px 1px 1px rgba(255, 255, 255, 0.5)',
                    },
                    '100%': {
                        boxShadow: '-1px -1px 1px rgba(255, 255, 255, 0.5)',
                    },
                },
                shine: {
                    '0%': {
                        opacity: 0,
                    },
                    '25%': {
                        opacity: 0.3,
                    },
                    '50%': {
                        opacity: 0,
                    },
                    '100%': {
                        opacity: 0,
                    },
                },
            },
            boxShadow: {
                primary: '0px 2px 8px rgba(5, 4, 13, 0.15)',
                flat: '6px 6px 1px 0px #FFF;',
            },
        },
        fontFamily: {
            ...defaultTheme.fontFamily,
            sans: ['Inter', 'Helvetica', ...defaultTheme.fontFamily.sans],
            Helvetica: ['Helvetica', 'sans-serif'],
        },
    },
    plugins: [],
    // ,plugins: [require('@headlessui/tailwindcss')]
}
