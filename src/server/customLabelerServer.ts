import { LabelerServer } from '@skyware/labeler';
import { LabelService } from '../services/labelService.js';
import logger from '../logger.js';
import { FastifyReply, FastifyRequest } from 'fastify';

export class CustomLabelerServer extends LabelerServer {
    private labelService: LabelService;

    constructor(options: { did: string; signingKey: string }) {
        super(options);
        this.labelService = new LabelService();

        // Sobrescribir el manejador por defecto usando decorateRequest
        this.app.decorateRequest('labelService', this.labelService);
        
        // Añadir un hook pre-handler para todas las rutas /xrpc/com.atproto.label.queryLabels
        this.app.addHook('preHandler', async (request, reply) => {
            if (request.url === '/xrpc/com.atproto.label.queryLabels' && request.method === 'GET') {
                return this.handleQueryLabels(request, reply);
            }
        });
    }

    private async handleQueryLabels(request: FastifyRequest, reply: FastifyReply) {
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
    }
}
