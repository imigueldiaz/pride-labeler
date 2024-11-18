import { MongoClient } from 'mongodb';
import { connectDB } from '../db/connection.js';
import logger from '../logger.js';

export class LabelService {
    private client: MongoClient | null = null;

    constructor() {
        this.initializeClient();
    }

    private async initializeClient(): Promise<void> {
        try {
            logger.info('Initializing MongoDB client...');
            await connectDB();
            logger.info('ConnectDB completed, creating new MongoClient...');
            this.client = new MongoClient(process.env.MONGODB_URI || '');
            logger.info(`Connecting to MongoDB with URI: ${process.env.MONGODB_URI}`);
            await this.client.connect();
            logger.info('MongoDB client initialized and connected successfully');
        } catch (error) {
            logger.error('Error initializing MongoDB client:', error);
            throw error;
        }
    }

    /**
     * Obtiene el cliente de MongoDB, creando uno nuevo si es necesario
     */
    private async getClient(): Promise<MongoClient> {
        try {
            // Si ya tenemos un cliente conectado, verificar que funciona
            if (this.client) {
                try {
                    await this.client.db('admin').command({ ping: 1 });
                    logger.info('Using existing MongoDB client connection');
                    return this.client;
                } catch (pingError) {
                    logger.warn('Existing client connection is not responsive, will create new connection:', pingError);
                    await this.client.close().catch(err => logger.warn('Error closing unresponsive client:', err));
                    this.client = null;
                }
            }

            // Intentar conectar usando la conexión global de mongoose
            await connectDB();
            const MONGODB_URI = process.env.MONGODB_URI;
            if (!MONGODB_URI) {
                throw new Error('MONGODB_URI environment variable is not defined');
            }

            logger.info('Creating new MongoDB client...');
            this.client = new MongoClient(MONGODB_URI, {
                serverSelectionTimeoutMS: 10000,
                socketTimeoutMS: 45000,
                connectTimeoutMS: 10000,
                heartbeatFrequencyMS: 30000,
            });

            await this.client.connect();
            // Verificar que la conexión funciona
            await this.client.db('admin').command({ ping: 1 });
            logger.info('Successfully created and connected MongoDB client');
            return this.client;
        } catch (error) {
            logger.error('Error getting MongoDB client:', error instanceof Error ? error.stack : error);
            if (this.client) {
                await this.client.close().catch(err => logger.warn('Error closing failed client:', err));
                this.client = null;
            }
            throw error;
        }
    }

    /**
     * Crea documentos de etiquetas en MongoDB
     */
    async createLabelDocuments(
        uri: string,
        labels: string[],
        negated: boolean = false
    ): Promise<void> {
        try {
            logger.info(`Creating label documents for URI: ${uri}`);
            logger.info('Labels:', labels);
            logger.info('Negated:', negated);

            const client = await this.getClient();
            const db = client.db('test');
            const collection = db.collection('labels');

            const documents = labels.map(label => ({
                uri,
                label,
                negated,
                createdAt: new Date(),
                val: "0.5" // Valor por defecto para la confianza
            }));

            logger.info('Documents to insert:', JSON.stringify(documents, null, 2));

            const result = await collection.insertMany(documents);
            logger.info(`Successfully inserted ${result.insertedCount} documents`);

            // Verificar los documentos insertados
            const inserted = await collection.find({
                _id: { $in: Object.values(result.insertedIds) }
            }).toArray();
            logger.info('Inserted documents:', JSON.stringify(inserted, null, 2));

        } catch (error) {
            logger.error('Error creating label documents:', error instanceof Error ? error.stack : error);
            throw error;
        }
    }

    /**
     * Crea documentos de negación de etiquetas en MongoDB
     * @param uri URI del post
     * @param labels Conjunto de etiquetas a negar
     */
    async createNegationDocuments(uri: string, labels: Set<string>): Promise<void> {
        try {
            const client = await this.getClient();
            const db = client.db('test');
            const collection = db.collection('labels');

            const documents = Array.from(labels).map(label => ({
                uri,
                label,
                negated: true,
                createdAt: new Date()
            }));

            await collection.insertMany(documents);
            logger.info(`Created ${documents.length} negation documents for URI: ${uri}`);
        } catch (error) {
            logger.error('Error creating negation documents:', error);
            throw error;
        }
    }

    /**
     * Obtiene las etiquetas actuales para un URI opcional
     * @param uri URI del post (opcional)
     * @returns Conjunto de etiquetas
     */
    async getCurrentLabels(uri?: string): Promise<Set<string>> {
        try {
            logger.info(`Getting current labels${uri ? ` for URI: ${uri}` : ''}`);
            const client = await this.getClient();
            logger.info('Got MongoDB client, getting database...');
            const db = client.db('test'); // Asegurarnos de que estamos usando la base de datos correcta
            logger.info('Got database, getting collection...');
            const collection = db.collection('labels');
            logger.info('Got collection, preparing pipeline...');

            // Pipeline base
            const pipeline: any[] = [
                { $sort: { createdAt: -1 } }
            ];

            // Si se proporciona URI, filtrar por ella
            if (uri) {
                logger.info(`Adding URI filter to pipeline: ${uri}`);
                pipeline.unshift({ $match: { uri } });
            }

            pipeline.push(
                {
                    $group: {
                        _id: '$label',
                        negated: { $first: '$negated' },
                        createdAt: { $first: '$createdAt' }
                    }
                },
                {
                    $match: {
                        negated: { $ne: true } // Solo incluir etiquetas no negadas
                    }
                },
                {
                    $sort: { createdAt: -1 }
                }
            );

            logger.info('Executing aggregation pipeline:', JSON.stringify(pipeline, null, 2));
            
            // Primero verificar si hay documentos en la colección
            const count = await collection.countDocuments();
            logger.info(`Total documents in collection: ${count}`);

            const result = await collection.aggregate(pipeline).toArray();
            logger.info('Raw aggregation results:', JSON.stringify(result, null, 2));
            
            const labels = new Set(result.map(doc => doc._id));
            logger.info(`Retrieved ${labels.size} labels${uri ? ` for URI: ${uri}` : ''}`);
            logger.info('Labels:', Array.from(labels));
            return labels;
        } catch (error) {
            logger.error('Error getting current labels:', error instanceof Error ? error.stack : error);
            throw error;
        }
    }
}
