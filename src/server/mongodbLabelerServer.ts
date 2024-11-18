import { LabelerServer, SavedLabel, CreateLabelData } from '@skyware/labeler';
import { LabelService } from '../services/labelService.js';
import { FastifyRequest } from 'fastify';
import logger from '../logger.js';
import { LABELS, LABEL_LIMIT, DELETE } from '../constants.js';

export class MongoDBLabelerServer extends LabelerServer {
    private labelService: LabelService;
    private nextId: number = 0;

    constructor(options: { did: string; signingKey: string }) {
        super(options);
        this.labelService = new LabelService();
        
        // Sobrescribir el handler de queryLabels
        this.queryLabelsHandler = this.handleQueryLabels.bind(this);

        logger.info('MongoDBLabelerServer initialized');
        
        // Inicializar el nextId con el máximo ID actual + 1
        this.initializeNextId().catch(error => {
            logger.error('Error initializing nextId:', error instanceof Error ? error.stack : error);
        });
    }

    /**
     * Inicializa el nextId basado en el máximo ID actual en la base de datos
     */
    private async initializeNextId(): Promise<void> {
        try {
            const labelsWithMetadata = await this.labelService.getAllLabelsWithMetadata();
            const maxId = labelsWithMetadata.reduce((max, label) => Math.max(max, label.id || 0), 0);
            this.nextId = maxId + 1;
            logger.info(`Initialized nextId to ${this.nextId}`);
        } catch (error) {
            logger.error('Error getting max id:', error instanceof Error ? error.stack : error);
            this.nextId = 0;
        }
    }

    /**
     * Obtiene y incrementa el siguiente ID disponible
     */
    private getNextId(): number {
        return this.nextId++;
    }

    /**
     * Sobrescribir el método createLabel para usar MongoDB en lugar de SQLite
     */
    createLabel(label: CreateLabelData): SavedLabel {
        try {
            logger.info(`Creating label: ${JSON.stringify(label)}`);
            
            const savedLabel: SavedLabel = {
                src: this.did,
                uri: label.uri,
                val: label.val,
                neg: label.neg || false,
                cts: new Date().toISOString(),
                sig: new Uint8Array(), // Para la API mantenemos Uint8Array vacío
                id: this.getNextId()
            };

            logger.info(`Saved label: ${JSON.stringify(savedLabel)}`);

            // Crear el documento en MongoDB de forma síncrona
            this.labelService.createLabelDocuments(label.uri, [label.val], label.neg || false)
                .then(() => {
                    logger.info(`Successfully created MongoDB document for label: ${label.val}`);
                })
                .catch(error => {
                    logger.error('Error creating label document:', error instanceof Error ? error.stack : error);
                });

            return savedLabel;
        } catch (error) {
            logger.error('Error creating label:', error instanceof Error ? error.stack : error);
            throw error;
        }
    }

    /**
     * Obtiene las etiquetas actuales para un URI
     */
    private async getCurrentLabels(uri: string): Promise<Set<string>> {
        const labelSet = await this.labelService.getCurrentLabels(uri);
        
        if (labelSet.size > 0) {
            logger.info(`Current labels: ${Array.from(labelSet).join(', ')}`);
        }

        return labelSet;
    }

    /**
     * Elimina todas las etiquetas para un URI
     */
    private async deleteAllLabels(uri: string, labels: Set<string>): Promise<void> {
        const labelsToDelete = Array.from(labels);

        if (labelsToDelete.length === 0) {
            logger.info('No labels to delete');
            return;
        }

        logger.info(`Labels to delete: ${labelsToDelete.join(', ')}`);
        await this.labelService.createNegationDocuments(uri, labels);
        logger.info('Successfully deleted all labels');
    }

    /**
     * Añade o actualiza una etiqueta para un URI
     */
    private async addOrUpdateLabel(uri: string, rkey: string, currentLabels: Set<string>): Promise<void> {
        const newLabel = LABELS.find((label) => label.rkey === rkey);
        if (!newLabel) {
            logger.warn(`New label not found: ${rkey}. Likely liked a post that's not one for labels.`);
            return;
        }
        logger.info(`New label: ${newLabel.identifier}`);

        // Verificar si la etiqueta ya existe (positiva o negativa)
        const labelStatus = await this.labelService.getLabelStatus(uri, newLabel.identifier);
        
        if (labelStatus === 'positive') {
            logger.info(`Positive label ${newLabel.identifier} already exists for ${uri}, updating timestamp...`);
            await this.labelService.updateLabelTimestamp(uri, newLabel.identifier);
            return;
        } else if (labelStatus === 'negative') {
            logger.info(`Found negative label ${newLabel.identifier} for ${uri}, creating positive label...`);
            // Si existe una versión negada, creamos la versión positiva
            await this.labelService.createLabelDocuments(uri, [newLabel.identifier], false);
            return;
        }

        // Si hay límite de etiquetas y se excede, negar las existentes
        if (LABEL_LIMIT > 0 && currentLabels.size >= LABEL_LIMIT) {
            await this.labelService.createNegationDocuments(uri, currentLabels);
            logger.info(`Successfully negated existing labels: ${Array.from(currentLabels).join(', ')}`);
        }

        // Añadir la nueva etiqueta
        await this.labelService.createLabelDocuments(uri, [newLabel.identifier]);
        logger.info(`Successfully labeled ${uri} with ${newLabel.identifier}`);
    }

    /**
     * Procesa una etiqueta
     */
    async label(did: string, rkey: string): Promise<void> {
        logger.info(`Received rkey: ${rkey} for ${did}`);

        if (rkey === 'self') {
            logger.info(`${did} liked the labeler. Returning.`);
            return;
        }

        try {
            const labels = await this.getCurrentLabels(did);

            if (rkey === DELETE) {
                await this.deleteAllLabels(did, labels);
            } else {
                await this.addOrUpdateLabel(did, rkey, labels);
            }
        } catch (error) {
            logger.error('Error in `label` function:', error instanceof Error ? error.stack : error);
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

            // Convertir al formato SavedLabel y asignar IDs secuenciales
            const labels: SavedLabel[] = labelsWithMetadata.map(label => ({
                src: label.src as `did:${string}`,
                uri: label.uri,
                val: label.val,
                neg: label.neg,
                cts: new Date(label.cts).toISOString(),
                sig: new Uint8Array(), // Para la API mantenemos Uint8Array vacío
                id: label.id
            }));

            // Filtrar por URI si se especifica
            const response = {
                cursor: new Date().getTime().toString(),
                labels: labels.filter(label => !uri || label.uri === uri),
            };

            return response;
        } catch (error) {
            logger.error('Error handling queryLabels:', error instanceof Error ? error.stack : error);
            throw error;
        }
    }
}
