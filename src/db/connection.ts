import mongoose from 'mongoose';
import logger from '../logger.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: join(__dirname, '../..', '.env') });

let isConnecting = false;

/**
 * Conecta a MongoDB usando la URI proporcionada en las variables de entorno
 */
export async function connectDB(): Promise<typeof mongoose> {
    // Evitar múltiples conexiones simultáneas
    if (isConnecting) {
        logger.info('Connection attempt already in progress, waiting...');
        return mongoose;
    }

    // Si ya hay una conexión activa y está lista, usarla
    const readyState = mongoose.connection.readyState as mongoose.ConnectionStates;
    if (readyState === mongoose.ConnectionStates.connected) {
        logger.info('MongoDB is already connected and ready');
        return mongoose;
    }

    try {
        isConnecting = true;
        const MONGODB_URI = process.env.MONGODB_URI;

        if (!MONGODB_URI) {
            throw new Error('MONGODB_URI environment variable is not defined');
        }

        logger.info('Attempting to connect to MongoDB...');
        logger.info(`MongoDB URI: ${MONGODB_URI?.replace(/mongodb\+srv:\/\/([^:]+):[^@]+@/, 'mongodb+srv://$1:***@')}`);

        // Opciones de conexión
        const options = {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 10000,
            heartbeatFrequencyMS: 30000,
        } as mongoose.ConnectOptions;

        logger.info('Connecting to MongoDB with options:', JSON.stringify(options));
        
        // Intentar conectar
        await mongoose.connect(MONGODB_URI, options);
        
        // Verificar el estado de la conexión
        const currentState = mongoose.connection.readyState as mongoose.ConnectionStates;
        if (currentState !== mongoose.ConnectionStates.connected) {
            throw new Error(`MongoDB connection is not ready. State: ${currentState}`);
        }

        logger.info('Successfully connected to MongoDB');
        
        // Verificar que podemos acceder a la base de datos
        const db = mongoose.connection.db;
        if (!db) {
            throw new Error('Database connection is undefined');
        }

        // Verificar que podemos ejecutar operaciones básicas
        const collections = await db.listCollections().toArray();
        logger.info('Successfully accessed database. Available collections:', 
            collections.map(c => c.name).join(', '));

        // Configurar event listeners para la conexión
        mongoose.connection.on('error', (err) => {
            logger.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            logger.warn('MongoDB disconnected');
            isConnecting = false;
        });

        mongoose.connection.on('reconnected', () => {
            logger.info('MongoDB reconnected');
        });

        return mongoose;
    } catch (error) {
        logger.error('Error connecting to MongoDB:', error instanceof Error ? error.stack : error);
        if (error instanceof Error) {
            logger.error('Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
        }
        throw error;
    } finally {
        isConnecting = false;
    }
}

/**
 * Cierra la conexión a MongoDB
 */
export async function disconnectDB(): Promise<void> {
    try {
        await mongoose.disconnect();
        logger.info('MongoDB disconnected');
    } catch (error) {
        logger.error('Error disconnecting from MongoDB:', error);
        throw error;
    }
}
