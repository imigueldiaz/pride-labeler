import mongoose from 'mongoose';
import logger from '../logger.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: join(__dirname, '../..', '.env') });

let connection: typeof mongoose | null = null;

/**
 * Conecta a MongoDB usando la URI proporcionada en las variables de entorno
 */
export async function connectDB(): Promise<void> {
    try {
        const MONGODB_URI = process.env.MONGODB_URI;
        logger.info('Attempting to connect to MongoDB...');
        logger.info(`MongoDB URI: ${MONGODB_URI?.replace(/mongodb\+srv:\/\/([^:]+):[^@]+@/, 'mongodb+srv://$1:***@')}`);

        if (!MONGODB_URI) {
            throw new Error('MONGODB_URI environment variable is not defined');
        }

        if (connection) {
            logger.info('MongoDB is already connected');
            return;
        }

        // Opciones de conexión recomendadas por MongoDB
        const options = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        } as mongoose.ConnectOptions;

        logger.info('Connecting to MongoDB with options:', JSON.stringify(options));
        connection = await mongoose.connect(MONGODB_URI, options);
        logger.info('Successfully connected to MongoDB');
        
        // Verificar la conexión listando las bases de datos
        const admin = connection.connection.db.admin();
        const dbInfo = await admin.listDatabases();
        logger.info('Available databases:', dbInfo.databases.map(db => db.name));
        
        // Verificar la base de datos actual
        const currentDb = connection.connection.db;
        logger.info('Current database:', currentDb.databaseName);
        
        // Listar colecciones
        const collections = await currentDb.collections();
        logger.info('Available collections:', collections.map(c => c.collectionName));
        
    } catch (error) {
        logger.error('Error connecting to MongoDB:', error);
        throw error;
    }
}

/**
 * Cierra la conexión con MongoDB
 */
export async function disconnectDB(): Promise<void> {
    try {
        if (!connection) {
            logger.info('No MongoDB connection to close');
            return;
        }

        await mongoose.disconnect();
        connection = null;
        logger.info('MongoDB connection closed');
    } catch (error) {
        logger.error('Error disconnecting from MongoDB:', error);
        throw error;
    }
}
