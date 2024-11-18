import { LabelerServer } from '@skyware/labeler';
import { LabelService } from '../services/labelService.js';
import logger from '../logger.js';
import { FastifyReply, FastifyRequest } from 'fastify';

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

// Tipos basados en la implementación de @skyware/labeler
interface SavedLabel {
    src: string;
    uri: string;
    cid?: string;
    val: string;
    cts: string;
    exp?: string;
    sig: Uint8Array;
}

// Tipos para las etiquetas de la API de Bluesky
interface Label {
    src: string;
    uri: string;
    val: string;
    cts: string;
    neg?: boolean;
}

/**
 * Implementación del servidor de etiquetas que usa MongoDB para almacenamiento.
 * Esta clase extiende el LabelerServer base pero reemplaza el almacenamiento SQLite
 * con MongoDB para mejorar la escalabilidad y persistencia de datos.
 */
export class MongoDBLabelerServer extends LabelerServer {
    private labelService: LabelService;

    constructor(options: { did: string; signingKey: string }) {
        super(options);
        this.labelService = new LabelService();

        // Deshabilitar SQLite estableciendo db como un objeto vacío
        (this as any).db = {};

        // Sobrescribir los endpoints principales
        this.app.get('/xrpc/com.atproto.label.queryLabels', this.handleQueryLabels.bind(this));
        this.app.post('/xrpc/com.atproto.label.createLabels', this.handleCreateLabels.bind(this));
    }

    private async handleQueryLabels(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { uri } = request.query as QueryLabelsParams;
            
            if (!uri) {
                return reply.code(400).send({ error: 'URI parameter is required' });
            }

            const labels = await this.labelService.getCurrentLabels(uri);
            const labelObjects = Array.from(labels).map(val => ({
                src: this.did,
                uri: uri,
                val: val,
                cts: new Date().toISOString()
            })) as Label[];

            return reply.send({
                cursor: '0',
                labels: labelObjects
            });
        } catch (error) {
            logger.error('Error querying labels:', error);
            return reply.code(500).send({ error: 'Internal server error' });
        }
    }

    private async handleCreateLabels(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { uri, create, negate } = request.body as CreateLabelsParams;

            if (!uri) {
                return reply.code(400).send({ error: 'URI parameter is required' });
            }

            // Procesar etiquetas a negar primero
            if (negate?.length) {
                await this.labelService.createNegationDocuments(uri, new Set(negate));
            }

            // Luego procesar etiquetas a crear
            if (create?.length) {
                await this.labelService.createLabelDocuments(uri, new Set(create));
            }

            // Obtener las etiquetas actuales
            const currentLabels = await this.labelService.getCurrentLabels(uri);
            const savedLabels = Array.from(currentLabels).map(val => ({
                src: this.did,
                uri: uri,
                val: val,
                cts: new Date().toISOString(),
                sig: new Uint8Array() // Firma vacía ya que no la necesitamos para MongoDB
            })) as SavedLabel[];

            return reply.send({
                labels: savedLabels
            });
        } catch (error) {
            logger.error('Error creating labels:', error);
            return reply.code(500).send({ error: 'Internal server error' });
        }
    }
}
