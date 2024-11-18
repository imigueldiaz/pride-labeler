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
let isConnecting = false;

/**
 * Conecta a MongoDB usando la URI proporcionada en las variables de entorno
 */
export async function connectDB(): Promise<void> {
    // Evitar múltiples conexiones simultáneas
    if (isConnecting) {
        logger.info('Connection attempt already in progress, waiting...');
        return;
    }

    // Si ya hay una conexión activa y está lista, usarla
    if (connection?.connection?.readyState === 1) {
        logger.info('MongoDB is already connected and ready');
        return;
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
            serverSelectionTimeoutMS: 10000, // 10 segundos de timeout
            socketTimeoutMS: 45000, // 45 segundos de timeout
            connectTimeoutMS: 10000, // 10 segundos de timeout para la conexión inicial
            heartbeatFrequencyMS: 30000, // Latido cada 30 segundos
        } as mongoose.ConnectOptions;

        logger.info('Connecting to MongoDB with options:', JSON.stringify(options));
        
        // Limpiar conexión existente si la hay
        if (connection) {
            try {
                await connection.connection.close();
                connection = null;
            } catch (closeError) {
                logger.warn('Error closing existing connection:', closeError);
            }
        }

        // Intentar conectar
        connection = await mongoose.connect(MONGODB_URI, options);
        
        // Verificar el estado de la conexión
        if (connection.connection.readyState !== 1) {
            throw new Error(`MongoDB connection is not ready. State: ${connection.connection.readyState}`);
        }

        logger.info('Successfully connected to MongoDB');
        
        // Verificar que podemos acceder a la base de datos
        const db = connection.connection.db;
        if (!db) {
            throw new Error('Database connection is undefined');
        }

        // Verificar que podemos ejecutar operaciones básicas
        const collections = await db.listCollections().toArray();
        logger.info('Successfully accessed database. Available collections:', 
            collections.map(c => c.name).join(', '));

        // Configurar event listeners para la conexión
        connection.connection.on('error', (err) => {
            logger.error('MongoDB connection error:', err);
        });

        connection.connection.on('disconnected', () => {
            logger.warn('MongoDB disconnected');
        });

        connection.connection.on('reconnected', () => {
            logger.info('MongoDB reconnected');
        });
        
    } catch (error) {
        logger.error('Error connecting to MongoDB:', error instanceof Error ? error.stack : error);
        if (error instanceof Error) {
            logger.error('Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack,
                cause: error.cause
            });
        }
        // Limpiar la conexión si hubo un error
        if (connection) {
            try {
                await connection.connection.close();
            } catch (closeError) {
                logger.warn('Error closing failed connection:', closeError);
            }
            connection = null;
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
        if (connection) {
            await connection.connection.close();
            connection = null;
            logger.info('MongoDB connection closed');
        }
    } catch (error) {
        logger.error('Error closing MongoDB connection:', error instanceof Error ? error.stack : error);
        throw error;
    }
}
