import { defineConfig } from 'vite';

export default defineConfig({
  root: 'public',     // serve /public directly
  server: {
    host: true,       // so it works inside Docker
    port: 5173
  }
});
