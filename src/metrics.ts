import express from 'express';
import client from 'prom-client';

import logger from './logger.js';

const register = new client.Registry();
client.collectDefaultMetrics({ register });

export function startMetricsServer(port: number) {
  const app = express();

  app.get('/metrics', async (req, res) => {
    try {
      res.set('Content-Type', register.contentType);
      res.end(await register.metrics());
    } catch (error) {
      res.status(500).end(error);
    }
  });

  const server = app.listen(port, '0.0.0.0', () => {
    logger.info(`Metrics server is listening on 0.0.0.0:${port}`);
  });

  return server;
}
