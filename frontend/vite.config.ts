import { defineConfig } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  root: 'public',     // serve /public directly
  server: {
    host: '0.0.0.0',
    port: 5173
  }
});
