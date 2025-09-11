import { defineConfig } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  root: 'public',     // serve /public directly
  server: {
    host: process.env.VITE_LOCAL_ADDRESS,       // so it works inside Docker
    port: 5173
  }
});
