import { openDB } from 'idb';
// Handles all IndexedDB operations for large file storage

const DB_NAME = 'FlashStreamDB';
const STORE_NAME = 'file_chunks';

let dbPromise = null;

export const dbUtil = {
    async initDB() {
        if (!dbPromise) {
            dbPromise = openDB(DB_NAME, 2, {
                upgrade(db, oldVersion, newVersion, transaction) {
                    let store;
                    if (!db.objectStoreNames.contains(STORE_NAME)) {
                        store = db.createObjectStore(STORE_NAME, { autoIncrement: true });
                        store.createIndex('fileId', 'fileId', { unique: false });
                    } else {
                        store = transaction.objectStore(STORE_NAME);
                    }

                    if (!store.indexNames.contains('timestamp')) {
                        store.createIndex('timestamp', 'timestamp', { unique: false });
                    }
                },
            });
        }
        return dbPromise;
    },

    async storeChunk(fileId, chunkArrayBuffer, offset) {
        const db = await this.initDB();
        await db.add(STORE_NAME, {
            fileId,
            data: chunkArrayBuffer,
            offset,
            timestamp: Date.now()
        });
    },

    async getFile(fileId, mimeType) {
        const db = await this.initDB();
        // Get all chunks for this file
        const tx = db.transaction(STORE_NAME, 'readonly');
        const index = tx.store.index('fileId');

        // getAll guarantees order by primary key (insertion order), 
        // which matches our sequential receiving order.
        const chunks = await index.getAll(IDBKeyRange.only(fileId));

        if (!chunks || chunks.length === 0) return null;

        // Sort by offset to ensure correct order regardless of write completion time
        chunks.sort((a, b) => a.offset - b.offset);

        // Extract just the data buffers
        const buffers = chunks.map(c => c.data);
        return new Blob(buffers, { type: mimeType });
    },

    async clearFile(fileId) {
        const db = await this.initDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const index = tx.store.index('fileId');

        // Efficiently find keys to delete
        const keys = await index.getAllKeys(IDBKeyRange.only(fileId));

        await Promise.all(keys.map(key => tx.store.delete(key)));
        await tx.done;
    },

    async clearOldFiles(maxAge = 3600000) { // Default 1 Hour
        const db = await this.initDB();
        const cutoff = Date.now() - maxAge;
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const index = tx.store.index('timestamp');

        // Efficiently get all keys older than cutoff
        // IDBKeyRange.upperBound(cutoff) selects everything where timestamp <= cutoff
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
