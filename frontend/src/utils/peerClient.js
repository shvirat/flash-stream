import Peer from 'peerjs';

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
                host: 'localhost',
                port: 9000,
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
                this.onStatus('Error: ' + err.type);

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
            this.onStatus('Error: Cannot connect to yourself');
            return;
        }

        // Prevent duplicate connections to same peer
        if (this.connections.some(c => c.peer === remotePeerId && c.open)) {
            console.warn('Already connected to:', remotePeerId);
            return;
        }

        const conn = this.peer.connect(remotePeerId); // Removed { reliable: true } which can cause hangs

        // Connection Timeout Safety
        setTimeout(() => {
            if (conn && !conn.open) {
                console.warn('Connection timed out');
                conn.close();
                this.onStatus('Connection Timed Out');
            }
        }, 15000);

        this.handleConnection(conn);
    }

    handleConnection(conn) {
        // Prevent duplicate incoming connections
        if (this.connections.some(c => c.peer === conn.peer && c.open)) {
            console.warn('Duplicate connection rejected:', conn.peer);
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
            this.onStatus('Connected');
            this.onPeerJoin(conn);
        });

        conn.on('data', (data) => {
            this.handleData(data);
        });

        conn.on('close', () => {
            this.conn = null;
            this.connections = this.connections.filter(c => c !== conn);
            this.onStatus('Disconnected');
        });

        conn.on('error', (err) => {
            console.error('Connection error:', err);
            this.connections = this.connections.filter(c => c !== conn);
            this.onStatus('Connection Error');
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
                    data: data
                });

                // Flow Control: Tell worker to read next chunk ONLY after we sent this one
                this.worker.postMessage({ type: 'ack' });

                const progress = Math.min(100, Math.round((offset / file.size) * 100));
                this.onProgress(progress);
            }
            else if (type === 'complete') {
                this.onStatus('File Sent!');
                this.worker.terminate();
                this.worker = null;
            }
            else if (type === 'error') {
                console.error('Worker error:', error);
                this.onStatus('Error reading file');
                this.worker.terminate();
            }
        };

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
            this.onStatus('Transfer Cancelled');
            this.onProgress(0);
        }

        // Cleanup local state (Receiver or Sender)
        this.receivedChunks = [];
        this.receivedSize = 0;
        this.fileMeta = null;
    }

    destroy() {
        if (this.peer) {
            this.peer.destroy();
            this.peer = null;
        }
        if (this.conn) {
            try { this.conn.close(); } catch (e) { }
            this.conn = null;
        }
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
        this.connections.forEach(c => {
            try { c.close(); } catch (e) { }
        });
        this.connections = [];

        // Reset Callbacks to avoid phantom calls
        this.onProgress = () => { };
        this.onStatus = () => { };
        this.onFileReceived = () => { };
        this.onTextReceived = () => { };
        this.onPeerJoin = () => { };
    }

    sendText(text) {
        this.connections.forEach(conn => {
            if (conn && conn.open) {
                conn.send({ type: 'text', text });
            }
        });
    }

    receivedChunks = [];
    receivedSize = 0;
    fileMeta = null;

    handleData(data) {
        if (data.type === 'meta') {
            this.fileMeta = data;
            this.receivedChunks = [];
            this.receivedSize = 0;
            const truncate = (n) => n.length > 20 ? n.substring(0, 10) + '...' + n.substring(n.lastIndexOf('.')) : n;
            this.onStatus(`Receiving ${truncate(data.name)}`);
        } else if (data.type === 'chunk') {
            if (!this.fileMeta) return; // Ignore chunks if no meta (e.g. cancelled or done)

            this.receivedChunks.push(data.data);
            this.receivedSize += data.data.byteLength;

            // Update Progress
            const progress = Math.min(100, Math.round((this.receivedSize / this.fileMeta.size) * 100));
            this.onProgress(progress);

            // Check Complete
            if (this.receivedSize >= this.fileMeta.size) {
                this.onStatus('Download Complete');
                const blob = new Blob(this.receivedChunks, { type: this.fileMeta.mime });
                this.onFileReceived(blob, this.fileMeta.name);

                // Cleanup / Reset State
                this.receivedChunks = [];
                this.receivedSize = 0;
                this.fileMeta = null; // Important: Prevents multiple downloads
            }
        } else if (data.type === 'cancel') {
            this.onStatus('Transfer Cancelled by Peer');
            this.receivedChunks = [];
            this.receivedSize = 0;
            this.fileMeta = null;
            this.onProgress(0);
        } else if (data.type === 'text') {
            this.onTextReceived(data.text);
        } else if (data.type === 'error') {
            this.onStatus(`Error: ${data.message}`);
            // Force close if instructed by peer logic (though peer usually closes it)
        }
    }
}
