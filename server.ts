import app from './src/server/app.ts';
import path from 'path';

const PORT = Number(process.env.PORT) || 3000;

// Mount Vite in Dev, or serve static dist in production (when running as container/local server)
async function startServer() {
  if (process.env.VERCEL) {
    // Vercel manages routing and serverless execution; do not start standalone port listener
    return;
  }

  if (process.env.NODE_ENV === 'production') {
    const express = (await import('express')).default;
    app.use(express.static(path.resolve('dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve('dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 TalentPulse AI Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();

export default app;
