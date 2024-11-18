import { LabelerServer, SavedLabel } from '@skyware/labeler';
import { LabelService } from '../services/labelService.js';
import { FastifyRequest } from 'fastify';
import logger from '../logger.js';
import { LABELS } from '../constants.js';

/**
 * Servidor de etiquetas que utiliza MongoDB como almacenamiento.
 * Esta clase extiende el LabelerServer base pero reemplaza el almacenamiento SQLite
 * con MongoDB para mejorar la escalabilidad y persistencia de datos.
 */
export class MongoDBLabelerServer extends LabelerServer {
    private labelService: LabelService;
    private pendingLabels: Map<string, Promise<SavedLabel[]>> = new Map();
    private retryInterval: NodeJS.Timeout | null = null;
    private labelMap: Map<string, string>;

    constructor(options: { did: string; signingKey: string }) {
        super(options);
        this.labelService = new LabelService();
        this.labelMap = new Map();

        // Construir el mapa de etiquetas desde los locales
        LABELS.forEach(label => {
            // Añadir el identificador en inglés
            this.labelMap.set(label.identifier.toLowerCase(), label.identifier);

            // Añadir todas las variantes de idioma
            label.locales.forEach(locale => {
                const name = locale.name.split(' ')[0].toLowerCase(); // Tomar solo el nombre sin emojis
                this.labelMap.set(name, label.identifier);
            });
        });

        // Deshabilitar SQLite estableciendo db como un objeto vacío
        (this as any).db = {};

        // Sobrescribir el handler de queryLabels
        this.queryLabelsHandler = this.handleQueryLabels.bind(this);

        // Iniciar el procesamiento de etiquetas pendientes
        this.startPendingLabelsProcessor();

        logger.info('MongoDBLabelerServer initialized with label map:', Object.fromEntries(this.labelMap));
    }

    /**
     * Inicia el procesador de etiquetas pendientes
     */
    private startPendingLabelsProcessor(): void {
        if (this.retryInterval) {
            clearInterval(this.retryInterval);
        }

        this.retryInterval = setInterval(async () => {
            try {
                await this.labelService.processPendingLabels();
            } catch (error) {
                logger.error('Error processing pending labels:', error instanceof Error ? error.stack : error);
            }
        }, 30000); // Procesar cada 30 segundos
    }

    /**
     * Detiene el procesador de etiquetas pendientes
     */
    private stopPendingLabelsProcessor(): void {
        if (this.retryInterval) {
            clearInterval(this.retryInterval);
            this.retryInterval = null;
        }
    }

    /**
     * Procesa el texto del post para encontrar etiquetas
     */
    private findLabelsInText(text: string): string[] {
        const labels = new Set<string>();
        const words = text.toLowerCase().split(/\s+/);
        
        // Buscar palabras individuales
        for (const word of words) {
            const label = this.labelMap.get(word);
            if (label) {
                labels.add(label);
            }
        }

        // Buscar frases de dos palabras
        for (let i = 0; i < words.length - 1; i++) {
            const phrase = `${words[i]} ${words[i + 1]}`;
            const label = this.labelMap.get(phrase);
            if (label) {
                labels.add(label);
            }
        }

        return Array.from(labels);
    }

    /**
     * Crea etiquetas para un URI dado
     */
    override createLabels(
        subject: { uri: string; cid?: string; text?: string },
        labels: { create?: string[]; negate?: string[] }
    ): SavedLabel[] {
        const { uri, text } = subject;
        let { create = [], negate = [] } = labels;

        // Si hay texto, buscar etiquetas en él
        if (text) {
            const foundLabels = this.findLabelsInText(text);
            create = [...new Set([...create, ...foundLabels])];
        }

        logger.info(`Creating labels for URI: ${uri}`);
        logger.info('Create labels:', create);
        logger.info('Negate labels:', negate);

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

        logger.info('Created label objects:', JSON.stringify(labelObjects, null, 2));

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
                await this.labelService.createNegationDocuments(uri, negatedLabels);
            }

            // Procesar etiquetas no negadas
            if (nonNegatedLabels.size > 0) {
                await this.labelService.createLabelDocuments(uri, Array.from(nonNegatedLabels));
            }

            logger.info('Successfully processed all labels');
            return labels; // Devolver las etiquetas procesadas
        } catch (error) {
            logger.error('Error processing labels:', error instanceof Error ? error.stack : error);
            throw error;
        }
    }

    /**
     * Maneja la consulta de etiquetas
     */
    private async handleQueryLabels(request: FastifyRequest): Promise<{ cursor: string; labels: SavedLabel[] }> {
        try {
            const { uri } = request.query as { uri?: string };
            logger.info(`Handling queryLabels request${uri ? ` for URI: ${uri}` : ''}`);

            // Obtener todas las etiquetas con metadatos
            const labelsWithMetadata = await this.labelService.getAllLabelsWithMetadata();
            logger.info('Labels with metadata:', JSON.stringify(labelsWithMetadata, null, 2));

            // Convertir al formato SavedLabel
            const labels: SavedLabel[] = labelsWithMetadata.map(label => ({
                src: label.src as `did:${string}`,
                uri: label.uri,
                val: label.val,
                neg: label.neg,
                cts: new Date(label.cts).toISOString(),
                sig: Buffer.isBuffer(label.sig) ? new Uint8Array(label.sig) : new Uint8Array(),
                id: label.id
            }));

            logger.info('Transformed labels:', JSON.stringify(labels, null, 2));

            const response = {
                cursor: new Date().getTime().toString(),
                labels: labels.filter(label => !uri || label.uri === uri),
            };
            logger.info('Sending response:', JSON.stringify(response, null, 2));
            return response;
        } catch (error) {
            logger.error('Error handling queryLabels:', error instanceof Error ? error.stack : error);
            throw error;
        }
    }
}
