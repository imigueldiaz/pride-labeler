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

    private async getClient(): Promise<MongoClient> {
        if (!this.client) {
            logger.info('No MongoDB client exists, initializing...');
            await this.initializeClient();
        }
        if (!this.client) {
            throw new Error('Failed to initialize MongoDB client');
        }
        return this.client;
    }

    /**
     * Crea documentos de etiquetas en MongoDB
     * @param uri URI del post
     * @param labels Conjunto de etiquetas a crear
     */
    async createLabelDocuments(uri: string, labels: Set<string>): Promise<void> {
        try {
            const client = await this.getClient();
            const db = client.db('test');
            const collection = db.collection('labels');

            const documents = Array.from(labels).map(label => ({
                uri,
                label,
                negated: false,
                createdAt: new Date()
            }));

            await collection.insertMany(documents);
            logger.info(`Created ${documents.length} label documents for URI: ${uri}`);
        } catch (error) {
            logger.error('Error creating label documents:', error);
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
            logger.info('Getting current labels...');
            const client = await this.getClient();
            logger.info('Got MongoDB client, getting database...');
            const db = client.db('test');
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

            pipeline.push({
                $group: {
                    _id: '$label',
                    negated: { $first: '$negated' }
                }
            },
            {
                $match: {
                    negated: false // Solo incluir etiquetas no negadas
                }
            });

            logger.info('Executing aggregation pipeline:', JSON.stringify(pipeline, null, 2));
            const result = await collection.aggregate(pipeline).toArray();
            logger.info('Raw aggregation results:', JSON.stringify(result, null, 2));
            
            const labels = new Set(result.map(doc => doc._id));
            logger.info(`Retrieved ${labels.size} labels${uri ? ` for URI: ${uri}` : ''}`);
            logger.info('Labels:', Array.from(labels));
            return labels;
        } catch (error) {
            logger.error('Error getting current labels:', error);
            throw error;
        }
    }
}
