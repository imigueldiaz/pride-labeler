import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Configurar __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { connectDB, disconnectDB } from '../src/db/connection.js';
import { Label } from '../src/models/Label.js';
import logger from '../src/logger.js';

const BACKUP_DIR = path.join(__dirname, '..', 'backups');

async function getLatestBackup() {
    try {
        const files = await fs.readdir(BACKUP_DIR);
        const backupFiles = files.filter(f => f.startsWith('labels-backup-'));
        if (backupFiles.length === 0) {
            throw new Error('No backup files found');
        }
        
        // Ordenar por fecha y tomar el más reciente
        backupFiles.sort((a, b) => b.localeCompare(a));
        const latestBackup = backupFiles[0];
        
        logger.info(`Found latest backup: ${latestBackup}`);
        return path.join(BACKUP_DIR, latestBackup);
    } catch (error) {
        logger.error('Error getting latest backup:', error);
        throw error;
    }
}

async function migrate() {
    try {
        logger.info('Starting migration process...');
        
        // Conectar a MongoDB
        await connectDB();
        
        // Leer el último backup
        const backupFile = await getLatestBackup();
        logger.info(`Using backup file: ${backupFile}`);
        
        const data = await fs.readFile(backupFile, 'utf-8');
        const backup = JSON.parse(data);
        
        // Limpiar la colección actual
        await Label.deleteMany({});
        logger.info('Cleared existing labels');
        
        // Insertar las etiquetas
        const labels = backup.labels.map(label => ({
            ...label,
            cts: new Date(label.cts)
        }));
        
        await Label.insertMany(labels);
        logger.info(`Successfully migrated ${labels.length} labels to MongoDB`);
        
    } catch (error) {
        logger.error('Error during migration:', error);
        process.exit(1);
    } finally {
        await disconnectDB();
    }
}

migrate();
