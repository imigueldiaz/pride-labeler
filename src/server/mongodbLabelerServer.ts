import { LabelerServer, SavedLabel } from '@skyware/labeler';
import { LabelService } from '../services/labelService.js';
import { FastifyRequest } from 'fastify';
import logger from '../logger.js';
import { LABELS } from '../constants.js';

export class MongoDBLabelerServer extends LabelerServer {
    private labelService: LabelService;

    constructor(options: { did: string; signingKey: string }) {
        super(options);
        this.labelService = new LabelService();
        
        // Deshabilitar SQLite estableciendo db como un objeto vacío
        (this as any).db = {};

        // Sobrescribir el handler de queryLabels
        this.queryLabelsHandler = this.handleQueryLabels.bind(this);

        logger.info('MongoDBLabelerServer initialized');
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

        // Si hay límite de etiquetas y se excede, negar las existentes
        if (currentLabels.size >= 0) { // 0 significa sin límite
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

            if (rkey.includes('3lb4xfkaj7w2v')) { // DELETE constant
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
