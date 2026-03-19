/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                cyber: {
                    cyan: '#00F5FF',
                    magenta: '#FF00E5',
                    dark: '#0a0a0a'
                }
            },
            fontFamily: {
                mono: ['Courier New', 'monospace'],
            }
        },
    },
    plugins: [],
}
