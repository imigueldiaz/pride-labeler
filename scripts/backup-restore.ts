import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

const API_URL = 'https://pride-labeler.onrender.com/xrpc/com.atproto.label.queryLabels';
const BACKUP_DIR = path.join(process.cwd(), 'backups');
const BACKUP_FILE = path.join(BACKUP_DIR, `labels-backup-${new Date().toISOString().split('T')[0]}.json`);

async function ensureBackupDir() {
    try {
        await fs.access(BACKUP_DIR);
    } catch {
        await fs.mkdir(BACKUP_DIR, { recursive: true });
    }
}

async function backup() {
    try {
        await ensureBackupDir();
        
        console.log('📥 Fetching current labels...');
        const response = await axios.get(API_URL);
        const labels = response.data;

        console.log(`📝 Found ${labels.labels.length} labels`);
        await fs.writeFile(BACKUP_FILE, JSON.stringify(labels, null, 2));
        console.log(`✅ Backup saved to ${BACKUP_FILE}`);

        return labels;
    } catch (error) {
        console.error('❌ Error during backup:', error);
        process.exit(1);
    }
}

async function restore(backupFile?: string) {
    try {
        const fileToRestore = backupFile || BACKUP_FILE;
        console.log(`📂 Reading backup from ${fileToRestore}`);
        
        const data = await fs.readFile(fileToRestore, 'utf-8');
        const labels = JSON.parse(data);

        console.log(`📤 Found ${labels.labels.length} labels to restore`);
        // TODO: Implement restore logic when we have the endpoint
        console.log('⚠️ Restore functionality will be implemented when we migrate to external database');
        
        return labels;
    } catch (error) {
        console.error('❌ Error during restore:', error);
        process.exit(1);
    }
}

async function listBackups() {
    try {
        await ensureBackupDir();
        const files = await fs.readdir(BACKUP_DIR);
        console.log('\n📋 Available backups:');
        files.forEach(file => console.log(`- ${file}`));
    } catch (error) {
        console.error('❌ Error listing backups:', error);
        process.exit(1);
    }
}

// Command line interface
const command = process.argv[2];
const arg = process.argv[3];

switch (command) {
    case 'backup':
        backup();
        break;
    case 'restore':
        restore(arg);
        break;
    case 'list':
        listBackups();
        break;
    default:
        console.log(`
📚 Usage:
  npm run backup-restore backup   - Create new backup
  npm run backup-restore restore  - Restore latest backup
  npm run backup-restore restore [filename] - Restore specific backup
  npm run backup-restore list    - List available backups
        `);
}
