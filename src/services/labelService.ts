import { Label } from '../models/Label.js';
import logger from '../logger.js';

export class LabelService {
    /**
     * Obtiene las etiquetas actuales para un DID específico
     */
    async getCurrentLabels(did: string): Promise<Set<string>> {
        try {
            const query = await Label.find({ uri: did }).sort({ cts: -1 });
            const labels = new Set<string>();

            for (const label of query) {
                if (label.val) {
                    if (!label.neg) {
                        labels.add(label.val);
                        logger.info(`Added label: ${label.val}`);
                    } else {
                        labels.delete(label.val);
                        logger.info(`Deleted label: ${label.val}`);
                    }
                }
            }

            if (labels.size > 0) {
                logger.info(`Current labels: ${Array.from(labels).join(', ')}`);
            }

            return labels;
        } catch (error) {
            logger.error('Error fetching labels:', error);
            throw error;
        }
    }

    /**
     * Crea documentos de negación para un conjunto de etiquetas
     */
    async createNegationDocuments(did: string, labels: Set<string>): Promise<void> {
        try {
            const negatePromises = Array.from(labels).map(label =>
                new Label({
                    uri: did,
                    val: label,
                    neg: true,
                    cts: new Date()
                }).save()
            );
            
            await Promise.all(negatePromises);
        } catch (error) {
            logger.error('Error creating negation documents:', error);
            throw error;
        }
    }

    /**
     * Crea documentos para un conjunto de etiquetas
     */
    async createLabelDocuments(did: string, labels: Set<string>): Promise<void> {
        try {
            const createPromises = Array.from(labels).map(label =>
                new Label({
                    uri: did,
                    val: label,
                    neg: false,
                    cts: new Date()
                }).save()
            );
            
            await Promise.all(createPromises);
        } catch (error) {
            logger.error('Error creating label documents:', error);
            throw error;
        }
    }
}
