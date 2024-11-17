import 'dotenv/config';

export const DID = process.env.DID ?? '';
export const SIGNING_KEY = process.env.SIGNING_KEY ?? '';
// En Railway, process.env.PORT siempre está definido
export const PORT = process.env.PORT ? Number(process.env.PORT) : 4100;
export const METRICS_PORT = process.env.METRICS_PORT ? Number(process.env.METRICS_PORT) : 4101;
export const FIREHOSE_URL = process.env.FIREHOSE_URL ?? 'wss://jetstream1.us-east.bsky.network/subscribe';
export const PUBLIC_URL = process.env.PUBLIC_URL ?? 'https://web-production-8d41.up.railway.app';
export const WANTED_COLLECTION = 'app.bsky.feed.like';
export const BSKY_IDENTIFIER = process.env.BSKY_IDENTIFIER ?? '';
export const BSKY_PASSWORD = process.env.BSKY_PASSWORD ?? '';
export const CURSOR_UPDATE_INTERVAL =
  process.env.CURSOR_UPDATE_INTERVAL ? Number(process.env.CURSOR_UPDATE_INTERVAL) : 60000;
