import logger from '../logger.js';
import mongoose from 'mongoose';
import { connectDB } from '../db/connection.js';

export class LabelService {
    async getDatabase() {
        try {
            logger.info('Getting MongoDB database connection...');
            await connectDB();
            
            if (!mongoose.connection || mongoose.connection.readyState !== 1) {
                throw new Error('Mongoose connection is not ready');
            }

            const db = mongoose.connection.db;
            if (!db) {
                throw new Error('Database connection is undefined');
            }

            // Listar bases de datos y colecciones
            logger.info('Listing databases...');
            const adminDb = db.admin();
            const dbs = await adminDb.listDatabases();
            logger.info('Available databases:', dbs.databases.map(db => `${db.name} (${db.sizeOnDisk} bytes)`));

            const collections = await db.listCollections().toArray();
            logger.info('Collections in database:', collections.map(col => col.name));

            return db;
        } catch (error) {
            logger.error('Error getting MongoDB database:', error instanceof Error ? error.stack : error);
            throw error;
        }
    }

    async getCurrentLabels(uri?: string): Promise<Set<string>> {
        try {
            logger.info(`Getting current labels${uri ? ` for URI: ${uri}` : ''}`);
            const db = await this.getDatabase();
            
            logger.info('Getting labels collection...');
            const collection = db.collection('labels');
            
            // Verificar que podemos acceder a la colección
            const count = await collection.countDocuments();
            logger.info(`Found ${count} documents in labels collection`);

            // Mostrar algunos documentos de ejemplo
            const sampleDocs = await collection.find().limit(3).toArray();
            logger.info('Sample documents:', JSON.stringify(sampleDocs, null, 2));

            logger.info('Preparing aggregation pipeline...');
            const pipeline: any[] = [
                { $sort: { createdAt: -1 } }
            ];

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
                        negated: { $ne: true }
                    }
                },
                {
                    $sort: { createdAt: -1 }
                }
            );

            logger.info('Executing aggregation pipeline:', JSON.stringify(pipeline, null, 2));
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

    async createLabelDocuments(uri: string, labels: string[], negated: boolean = false): Promise<void> {
        try {
            logger.info(`Creating ${negated ? 'negated ' : ''}label documents for URI: ${uri}`);
            logger.info('Labels:', labels);

            const db = await this.getDatabase();
            const collection = db.collection('labels');

            const documents = labels.map(label => ({
                uri,
                label,
                negated,
                createdAt: new Date(),
                val: "0.5" // Valor por defecto para la confianza
            }));

            logger.info('Inserting documents:', JSON.stringify(documents, null, 2));
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

    async createNegationDocuments(uri: string, labels: Set<string>): Promise<void> {
        try {
            logger.info(`Creating negation documents for URI: ${uri}`);
            logger.info('Labels to negate:', Array.from(labels));
            await this.createLabelDocuments(uri, Array.from(labels), true);
        } catch (error) {
            logger.error('Error creating negation documents:', error instanceof Error ? error.stack : error);
            throw error;
        }
    }
}
