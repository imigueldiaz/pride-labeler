import { MongoDBLabelerServer } from './server/mongodbLabelerServer.js';
import { DID, SIGNING_KEY } from './config.js';
import { DELETE, LABELS } from './constants.js';
import logger from './logger.js';
import { LabelService } from './services/labelService.js';

export const labelerServer = new MongoDBLabelerServer({ did: DID, signingKey: SIGNING_KEY });
const labelService = new LabelService();

async function deleteAllLabels(did: string, labels: Set<string>) {
  const labelsToDelete: string[] = Array.from(labels);

  if (labelsToDelete.length === 0) {
    logger.info(`No labels to delete`);
    return;
  }

  logger.info(`Labels to delete: ${labelsToDelete.join(', ')}`);
  try {
    // Crear documentos de negación para cada etiqueta
    await labelService.createNegationDocuments(did, labels);
    
    // Notificar al servidor de etiquetas
    labelerServer.createLabels({ uri: did }, { negate: labelsToDelete });
    logger.info('Successfully deleted all labels');
  } catch (error) {
    logger.error(`Error deleting labels: ${error}`);
    throw error;
  }
}

async function addOrUpdateLabel(did: string, rkey: string, currentLabels: Set<string>) {
  const newLabel = LABELS.find((label) => label.rkey === rkey);
  if (!newLabel) {
    logger.warn(`New label not found: ${rkey}. Likely liked a post that's not one for labels.`);
    return;
  }
  logger.info(`New label: ${newLabel.identifier}`);

  // Verificar si la etiqueta ya existe
  if (currentLabels.has(newLabel.identifier)) {
    logger.info(`Label ${newLabel.identifier} already exists for ${did}`);
    return;
  }

  try {
    // Obtener todas las etiquetas actuales más la nueva
    const allLabels = new Set(currentLabels);
    allLabels.add(newLabel.identifier);

    // Primero negar todas las etiquetas existentes
    if (currentLabels.size > 0) {
      await labelService.createNegationDocuments(did, currentLabels);
      labelerServer.createLabels({ uri: did }, { negate: Array.from(currentLabels) });
    }

    // Luego crear todas las etiquetas de una vez
    await labelService.createLabelDocuments(did, Array.from(allLabels));
    labelerServer.createLabels({ uri: did }, { create: Array.from(allLabels) });
    logger.info(`Successfully labeled ${did} with all labels: ${Array.from(allLabels).join(', ')}`);
  } catch (error) {
    logger.error(`Error adding labels: ${error}`);
    throw error;
  }
}

export const label = async (did: string, rkey: string) => {
  logger.info(`Received rkey: ${rkey} for ${did}`);

  if (rkey === 'self') {
    logger.info(`${did} liked the labeler. Returning.`);
    return;
  }

  try {
    const labels = await labelService.getCurrentLabels(did);

    if (rkey.includes(DELETE)) {
      await deleteAllLabels(did, labels);
    } else {
      await addOrUpdateLabel(did, rkey, labels);
    }
  } catch (error) {
    logger.error(`Error in \`label\` function: ${error}`);
  }
};