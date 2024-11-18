import { LabelerServer, SavedLabel } from '@skyware/labeler';
import { LabelService } from '../services/labelService.js';
import logger from '../logger.js';
import { FastifyRequest } from 'fastify';
import { ComAtprotoLabelDefs } from '@atproto/api';

interface QueryLabelsParams {
    uri?: string;
    cursor?: string;
    limit?: number;
}

interface CreateLabelsParams {
    uri: string;
    create?: string[];
    negate?: string[];
}

/**
 * Implementación del servidor de etiquetas que usa MongoDB para almacenamiento.
 * Esta clase extiende el LabelerServer base pero reemplaza el almacenamiento SQLite
 * con MongoDB para mejorar la escalabilidad y persistencia de datos.
 */
export class MongoDBLabelerServer extends LabelerServer {
    private labelService: LabelService;
    private pendingLabels: Map<string, Promise<SavedLabel[]>> = new Map();

    constructor(options: { did: string; signingKey: string }) {
        super(options);
        this.labelService = new LabelService();

        // Deshabilitar SQLite estableciendo db como un objeto vacío
        (this as any).db = {};

        // Sobrescribir el handler de queryLabels
        this.queryLabelsHandler = this.handleQueryLabels.bind(this);
    }

    /**
     * Maneja las peticiones GET a /xrpc/com.atproto.label.queryLabels
     */
    private async handleQueryLabels(request: FastifyRequest): Promise<{ cursor: string; labels: ComAtprotoLabelDefs.Label[] }> {
        try {
            const { uri } = request.query as { uri?: string };
            logger.info(`Handling queryLabels request${uri ? ` for URI: ${uri}` : ''}`);

            // Verificar la conexión antes de proceder
            const client = await this.labelService.getClient();
            logger.info('Got MongoDB client, verifying connection...');
            await client.db('admin').command({ ping: 1 });
            logger.info('MongoDB connection verified');

            // Obtener las etiquetas actuales
            logger.info('Fetching current labels...');
            const currentLabels = await this.labelService.getCurrentLabels(uri);
            logger.info('Current labels:', Array.from(currentLabels));

            // Convertir las etiquetas al formato requerido
            logger.info('Converting labels to AT Protocol format...');
            const labels: ComAtprotoLabelDefs.Label[] = Array.from(currentLabels).map(label => ({
                src: this.did,
                uri: uri || '',
                val: label,
                neg: false,
                cts: new Date().toISOString(),
                exp: undefined,
            }));

            logger.info('Transformed labels:', JSON.stringify(labels, null, 2));

            const response = {
                cursor: new Date().getTime().toString(),
                labels,
            };
            logger.info('Sending response:', JSON.stringify(response, null, 2));
            return response;
        } catch (error) {
            logger.error('Error handling queryLabels:', error instanceof Error ? error.stack : error);
            throw error;
        }
    }

    /**
     * Crea etiquetas para un URI dado
     */
    override createLabels(
        subject: { uri: string; cid?: string },
        labels: { create?: string[]; negate?: string[] }
    ): SavedLabel[] {
        const { uri } = subject;
        const { create = [], negate = [] } = labels;

        // Convertir las etiquetas al formato SavedLabel
        const labelObjects: SavedLabel[] = [
            ...create.map((val, index) => ({
                src: this.did as `did:${string}`,
                uri,
                cid: subject.cid,
                val,
                neg: false,
                cts: new Date().toISOString(),
                sig: new Uint8Array(),
                id: index
            })),
            ...negate.map((val, index) => ({
                src: this.did as `did:${string}`,
                uri,
                cid: subject.cid,
                val,
                neg: true,
                cts: new Date().toISOString(),
                sig: new Uint8Array(),
                id: create.length + index
            }))
        ];

        // Crear una promesa para procesar las etiquetas
        const promise = this.processLabels(labelObjects, uri);
        
        // Guardar la promesa para su resolución posterior
        this.pendingLabels.set(uri, promise);

        // Devolver las etiquetas creadas
        return labelObjects;
    }

    /**
     * Procesa las etiquetas recibidas
     */
    protected async processLabels(
        labels: SavedLabel[],
        uri: string
    ): Promise<SavedLabel[]> {
        try {
            logger.info(`Processing labels for URI: ${uri}`);
            logger.info('Labels received:', JSON.stringify(labels, null, 2));

            // Agrupar etiquetas por negadas y no negadas
            const negatedLabels = new Set<string>();
            const nonNegatedLabels = new Set<string>();

            labels.forEach(label => {
                if (label.neg) {
                    negatedLabels.add(label.val);
                } else {
                    nonNegatedLabels.add(label.val);
                }
            });

            logger.info('Negated labels:', Array.from(negatedLabels));
            logger.info('Non-negated labels:', Array.from(nonNegatedLabels));

            // Procesar etiquetas negadas
            if (negatedLabels.size > 0) {
                await this.labelService.createLabelDocuments(
                    uri,
                    Array.from(negatedLabels),
                    true // negated = true
                );
            }

            // Procesar etiquetas no negadas
            if (nonNegatedLabels.size > 0) {
                await this.labelService.createLabelDocuments(
                    uri,
                    Array.from(nonNegatedLabels),
                    false // negated = false
                );
            }

            logger.info('Successfully processed all labels');
            return labels; // Devolver las etiquetas procesadas
        } catch (error) {
            logger.error('Error processing labels:', error instanceof Error ? error.stack : error);
            throw error;
        }
    }

    /**
     * Crea etiquetas para un post
     */
    private async handleCreateLabels(labels: Set<string>, uri: string): Promise<void> {
        try {
            logger.info(`Creating labels for URI: ${uri}`);
            logger.info('Labels:', Array.from(labels));

            // Convertir Set a Array antes de pasar a createLabelDocuments
            await this.labelService.createLabelDocuments(uri, Array.from(labels));
        } catch (error) {
            logger.error('Error creating labels:', error instanceof Error ? error.stack : error);
            throw error;
        }
    }
}
