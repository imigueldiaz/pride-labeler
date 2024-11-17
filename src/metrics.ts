import express from 'express';
import client from 'prom-client';

import logger from './logger.js';

const register = new client.Registry();
client.collectDefaultMetrics({ register });

export function startMetricsServer(port: number) {
  const app = express();
  const host = '0.0.0.0';

  app.get('/metrics', async (req, res) => {
    try {
      res.set('Content-Type', register.contentType);
      res.end(await register.metrics());
    } catch (error) {
      res.status(500).end(error);
    }
  });

  const server = app.listen(port, host, () => {
    logger.info(`Metrics server is listening on ${host}:${port}`);
  });

  return server;
}
