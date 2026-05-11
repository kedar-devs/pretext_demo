import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

/** GitHub Pages project path; must match the repo name segment in the site URL. */
const base = '/pretext_demo/'
const routerBasename = base.replace(/\/$/, '') || '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  define: {
    // Safer than import.meta.env.BASE_URL for RR basename (always inlined).
    __ROUTER_BASENAME__: JSON.stringify(routerBasename),
  },
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
})
