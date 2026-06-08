// IMPORTANT: I'm planning on just serving the vite app as the frontend component for the local docker network for one main reason
// 1. This is a demo and I want to be able to verify docker compose up is working without losing the HMR provided by Vite. (Would be super annoying to have to constantly dc up and dc down to test things and would also be annoying to run everything locally for hot module reloads and then run it differently for docker compose.) In a real project I'd have a makefile support multiple different types of deployment patterns. Pure local, docker locally with HMR, docker with a webserver like nginx serving static contects, actually deployed out to something like AWS etc.
// Anyways the following Vite config supports the expectation of being run in a container

/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,         // listen on 0.0.0.0 so the Docker container is reachable
    port: 5173,
    watch: {
      usePolling: true, // needed for file-change events through Docker bind mounts
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
})
