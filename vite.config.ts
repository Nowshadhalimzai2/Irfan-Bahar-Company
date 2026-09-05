import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import inertia from '@inertiajs/vite';
import { bunny } from 'laravel-vite-plugin/fonts';
import tailwindcss from '@tailwindcss/vite';
import { wayfinder } from '@laravel/vite-plugin-wayfinder';

// ... keep your other imports (tailwindcss, wayfinder, bunny, etc.)

export default defineConfig({
    plugins: [
        // ... keep your existing plugins list exactly as it was
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            refresh: true,
            fonts: [
                bunny('Instrument Sans', {
                    weights: [400, 500, 600],
                }),
            ],
        }),
        inertia(),
        react({
            babel: {
                plugins: ['babel-plugin-react-compiler'],
            },
        }),
        tailwindcss(),
        wayfinder({
            formVariants: true,
        }),
    ],
    server: {
        host: '0.0.0.0', // Listen on ALL interfaces (Required for LAN)
        port: 5173,
        strictPort: true, // Fail if port is taken (prevents silent switching)
        
        // FIX 1: Explicitly allow your specific IP and localhost
        cors: {
            origin: /^https?:\/\/(192\.168\.0\.161|localhost|127\.0\.0\.1)(:\d+)?$/,
            credentials: true,
        },
        
        // FIX 2: Force HMR to use the specific IP
        hmr: {
            host: '192.168.0.161', // MUST match the IP you access from phone
            port: 5173,
            protocol: 'ws',
        },
    },
});   