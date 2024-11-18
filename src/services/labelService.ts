import { Label } from '../models/Label.js';
import logger from '../logger.js';

export class LabelService {
    /**
     * Obtiene las etiquetas actuales para un DID específico
     */
    async getCurrentLabels(did: string): Promise<Set<string>> {
        try {
            // Obtener las etiquetas más recientes para cada valor, ordenadas por fecha
            const labels = await Label.aggregate([
                // Filtrar por el DID específico
                { $match: { uri: did } },
                // Agrupar por valor de etiqueta y obtener el documento más reciente
                {
                    $group: {
                        _id: "$val",
                        latestDoc: { $first: "$$ROOT" },
                        latestDate: { $max: "$cts" }
                    }
                },
                // Filtrar solo las etiquetas activas (no negadas)
                { $match: { "latestDoc.neg": false } },
                // Proyectar solo los campos necesarios
                {
                    $project: {
                        _id: 0,
                        val: "$latestDoc.val",
                        uri: "$latestDoc.uri",
                        cts: "$latestDoc.cts"
                    }
                }
            ]);

            // Convertir los resultados a un Set de valores
            const activeLabels = new Set<string>();
            for (const label of labels) {
                if (label.val) {
                    activeLabels.add(label.val);
                    logger.info(`Active label found: ${label.val}`);
                }
            }

            if (activeLabels.size > 0) {
                logger.info(`Current active labels: ${Array.from(activeLabels).join(', ')}`);
            } else {
                logger.info(`No active labels found for ${did}`);
            }

            return activeLabels;
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
            logger.info(`Created negation documents for labels: ${Array.from(labels).join(', ')}`);
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
            logger.info(`Created label documents for labels: ${Array.from(labels).join(', ')}`);
        } catch (error) {
            logger.error('Error creating label documents:', error);
            throw error;
        }
    }
}
