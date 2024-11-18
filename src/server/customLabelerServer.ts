import { LabelerServer } from '@skyware/labeler';
import { LabelService } from '../services/labelService.js';
import logger from '../logger.js';

export class CustomLabelerServer extends LabelerServer {
    private labelService: LabelService;

    constructor(options: { did: string; signingKey: string }) {
        super(options);
        this.labelService = new LabelService();

        // Override the default queryLabels handler
        this.app.get('/xrpc/com.atproto.label.queryLabels', async (request, reply) => {
            try {
                const { uri } = request.query as { uri?: string };
                
                if (!uri) {
                    return reply.code(400).send({ error: 'URI parameter is required' });
                }

                const labels = await this.labelService.getCurrentLabels(uri);
                const labelObjects = Array.from(labels).map(val => ({
                    src: this.did,
                    uri: uri,
                    val: val,
                    cts: new Date().toISOString()
                }));

                return reply.send({
                    cursor: '0',
                    labels: labelObjects
                });
            } catch (error) {
                logger.error('Error querying labels:', error);
                return reply.code(500).send({ error: 'Internal server error' });
            }
        });
    }
}
