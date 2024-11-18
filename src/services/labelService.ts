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
            await connectDB();
            this.client = new MongoClient(process.env.MONGODB_URI || '');
            await this.client.connect();
            logger.info('MongoDB client initialized');
        } catch (error) {
            logger.error('Error initializing MongoDB client:', error);
            throw error;
        }
    }

    private async getClient(): Promise<MongoClient> {
        if (!this.client) {
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
            const client = await this.getClient();
            const db = client.db('test');
            const collection = db.collection('labels');

            // Pipeline base
            const pipeline: any[] = [
                { $sort: { createdAt: -1 } }
            ];

            // Si se proporciona URI, filtrar por ella
            if (uri) {
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

            const result = await collection.aggregate(pipeline).toArray();
            const labels = new Set(result.map(doc => doc._id));
            logger.info(`Retrieved ${labels.size} labels${uri ? ` for URI: ${uri}` : ''}`);
            return labels;
        } catch (error) {
            logger.error('Error getting current labels:', error);
            throw error;
        }
    }
}
