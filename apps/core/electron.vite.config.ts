import { defineConfig, externalizeDepsPlugin } from 'electron-vite'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin({ exclude: ['@dcc/contracts', '@dcc/data'] })],
    build: {
      rollupOptions: {
        external: ['better-sqlite3', 'sharp', /^@img\/sharp-/]
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin({ exclude: ['@dcc/contracts', '@dcc/data'] })]
  }
})
