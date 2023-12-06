/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme')

export default {
    mode: 'jit',
    // darkMode: 'class',
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
            spacing: {
                'cell-padding-x': 'var(--cell-padding-x, 0.25rem)',
                'cell-padding-y': 'var(--cell-padding-y, 0.25rem)',
                // 'cell-padding-x-sm': 'var(--cell-padding-x, 0.1rem)',
                // 'cell-padding-y-sm': 'var(--cell-padding-y, 0.1rem)',
            },
            colors: {
                theme: {
                    primary: 'var(--primary-color, indigo)',
                    secondary: 'var(--secondary-color, white)',
                    tertiary: 'var(--tertiary-color, purple)',
                    success: 'var(--success-color, green)',
                    warning: 'var(--warning-color, yellow)',
                    error: 'var(--error-color, red)',

                    page: 'var(--page-background-color, #ffffff)',
                    'page-dark': 'var(--page-background-color-dark, #000000)',
                    text: 'var(--text-color, #000000)',
                    'text-dark': 'var(--text-color-dark, #ffffff)',

                    // TABLES ///
                    column: 'var(--column-header-background-color, rgba(0,0,0,0.1))',
                    'column-dark': 'var(--column-header-background-color-dark, rgba(255,255,255,0.1))',
                    'column-text': 'var(--column-header-text-color-dark, #000000)',
                    'column-text-dark': 'var(--column-header-text-color-dark, #ffffff)',
                    'row-even': 'var(--table-row-even-background-color, #ffffff)',
                    'row-odd': 'var(--table-row-odd-background-color, #fefefe)',
                    'row-even-dark': 'var(--table-row-even-background-color-dark, #000000)',
                    'row-odd-dark': 'var(--table-row-odd-background-color-dark, #010101)',
                    hover: 'var(--hover-background-color, #fafafa)',
                    'hover-dark': 'var(--hover-background-color-dark, #0a0a0a)',
                    //
                    // unused
                    // active: 'var(--active-background-color-dark, #fefefe)',
                    // 'active-dark': 'var(--active-background-color-dark, red)',
                    // 'active-text': 'var(--active-text-color, yellow)',
                    // 'active-text-dark': 'var(--active-text-color-dark,blue)',
                    //
                    // these class may be redundant vs using `row-even` and `row-odd`
                    // cell: 'var(--cell-background-color, lime)',
                    // 'cell-dark': 'var(--cell-background-color-dark, green)',
                    // 'cell-text': 'var(--cell-text-color, indigo)',
                    // 'cell-text-dark': 'var(--cell-text-color, pink)',
                    //
                    // TABLES ///
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
