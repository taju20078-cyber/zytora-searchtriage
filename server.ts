import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// API health endpoint for deployment probes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'SearchIQ Triage Engine',
    timestamp: new Date().toISOString(),
  });
});

// Serve production static assets from dist
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Fallback to index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`SearchIQ server listening on port ${port}`);
});
