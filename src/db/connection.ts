import mongoose from 'mongoose';
import logger from '../logger.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: join(__dirname, '../..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

logger.info('MongoDB URI:', MONGODB_URI ? 'Found' : 'Not found');

if (!MONGODB_URI) {
    logger.error('No MongoDB URI provided in environment variables');
    process.exit(1);
}

export async function connectDB() {
    try {
        logger.info('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        logger.info('Connected to MongoDB successfully');
    } catch (error) {
        logger.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
}

export async function disconnectDB() {
    try {
        await mongoose.disconnect();
        logger.info('Disconnected from MongoDB');
    } catch (error) {
        logger.error('Error disconnecting from MongoDB:', error);
    }
}
