const express = require('express');
const { ExpressPeerServer } = require('peer');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const server = http.createServer(app);

// Use PORT from environment (critical for deployment) or default to 9000 locally
const port = process.env.PORT || 9000;

// Security & CORS
app.use(helmet());
app.use(cors());
app.enable('trust proxy'); // Critical for Render/Heroku behind load balancers

// Basic health check
app.get('/', (req, res) => {
    res.send('P2P Signaling Server Running (Use /peerjs for WebSocket)');
});

// PeerJS Server
const peerServer = ExpressPeerServer(server, {
    debug: true,
    path: '/',
    proxied: true, // Required for SSL/Secure connections behind proxy
    allow_discovery: true
});

app.use('/peerjs', peerServer);

server.listen(port, () => {
    console.log(`Server (Express + PeerJS) running on port ${port}`);
});
