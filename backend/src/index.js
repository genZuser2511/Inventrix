import { serve } from '@hono/node-server';
import { Hono } from 'hono';

const app = new Hono();

app.get('/', (c) => c.json({ message: 'Welcome to Inventrix API' }));
app.get('/api/status', (c) => c.json({ status: 'ok', service: 'Inventrix Backend' }));

const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;
console.log(`Backend server is running on http://localhost:${port}`);

serve({ fetch: app.fetch, port });
