import { ComAtprotoLabelDefs } from '@atcute/client/lexicons';
import { LabelerServer } from '@skyware/labeler';

import { DID, SIGNING_KEY } from './config.js';
import { DELETE, LABELS, LABEL_LIMIT } from './constants.js';
import logger from './logger.js';

export const labelerServer = new LabelerServer({ did: DID, signingKey: SIGNING_KEY });

export const label = (did: string, rkey: string) => {
  logger.info(`Received rkey: ${rkey} for ${did}`);

  if (rkey === 'self') {
    logger.info(`${did} liked the labeler. Returning.`);
    return;
  }
  try {
    const labels = fetchCurrentLabels(did);

    if (rkey.includes(DELETE)) {
      deleteAllLabels(did, labels);
    } else {
      addOrUpdateLabel(did, rkey, labels);
    }
  } catch (error) {
    logger.error(`Error in \`label\` function: ${error}`);
  }
};

function fetchCurrentLabels(did: string) {
  logger.info(`Fetching labels for DID: ${did}`);
  
  const query = labelerServer.db
    .prepare<string[]>(`SELECT * FROM labels WHERE uri = ?`)
    .all(did) as ComAtprotoLabelDefs.Label[];

  logger.info(`Found ${query.length} total label records in database`);
  
  // Mostrar todas las etiquetas en la base de datos
  query.forEach(label => {
    logger.info(`Label record: {
      value: ${label.val},
      negated: ${label.neg},
      source: ${label.src},
      timestamp: ${new Date(label.cts).toISOString()}
    }`);
  });

  const labels = query.reduce((set, label) => {
    if (!label.neg) {
      set.add(label.val);
      logger.info(`Adding active label: ${label.val}`);
    } else {
      set.delete(label.val);
      logger.info(`Removing negated label: ${label.val}`);
    }
    return set;
  }, new Set<string>());

  logger.info(`Final active labels for ${did}: ${Array.from(labels).join(', ')}`);
  return labels;
}

function deleteAllLabels(did: string, labels: Set<string>) {
  const labelsToDelete: string[] = Array.from(labels);

  if (labelsToDelete.length === 0) {
    logger.info(`No labels to delete for ${did}`);
    return;
  }

  logger.info(`Deleting labels for ${did}: ${labelsToDelete.join(', ')}`);

  for (const label of labelsToDelete) {
    try {
      labelerServer.db
        .prepare('INSERT INTO labels (uri, val, neg, cts, src) VALUES (?, ?, true, ?, ?)')
        .run(did, label, Date.now(), DID);
      logger.info(`Successfully negated label: ${label}`);
    } catch (error) {
      logger.error(`Error negating label ${label}: ${error}`);
    }
  }
}

function addOrUpdateLabel(did: string, rkey: string, currentLabels: Set<string>) {
  const label = LABELS.find((l) => l.rkey === rkey);
  if (!label) {
    logger.error(`Label with rkey ${rkey} not found`);
    return;
  }

  const newLabel = label.identifier;
  logger.info(`Adding new label for ${did}: ${newLabel}`);

  // No necesitamos negar las etiquetas existentes si LABEL_LIMIT es 0
  if (LABEL_LIMIT > 0 && currentLabels.size >= LABEL_LIMIT) {
    const labelsToNegate = Array.from(currentLabels);
    logger.info(`Need to negate existing labels due to LABEL_LIMIT: ${labelsToNegate.join(', ')}`);
    for (const labelToNegate of labelsToNegate) {
      try {
        labelerServer.db
          .prepare('INSERT INTO labels (uri, val, neg, cts, src) VALUES (?, ?, true, ?, ?)')
          .run(did, labelToNegate, Date.now(), DID);
        logger.info(`Successfully negated existing label: ${labelToNegate}`);
      } catch (error) {
        logger.error(`Error negating label ${labelToNegate}: ${error}`);
      }
    }
  }

  try {
    labelerServer.db
      .prepare('INSERT INTO labels (uri, val, neg, cts, src) VALUES (?, ?, false, ?, ?)')
      .run(did, newLabel, Date.now(), DID);
    logger.info(`Successfully added new label for ${did}: ${newLabel}`);
  } catch (error) {
    logger.error(`Error adding new label ${newLabel}: ${error}`);
  }
}
