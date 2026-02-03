import Peer from 'peerjs';
import { dbUtil } from './db';

export class P2PClient {
    constructor() {
        this.peer = null;
        this.conn = null;
        this.peerId = null;
        this.onProgress = () => { };
        this.onStatus = () => { };
        this.onFileReceived = () => { };
        this.onTextReceived = () => { };
        this.onPeerJoin = () => { };
        this.connections = []; // Connection Pool
        this.maxPeers = Infinity;
        this.worker = null;
        this.lastNotificationTime = 0;
        this.dataQueue = Promise.resolve();

        // Auto-clear notification when app is opened
        this.handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                this.clearNotification('file-transfer');
            }
        };
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }

    emitStatus(type, message) {
        this.onStatus({ type, message });
    }

    init(isSender = true, initialId = null, maxPeers = Infinity) {
        this.maxPeers = maxPeers;
        return new Promise((resolve, reject) => {
            // Generate 6-char ID if not provided: Uppercase alphanumeric
            const shortId = initialId || Math.random().toString(36).substring(2, 8).toUpperCase();

            // Determine Configuration based on Environment
            const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

            const iceServers = [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:global.stun.twilio.com:3478' }
            ];

            const signalingServer = {
                host: 'p2p-signaling-server-spb6.onrender.com',
                port: 443,
                secure: true,
                path: '/peerjs'
            };

            const localServer = {
                // host: 'localhost',
                // port: 9000,
                // path: '/peerjs'
                host: 'p2p-signaling-server-spb6.onrender.com',
                port: 443,
                secure: true,
                path: '/peerjs'
            };

            const config = isProduction ? { ...signalingServer, config: { iceServers } } : { ...localServer, config: { iceServers } };

            this.peer = new Peer(shortId, config);

            this.peer.on('open', (id) => {
                this.peerId = id;
                console.log('My Peer ID:', id);
                resolve(id);
            });

            this.peer.on('error', (err) => {
                console.error('Peer error:', err);
                this.emitStatus('ERROR', 'Error: ' + err.type);

                // Fix for zombie connection: If connecting fails (e.g. wrong ID), cleanup the pending connection
                if (['peer-unavailable', 'socket-error', 'browser-incompatible'].includes(err.type)) {
                    if (this.conn && !this.conn.open) {
                        this.connections = this.connections.filter(c => c !== this.conn);
                        this.conn = null;
                    }
                }

                reject(err);
            });

            this.peer.on('connection', (conn) => {
                this.handleConnection(conn);
            });
        });
    }

    connect(remotePeerId) {
        if (!this.peer) return;

        const targetId = remotePeerId.trim();

        // Prevent self-connection
        if (targetId === this.peerId) {
            console.warn('Cannot connect to yourself');
            this.emitStatus('ERROR', 'Error: Cannot connect to yourself');
            return;
        }

        // Prevent duplicate connections to same peer
        if (this.connections.some(c => c.peer === remotePeerId && c.open)) {
            console.warn('Already connected to:', remotePeerId);
            return;
        }

        const conn = this.peer.connect(remotePeerId); // Removed { reliable: true } which can cause hangs

        // Connection Timeout Safety
        const timer = setTimeout(() => {
            if (conn && !conn.open) {
                console.warn('Connection timed out');
                conn.close();
                this.emitStatus('ERROR', 'Connection Timed Out');
            }
        }, 15000);

        // Clear timeout on any final state
        conn.on('open', () => clearTimeout(timer));
        conn.on('close', () => clearTimeout(timer));
        conn.on('error', () => clearTimeout(timer));

        this.handleConnection(conn);
    }

    startHeartbeat(conn) {
        if (conn._heartbeat) clearInterval(conn._heartbeat);
        conn._lastPong = Date.now();
        conn._heartbeat = setInterval(() => {
            if (conn.open) {
                conn.send({ type: 'ping' });
                if (Date.now() - conn._lastPong > 10000) {
                    console.warn('Peer dead (heartbeat timeout)');
                    conn.close();
                }
            }
        }, 2000);
    }

    handleConnection(conn) {
        // Prevent duplicate incoming connections
        if (this.connections.some(c => c.peer === conn.peer && c.open)) {
            console.warn('Duplicate connection rejected:', conn.peer);
            this.emitStatus('ERROR', `Rejected duplicate from ${conn.peer}`);
            conn.close();
            return;
        }

        // Enforce Limit
        if (this.connections.length >= this.maxPeers) {
            console.warn('Connection rejected: Max peers reached');
            conn.on('open', () => {
                conn.send({ type: 'error', message: 'Room Full' });
                // rapid close
                setTimeout(() => conn.close(), 100);
            });
            return;
        }

        // Add to pool
        this.connections.push(conn);
        this.conn = conn; // Keep legacy reference for 1:1 compatibility

        conn.on('open', () => {
            console.log('Connected to:', conn.peer);
            // Optimization: Set Backpressure threshold once
            if (conn.dataChannel) {
                conn.dataChannel.bufferedAmountLowThreshold = 256 * 1024; // 256KB
            }
            this.emitStatus('CONNECTED', 'Connected');
            this.onPeerJoin(conn);
            this.startHeartbeat(conn);
        });

        conn.on('data', (data) => {
            // Queue data handling to prevent race conditions (e.g. meta clearing file while chunk is writing)
            this.dataQueue = this.dataQueue.then(async () => {
                try {
                    await this.handleData(data, conn);
                } catch (err) {
                    console.error('Error handling data:', err);
                }
            });
        });

        conn.on('close', () => {
            if (conn._heartbeat) clearInterval(conn._heartbeat);
            this.conn = null;
            this.connections = this.connections.filter(c => c !== conn);
            this.emitStatus('DISCONNECTED', 'Disconnected');
        });

        conn.on('error', (err) => {
            console.error('Connection error:', err);
            if (conn._heartbeat) clearInterval(conn._heartbeat);
            this.connections = this.connections.filter(c => c !== conn);
            this.emitStatus('ERROR', 'Connection Error');
        });
    }

    async sendFile(file) {
        if (!this.conn || !this.conn.open) {
            console.error('Connection not open');
            return;
        }

        // Send metadata first
        this.conn.send({
            type: 'meta',
            name: file.name,
            size: file.size,
            mime: file.type
        });

        // Initialize Worker
        if (this.worker) this.worker.terminate();
        this.worker = new Worker(new URL('./transfer.worker.js', import.meta.url), { type: 'module' });

        this.worker.onmessage = (e) => {
            const { type, data, offset, error } = e.data;

            if (type === 'chunk') {
                if (!this.conn || !this.conn.open) {
                    this.worker.terminate();
                    return;
                }

                this.conn.send({
                    type: 'chunk',
                    data: data,
                    offset: offset
                });

                // Flow Control: Backpressure Handling
                const checkBuffer = () => {
                    if (!this.conn || !this.conn.open) return;
                    if (!this.worker) return;

                    const dc = this.conn.dataChannel;
                    const bufferedAmount = dc?.bufferedAmount || 0;
                    const BUFFER_LIMIT = 1024 * 1024; // 1MB

                    if (bufferedAmount > BUFFER_LIMIT) {
                        const onLow = () => {
                            dc.removeEventListener('bufferedamountlow', onLow);
                            checkBuffer();
                        };
                        dc.addEventListener('bufferedamountlow', onLow);
                    } else {
                        this.worker.postMessage({ type: 'ack' });

                        const progress = Math.min(100, Math.round(((offset + data.byteLength) / file.size) * 100));

                        // Speed Calculation (Sender)
                        const now = Date.now();
                        const timeDiff = (now - this.lastSpeedTime) / 1000;
                        if (timeDiff >= 1) {
                            const bytesDiff = offset - this.lastBytes;
                            this.currentSpeed = bytesDiff / timeDiff / (1024 * 1024); // MB/s
                            this.lastBytes = offset;
                            this.lastSpeedTime = now;
                        }

                        this.onProgress(progress, (this.currentSpeed || 0).toFixed(1));

                        this.updateNotification(
                            `Sending ${file.name}`,
                            `${progress}% - ${this.formatBytes(offset)} / ${this.formatBytes(file.size)}`,
                            'file-transfer',
                            progress
                        );
                    }
                };

                checkBuffer();
            }
            else if (type === 'complete') {
                this.emitStatus('TRANSFER_SUCCESS', 'File Sent!');
                this.updateNotification('File Sent', `Successfully sent ${file.name}`, 'file-transfer');
                this.worker.terminate();
                this.worker = null;
            }
            else if (type === 'error') {
                console.error('Worker error:', error);
                this.emitStatus('ERROR', 'Error reading file');
                this.worker.terminate();
            }
        };

        this.lastBytes = 0;
        this.lastSpeedTime = Date.now();
        this.currentSpeed = 0;
        this.worker.postMessage({ file });
    }

    cancelTransfer() {
        // Stop Sender (Worker)
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }

        if (this.conn && this.conn.open) {
            this.conn.send({ type: 'cancel' });
            this.emitStatus('INFO', 'Transfer Cancelled');
            this.onProgress(0);
        }

        // Cleanup local state (Receiver or Sender)
        if (this.fileMeta) {
            dbUtil.clearFile(this.fileMeta.name);
        }
        this.receivedSize = 0;
        this.fileMeta = null;
    }

    destroy() {
        if (this.peer) {
            this.peer.destroy();
            this.peer = null;
        }
        if (this.conn) {
            if (this.conn._heartbeat) clearInterval(this.conn._heartbeat);
            try { this.conn.close(); } catch (e) { }
            this.conn = null;
        }
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
        this.connections.forEach(c => {
            if (c._heartbeat) clearInterval(c._heartbeat);
            try { c.close(); } catch (e) { }
        });
        this.connections = [];
        this.peerId = null;

        // Optional: Clear old chunks
        dbUtil.clearAll();

        // Reset Callbacks
        this.onProgress = () => { };
        this.onStatus = () => { };
        this.onFileReceived = () => { };
        this.onTextReceived = () => { };
        this.onPeerJoin = () => { };

        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }

    sendText(text) {
        this.connections.forEach(conn => {
            if (conn && conn.open) {
                conn.send({ type: 'text', text });
            }
        });
    }

    receivedSize = 0;
    fileMeta = null;
    lastBytes = 0;
    lastSpeedTime = 0;
    currentSpeed = 0;

    async handleData(data, conn) {
        if (data.type === 'ping') {
            conn.send({ type: 'pong' });
            return;
        }
        if (data.type === 'pong') {
            conn._lastPong = Date.now();
            return;
        }

        if (data.type === 'meta') {
            // Security: Sanitize Filename (Blacklist Approach)
            // Allows Emojis, Unicode (e.g. Hindi/Japanese), and symbols ($%@#)
            // blocked: < > : " / \ | ? * (Windows/Linux reserved) and control chars
            const sanitizedName = data.name.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');

            this.fileMeta = { ...data, name: sanitizedName };
            this.receivedSize = 0;
            this.lastBytes = 0;
            this.lastSpeedTime = Date.now();
            this.currentSpeed = 0;

            // Ensure connection is clean for this file (prevent appending to old chunks)
            try { await dbUtil.clearFile(sanitizedName); } catch (e) { console.warn(e); }

            const truncate = (n) => n.length > 20 ? n.substring(0, 10) + '...' + n.substring(n.lastIndexOf('.')) : n;
            this.emitStatus('TRANSFER_START', `Receiving ${truncate(sanitizedName)}`);
        } else if (data.type === 'chunk') {
            if (!this.fileMeta) return; // Ignore chunks if no meta (e.g. cancelled or done)

            // Store chunk in IndexedDB instead of RAM
            try {
                await dbUtil.storeChunk(this.fileMeta.name, data.data, data.offset);
            } catch (err) {
                console.error('DB Error:', err);
                this.emitStatus('ERROR', 'DB Write Failed');
                return;
            }

            this.receivedSize += data.data.byteLength;

            // Update Progress & Speed
            const progress = Math.min(100, Math.round((this.receivedSize / this.fileMeta.size) * 100));

            // Speed Calculation (Receiver)
            const now = Date.now();
            const timeDiff = (now - this.lastSpeedTime) / 1000;
            if (timeDiff >= 1) {
                const bytesDiff = this.receivedSize - this.lastBytes;
                this.currentSpeed = bytesDiff / timeDiff / (1024 * 1024); // MB/s
                this.lastBytes = this.receivedSize;
                this.lastSpeedTime = now;
            }

            this.onProgress(progress, (this.currentSpeed || 0).toFixed(1));

            // Notify if backgrounded (Receiving)
            this.updateNotification(
                `Receiving ${this.fileMeta.name}`,
                `${progress}% - ${this.formatBytes(this.receivedSize)} / ${this.formatBytes(this.fileMeta.size)}`,
                'file-transfer',
                progress
            );

            // Check Complete
            if (this.receivedSize >= this.fileMeta.size) {
                this.emitStatus('TRANSFER_SUCCESS', 'Download Complete');
                this.updateNotification('Download Complete', `Finished receiving ${this.fileMeta.name}`, 'file-transfer');

                // Reconstruct from DB
                try {
                    const blob = await dbUtil.getFile(this.fileMeta.name, this.fileMeta.mime);
                    if (blob) {
                        this.onFileReceived(blob, this.fileMeta.name);
                        // Cleanup DB after successful handover (optional, or keep as cache)
                        dbUtil.clearFile(this.fileMeta.name).catch(console.warn);
                    } else {
                        console.error('File reassembly failed: Blob is null');
                        this.emitStatus('ERROR', 'Error: File corrupt');
                    }
                } catch (err) {
                    console.error('File reassembly error:', err);
                    this.emitStatus('ERROR', 'Error: Could not save file');
                }

                // Cleanup / Reset State
                this.receivedSize = 0;
                this.fileMeta = null;
            }
        } else if (data.type === 'cancel') {
            this.emitStatus('INFO', 'Transfer Cancelled by Peer');

            // Stop sending if we are the sender
            if (this.worker) {
                this.worker.terminate();
                this.worker = null;
            }

            // Transfer Cancelled
            if (this.fileMeta) {
                dbUtil.clearFile(this.fileMeta.name);
            }

            this.receivedSize = 0;
            this.fileMeta = null;
            this.onProgress(0);
        } else if (data.type === 'text') {
            this.onTextReceived(data.text);
        } else if (data.type === 'error') {
            this.emitStatus('ERROR', `Error: ${data.message}`);
            // Force close if instructed by peer logic (though peer usually closes it)
        }
    }

    async updateNotification(title, body, tag, progress = null) {
        if (!('serviceWorker' in navigator)) return;
        if (Notification.permission !== 'granted') return; // Assume permission handled in UI
        if (document.visibilityState !== 'hidden') return;

        const now = Date.now();
        // Throttle updates: Max 1 per second unless it's a completion event (progress null or 100) or start
        if (progress !== null && progress < 100 && now - this.lastNotificationTime < 1000) {
            return;
        }
        this.lastNotificationTime = now;

        try {
            const reg = await navigator.serviceWorker.ready;
            if (!reg) return;

            reg.showNotification(title, {
                body: body,
                tag: tag,
                icon: '/images/logo.png',
                badge: '/images/badge.png',
                silent: true,
                renotify: false
            });
        } catch (e) {
            console.error('Notification error:', e);
        }
    }

    async clearNotification(tag) {
        if (!('serviceWorker' in navigator)) return;
        try {
            const reg = await navigator.serviceWorker.ready;
            const notifications = await reg.getNotifications({ tag });
            notifications.forEach(n => n.close());
        } catch (e) {
            console.error('Error clearing notifications:', e);
        }
    }

    formatBytes(bytes, decimals = 2) {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    }
}
