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
        
        // Si ya hay una conexión activa, verificar su estado
        if (connection && connection.connection.readyState === 1) {
            logger.info('MongoDB is already connected and ready');
            return;
        }

        if (!MONGODB_URI) {
            throw new Error('MONGODB_URI environment variable is not defined');
        }

        logger.info('Attempting to connect to MongoDB...');
        logger.info(`MongoDB URI: ${MONGODB_URI?.replace(/mongodb\+srv:\/\/([^:]+):[^@]+@/, 'mongodb+srv://$1:***@')}`);

        // Opciones de conexión recomendadas por MongoDB
        const options = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000, // 5 segundos de timeout
            socketTimeoutMS: 45000, // 45 segundos de timeout
        } as mongoose.ConnectOptions;

        logger.info('Connecting to MongoDB with options:', JSON.stringify(options));
        
        // Intentar conectar
        connection = await mongoose.connect(MONGODB_URI, options);
        
        // Verificar que la conexión se estableció correctamente
        if (connection.connection.readyState !== 1) {
            throw new Error(`MongoDB connection is not ready. State: ${connection.connection.readyState}`);
        }

        logger.info('Successfully connected to MongoDB');
        
        // Verificar que podemos acceder a la base de datos
        try {
            const db = connection.connection.db;
            if (!db) {
                throw new Error('Database connection is undefined');
            }

            // Verificar que podemos ejecutar operaciones básicas
            const collections = await db.listCollections().toArray();
            logger.info('Successfully accessed database. Available collections:', 
                collections.map(c => c.name).join(', '));

        } catch (dbError) {
            logger.error('Error accessing database after connection:', dbError);
            throw dbError;
        }
        
    } catch (error) {
        logger.error('Error connecting to MongoDB:', error instanceof Error ? error.stack : error);
        // Limpiar la conexión si hubo un error
        if (connection) {
            await connection.connection.close();
            connection = null;
        }
        throw error;
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
        logger.error('Error closing MongoDB connection:', error);
        throw error;
    }
}
