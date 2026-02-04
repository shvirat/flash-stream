import { openDB } from 'idb';
// Handles all IndexedDB operations for large file storage

const DB_NAME = 'FlashStreamDB';
const STORE_NAME = 'file_chunks';

let dbPromise = null;

export const dbUtil = {
    async initDB() {
        if (!dbPromise) {
            dbPromise = openDB(DB_NAME, 3, {
                upgrade(db, oldVersion, newVersion, transaction) {
                    // Schema Upgrade: Change to Composite Key [fileId, offset] for uniqueness
                    if (db.objectStoreNames.contains(STORE_NAME)) {
                        db.deleteObjectStore(STORE_NAME);
                    }

                    const store = db.createObjectStore(STORE_NAME, {
                        keyPath: ['fileId', 'offset']
                    });

                    // Timestamp index for cleanup
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                },
            });
        }
        return dbPromise;
    },

    async storeChunk(fileId, chunkArrayBuffer, offset) {
        try {
            const db = await this.initDB();
            // put() is idempotent: overwrites existing chunk if same fileId and offset
            await db.put(STORE_NAME, {
                fileId,
                offset,
                data: chunkArrayBuffer,
                timestamp: Date.now()
            });
        } catch (err) {
            if (err.name === 'QuotaExceededError') {
                console.error('Storage Quota Exceeded');
                // Could emit global error if connected to UI, for now we log
                throw new Error('Disk Full');
            }
            throw err;
        }
    },

    async getFile(fileId, mimeType) {
        const db = await this.initDB();
        const tx = db.transaction(STORE_NAME, 'readonly');

        // Use Primary Key Range [fileId, 0] -> [fileId, Number.MAX_SAFE_INTEGER]
        // This implicitly sorts by offset because it is the second part of the key
        const range = IDBKeyRange.bound([fileId, 0], [fileId, Number.MAX_SAFE_INTEGER]);
        const chunks = await tx.store.getAll(range);

        if (!chunks || chunks.length === 0) return null;

        // Gap Detection / Integrity Check
        let expectedOffset = 0;
        const buffers = [];

        for (const chunk of chunks) {
            if (chunk.offset !== expectedOffset) {
                console.error(`Integrity Error: Missing chunk at offset ${expectedOffset}, found ${chunk.offset}`);
                throw new Error('File Corrupt: Missing Data Chunk');
            }
            buffers.push(chunk.data);
            expectedOffset += chunk.data.byteLength;
        }

        return new Blob(buffers, { type: mimeType });
    },

    async clearFile(fileId) {
        const db = await this.initDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');

        // Efficient Range Delete on Primary Key
        const range = IDBKeyRange.bound([fileId, 0], [fileId, Number.MAX_SAFE_INTEGER]);
        await tx.store.delete(range);
        await tx.done;
    },

    async clearOldFiles(maxAge = 3600000) { // Default 1 Hour
        const db = await this.initDB();
        const cutoff = Date.now() - maxAge;
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const index = tx.store.index('timestamp');

        const keys = await index.getAllKeys(IDBKeyRange.upperBound(cutoff));

        if (keys.length > 0) {
            console.log(`Cleaning up ${keys.length} old chunks...`);
            await Promise.all(keys.map(key => tx.store.delete(key)));
        }
        await tx.done;
    },

    async clearAll() {
        const db = await this.initDB();
        await db.clear(STORE_NAME);
    }
};
