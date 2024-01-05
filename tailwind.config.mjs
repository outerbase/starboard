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
                'cell-padding-x': 'var(--cell-padding-x, 16px)',
                'cell-padding-y': 'var(--cell-padding-y, 8px)',
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

                    page: 'var(--page-background-color, rgb(245,245,245))',
                    'page-dark': 'var(--page-background-color-dark, rgb(10,10,10))',
                    text: 'var(--text-color, #000000)',
                    'text-dark': 'var(--text-color-dark, #ffffff)',

                    table: 'var(--table-background-color, rgb(255,255,255))',
                    'table-dark': 'var(--table-background-color, rgb(10,10,10))',

                    // borders
                    border: 'var(--border-color, #e5e7eb)',
                    'border-dark': 'var(--border-color-dark, rgb(52,52,56))',

                    // column headers
                    column: 'var(--column-header-background-color, rgba(255,255,255,0.9))',
                    'column-dark': 'var(--column-header-background-color-dark, rgba(0,0,0,0.9))',
                    'column-text': 'var(--column-header-text-color, #000000)',
                    'column-text-dark': 'var(--column-header-text-color-dark, #ffffff)',

                    // rows
                    'row-even': 'var(--table-row-even-background-color, rgba(0,0,0,0.01))',
                    'row-even-dark': 'var(--table-row-even-background-color-dark, rgba(255,255,255,0.01))',
                    'row-odd': 'var(--table-row-odd-background-color, rgba(0,0,0,0.02))',
                    'row-odd-dark': 'var(--table-row-odd-background-color-dark, rgba(255,255,255,0.02))',
                    'row-hover': 'var(--hover-background-color, rgba(0,0,0,0.03))',
                    'row-hover-dark': 'var(--hover-background-color-dark, rgba(255,255,255,0.03))',
                    'row-selected': 'var(--table-row-selected-background-color, rgba(254,253,232,0.7))',
                    'row-selected-dark': 'var(--table-row-selected-background-color-dark, rgba(66, 32, 6, 0.8))',
                    'row-selected-hover': 'var(--table-row-selected-hover-background-color, rgba(254,253,232,1))',
                    'row-selected-hover-dark': 'var(--table-row-selected-hover-background-color-dark, rgb(66, 32, 6, 1))',
                    'row-dirty': 'var(--table-row-dirty, rgba(254, 252, 232, 1))',
                    'row-dirty-dark': 'var(--table-row-dirty-dark, rgba(66, 32, 6, 1))',

                    // unused
                    // active: 'var(--active-background-color-dark, #fefefe)',
                    // 'active-dark': 'var(--active-background-color-dark, red)',
                    // 'active-text': 'var(--active-text-color, yellow)',
                    // 'active-text-dark': 'var(--active-text-color-dark,blue)',

                    // clean cells
                    // these classes may be redundant / hide row colors
                    // cell: 'var(--cell-background-color)',
                    // 'cell-dark': 'var(--cell-background-color-dark)',
                    // 'cell-text': 'var(--cell-text-color)',
                    // 'cell-text-dark': 'var(--cell-text-color)',

                    // dirty cells
                    'cell-dirty': 'var(--cell-dirty-background-color, #fef9c3)',
                    'cell-dirty-dark': 'var(--cell-dirty-background-color, #713f12)',
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
