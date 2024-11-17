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
  const query = labelerServer.db
    .prepare<string[]>(`SELECT * FROM labels WHERE uri = ?`)
    .all(did) as ComAtprotoLabelDefs.Label[];

  const labels = query.reduce((set, label) => {
    if (!label.neg) set.add(label.val);
    else set.delete(label.val);
    return set;
  }, new Set<string>());

  if (labels.size > 0) {
    logger.info(`Current labels: ${Array.from(labels).join(', ')}`);
  }

  return labels;
}

function deleteAllLabels(did: string, labels: Set<string>) {
  const labelsToDelete: string[] = Array.from(labels);

  if (labelsToDelete.length === 0) {
    logger.info('No labels to delete.');
    return;
  }

  logger.info(`Deleting labels: ${labelsToDelete.join(', ')}`);

  for (const label of labelsToDelete) {
    labelerServer.db.prepare('INSERT INTO labels (uri, val, neg, cts) VALUES (?, ?, true, ?)').run(did, label, Date.now());
  }
}

function addOrUpdateLabel(did: string, rkey: string, currentLabels: Set<string>) {
  const label = LABELS.find((l) => l.rkey === rkey);
  if (!label) {
    logger.error(`Label with rkey ${rkey} not found`);
    return;
  }

  const newLabel = label.identifier;
  logger.info(`New label: ${newLabel}`);

  // No necesitamos negar las etiquetas existentes si LABEL_LIMIT es 0
  if (LABEL_LIMIT > 0 && currentLabels.size >= LABEL_LIMIT) {
    const labelsToNegate = Array.from(currentLabels);
    logger.info(`Successfully negated existing labels: ${labelsToNegate.join(', ')}`);
    for (const labelToNegate of labelsToNegate) {
      labelerServer.db
        .prepare('INSERT INTO labels (uri, val, neg, cts) VALUES (?, ?, true, ?)')
        .run(did, labelToNegate, Date.now());
    }
  }

  labelerServer.db
    .prepare('INSERT INTO labels (uri, val, neg, cts) VALUES (?, ?, false, ?)')
    .run(did, newLabel, Date.now());

  logger.info(`Successfully labeled ${did} with ${newLabel}`);
}
