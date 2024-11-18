import logger from '../logger.js';
import mongoose from 'mongoose';
import { connectDB } from '../db/connection.js';
import { Document, WithId, ObjectId } from 'mongodb';

// Campos del protocolo AT
interface ATLabel {
    src: string;
    uri: string;
    val: string;
    neg: boolean;
    cts: Date;
    sig: Buffer;
}

// Documento MongoDB que extiende los campos AT
interface MongoLabel extends ATLabel {
    _id: string;
    id: number;
}

// Documento pendiente para reintentos
interface PendingLabel {
    _id?: ObjectId;
    atLabel: ATLabel;
    retryCount: number;
    lastRetry?: Date;
}

type MongoPipeline = {
    $match?: { [key: string]: any };
    $sort?: { [key: string]: number };
    $group?: {
        _id: any;
        [key: string]: any;
    };
    $project?: { [key: string]: any };
    $limit?: number;
}[];

const MAX_RETRY_COUNT = 3;
const RETRY_DELAY_MS = 5000;

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

            // Preparar el pipeline de agregación
            const pipeline: MongoPipeline = [
                { $sort: { cts: -1 } },
                {
                    $group: {
                        _id: '$val',
                        uri: { $first: '$uri' },
                        src: { $first: '$src' },
                        neg: { $first: '$neg' },
                        cts: { $first: '$cts' },
                        sig: { $first: '$sig' },
                        id: { $first: '$id' }
                    }
                }
            ];

            // Si hay URI, filtrar por ella
            if (uri) {
                pipeline.unshift({ $match: { uri } });
            }

            logger.info('Executing aggregation pipeline:', JSON.stringify(pipeline, null, 2));
            const result = await collection.aggregate<MongoLabel>(pipeline).toArray();
            logger.info('Raw aggregation results:', JSON.stringify(result, null, 2));

            // Extraer las etiquetas únicas
            const labels = new Set(result.map(doc => doc._id).filter(Boolean));
            logger.info(`Retrieved ${labels.size} unique labels${uri ? ` for URI: ${uri}` : ''}`);
            logger.info('Labels:', Array.from(labels));

            return labels;
        } catch (error) {
            logger.error('Error getting current labels:', error instanceof Error ? error.stack : error);
            throw error;
        }
    }

    async getAllLabelsWithMetadata(): Promise<MongoLabel[]> {
        try {
            logger.info('Getting all labels with metadata');
            const db = await this.getDatabase();
            const collection = db.collection('labels');

            // Obtener todos los documentos ordenados por fecha de creación
            const documents = await collection
                .find({})
                .sort({ cts: -1 })
                .toArray();

            // Convertir los documentos al tipo MongoLabel
            const result = documents.map(doc => ({
                _id: doc._id.toString(),
                id: doc.id,
                src: doc.src,
                uri: doc.uri,
                val: doc.val,
                neg: doc.neg,
                cts: new Date(doc.cts),
                sig: doc.sig
            })) as MongoLabel[];

            logger.info(`Retrieved ${result.length} labels with metadata`);
            logger.info('Labels with metadata:', JSON.stringify(result, null, 2));

            return result;
        } catch (error) {
            logger.error('Error getting labels with metadata:', error instanceof Error ? error.stack : error);
            throw error;
        }
    }

    async createLabelDocuments(uri: string, labels: string[], negated: boolean = false): Promise<void> {
        try {
            logger.info(`Creating ${negated ? 'negated ' : ''}label documents for URI: ${uri}`);
            logger.info('Labels:', labels);

            const db = await this.getDatabase();
            const collection = db.collection('labels');
            const pendingCollection = db.collection('pending_labels');

            // Crear documentos AT
            const atLabels: ATLabel[] = labels.map(label => ({
                src: 'did:plc:6mjpba7ftd6yljjgvhwgj46p',
                uri,
                val: label,
                neg: negated,
                cts: new Date(),
                sig: Buffer.from([])
            }));

            // Crear documentos pendientes
            const pendingLabels: PendingLabel[] = atLabels.map(atLabel => ({
                atLabel,
                retryCount: 0
            }));

            // Guardar en la colección de pendientes
            const pendingResult = await pendingCollection.insertMany(pendingLabels);
            const pendingIds = Object.values(pendingResult.insertedIds);
            logger.info('Saved to pending collection:', JSON.stringify(pendingLabels, null, 2));

            try {
                // Crear documentos MongoDB
                const documents = atLabels.map((atLabel, index) => ({
                    id: index,
                    ...atLabel
                }));

                logger.info('Inserting documents:', JSON.stringify(documents, null, 2));
                const result = await collection.insertMany(documents);
                logger.info(`Successfully inserted ${result.insertedCount} documents`);

                // Eliminar de pendientes
                await pendingCollection.deleteMany({ _id: { $in: pendingIds } });
                logger.info('Documents removed from pending');

            } catch (error) {
                logger.error('Error processing labels, will retry later:', error instanceof Error ? error.stack : error);
                // Los documentos pendientes permanecen para retry posterior
            }
        } catch (error) {
            logger.error('Error creating label documents:', error instanceof Error ? error.stack : error);
            throw error;
        }
    }

    async processPendingLabels(): Promise<void> {
        try {
            const db = await this.getDatabase();
            const pendingCollection = db.collection('pending_labels');
            const labelsCollection = db.collection('labels');

            const pendingLabels = await pendingCollection
                .find({ retryCount: { $lt: MAX_RETRY_COUNT } })
                .toArray();

            for (const pending of pendingLabels) {
                try {
                    logger.info('Processing pending label:', JSON.stringify(pending, null, 2));

                    const document = {
                        id: 0, // Se asignará un nuevo ID
                        ...pending.atLabel
                    };

                    await labelsCollection.insertOne(document);
                    await pendingCollection.deleteOne({ _id: pending._id });
                    logger.info('Successfully processed pending label');

                } catch (error) {
                    logger.error('Error processing pending label:', error instanceof Error ? error.stack : error);
                    await pendingCollection.updateOne(
                        { _id: pending._id },
                        { 
                            $inc: { retryCount: 1 },
                            $set: { lastRetry: new Date() }
                        }
                    );
                }

                // Esperar antes de procesar el siguiente
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
            }
        } catch (error) {
            logger.error('Error processing pending labels:', error instanceof Error ? error.stack : error);
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
