import { defineConfig } from 'drizzle-kit';

// As migrações são escritas à mão em SQL (pasta migrations/) e aplicadas pelo Wrangler.
export default defineConfig({
  dialect: 'sqlite',
  driver: 'd1-http',
  schema: './src/worker/db/schema.ts',
  out: './migrations',
});
