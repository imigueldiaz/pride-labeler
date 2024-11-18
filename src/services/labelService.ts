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
    sig: Record<string, never>;  // {} tipo vacío
}

// Documento MongoDB que extiende los campos AT
interface MongoLabel extends ATLabel {
    _id: string;
    id: number;
}

// Contador para IDs secuenciales
interface Counter {
    _id: string;
    seq: number;
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
    private async getNextId(db: mongoose.mongo.Db): Promise<number> {
        const countersCollection = db.collection<Counter>('counters');
        
        // Primero intentamos obtener el contador actual
        const current = await countersCollection.findOne({ _id: 'labelId' as any });
        
        if (current) {
            // Si existe, incrementamos y devolvemos
            const result = await countersCollection.findOneAndUpdate(
                { _id: 'labelId' as any },
                { $inc: { seq: 1 } },
                { returnDocument: 'after' }
            );
            return result?.seq || current.seq + 1;
        }

        // Si no existe, creamos uno nuevo
        await countersCollection.insertOne({
            _id: 'labelId' as any,
            seq: 1
        });

        return 1;
    }

    private async ensureIndexes(db: mongoose.mongo.Db): Promise<void> {
        const collection = db.collection('labels');
        await collection.createIndex(
            { uri: 1, val: 1, neg: 1 },
            { unique: true }
        );
        logger.info('Ensured unique index on {uri, val, neg}');
    }

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

            await this.ensureIndexes(db);
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
                        _id: {
                            val: '$val',
                            uri: '$uri'
                        },
                        val: { $first: '$val' },
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

            // Extraer las etiquetas únicas (no negadas)
            const labels = new Set(
                result
                    .filter(doc => !doc.neg)
                    .map(doc => doc.val)
                    .filter(Boolean)
            );
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

            // Obtener documentos únicos por {uri, val, neg}
            const pipeline = [
                { $sort: { cts: -1 } },
                {
                    $group: {
                        _id: {
                            uri: '$uri',
                            val: '$val',
                            neg: '$neg'
                        },
                        doc: { $first: '$$ROOT' }
                    }
                },
                { $replaceRoot: { newRoot: '$doc' } },
                { $sort: { id: 1 } }
            ];

            const documents = await collection.aggregate(pipeline).toArray();

            // Convertir los documentos al tipo MongoLabel
            const result = documents.map(doc => ({
                _id: doc._id.toString(),
                id: doc.id,
                src: doc.src,
                uri: doc.uri,
                val: doc.val,
                neg: doc.neg,
                cts: new Date(doc.cts),
                sig: {} // Siempre retornar un objeto vacío
            })) as MongoLabel[];

            logger.info(`Retrieved ${result.length} unique labels with metadata`);
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

            // Crear documentos AT con objeto vacío para sig
            const atLabels: ATLabel[] = labels.map(label => ({
                src: 'did:plc:6mjpba7ftd6yljjgvhwgj46p',
                uri,
                val: label,
                neg: negated,
                cts: new Date(),
                sig: {}
            }));

            try {
                // Crear documentos MongoDB con IDs únicos
                const documents = await Promise.all(
                    atLabels.map(async (atLabel) => ({
                        id: await this.getNextId(db),
                        ...atLabel
                    }))
                );

                // Usar updateOne con upsert para evitar duplicados
                for (const doc of documents) {
                    await collection.updateOne(
                        { uri: doc.uri, val: doc.val, neg: doc.neg },
                        { $set: doc },
                        { upsert: true }
                    );
                }
                logger.info(`Successfully processed ${documents.length} documents`);

            } catch (error) {
                logger.error('Error processing labels:', error instanceof Error ? error.stack : error);
                throw error;
            }
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
