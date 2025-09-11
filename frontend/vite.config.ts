import { defineConfig } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  root: 'public',     // serve /public directly
  server: {
    host: process.env.VITE_LOCAL_ADDRESS,
    port: 5173
  }
});
