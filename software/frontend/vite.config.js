import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

import viteCompression from 'vite-plugin-compression';

// https://vitejs.dev/config/
export default defineConfig({
    base: '', // Relative paths for ESP32
    build: {
        outDir: '../../firmware/data',  // Output to PlatformIO LittleFS data dir
        emptyOutDir: true,
    },
    plugins: [
        react(),
        viteCompression({ algorithm: 'gzip' }), // Compress for ESP32
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
            manifest: {
                name: 'Hydroponic Monitor',
                short_name: 'HydroMonitor',
                description: 'Control your hydroponics system',
                theme_color: '#ffffff',
                icons: [
                    {
                        src: 'pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    }
                ]
            }
        })
    ],
})
