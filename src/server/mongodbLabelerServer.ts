import { LabelerServer } from '@skyware/labeler';
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
    private labelCounter: number = 0;
    private pendingLabels: Map<string, Promise<ComAtprotoLabelDefs.Label[]>> = new Map();

    constructor(options: { did: string; signingKey: string }) {
        super(options);
        this.labelService = new LabelService();

        // Deshabilitar SQLite estableciendo db como un objeto vacío
        (this as any).db = {};

        // Sobrescribir los métodos del servidor base
        this.queryLabelsHandler = this.handleQueryLabels.bind(this);
    }

    /**
     * Sobrescribe el método queryLabelsHandler del servidor base.
     * Este método es llamado cuando se hace una petición GET a /xrpc/com.atproto.label.queryLabels
     */
    private async handleQueryLabels(request: FastifyRequest): Promise<{ cursor: string; labels: ComAtprotoLabelDefs.Label[] }> {
        try {
            const { uri } = request.query as QueryLabelsParams;
            const labels = await this.labelService.getCurrentLabels(uri);
            const labelObjects = Array.from(labels).map(val => ({
                src: this.did as `did:${string}`,
                uri: uri || '*',
                val: val,
                cts: new Date().toISOString()
            }));

            return {
                cursor: '0',
                labels: labelObjects
            };
        } catch (error) {
            logger.error('Error querying labels:', error);
            throw error;
        }
    }

    /**
     * Sobrescribe el método createLabels del servidor base.
     * Este método es llamado cuando se hace una petición POST a /xrpc/com.atproto.label.createLabels
     * 
     * Para mantener la compatibilidad con el servidor base, que espera un array síncrono,
     * guardamos la promesa en un Map y devolvemos un array vacío. La promesa se resolverá
     * más tarde y los resultados estarán disponibles a través de queryLabels.
     */
    override createLabels(subject: { uri: string; cid?: string }, labels: { create?: string[]; negate?: string[] }): { src: `did:${string}`; uri: string; cid?: string; val: string; cts: string; neg?: boolean; sig: ArrayBuffer; id: number }[] {
        const { uri } = subject;

        // Crear una promesa para procesar las etiquetas
        const promise = this.processLabels(subject, labels);
        
        // Guardar la promesa para su resolución posterior
        this.pendingLabels.set(uri, promise);

        // Devolver un array vacío ya que los resultados estarán disponibles a través de queryLabels
        return [];
    }

    /**
     * Procesa las etiquetas de forma asíncrona.
     * @param subject El sujeto de las etiquetas
     * @param labels Las etiquetas a procesar
     */
    private async processLabels(subject: { uri: string; cid?: string }, labels: { create?: string[]; negate?: string[] }): Promise<ComAtprotoLabelDefs.Label[]> {
        try {
            const { uri } = subject;
            const { create, negate } = labels;

            if (!uri) {
                throw new Error('URI parameter is required');
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
            
            // Convertir las etiquetas a Label con todos los campos requeridos
            return Array.from(currentLabels).map(val => ({
                src: this.did as `did:${string}`,
                uri: uri,
                cid: subject.cid,
                val: val,
                cts: new Date().toISOString(),
                neg: false,
                sig: new Uint8Array()
            }));
        } catch (error) {
            logger.error('Error processing labels:', error);
            throw error;
        }
    }
}
