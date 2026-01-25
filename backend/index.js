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

// Basic health check
app.get('/', (req, res) => {
    res.send('P2P File Transfer Signaling Server is running on a single port!');
});

// PeerJS Server
// Mounts on /myapp path. The client connects to host:port/myapp
const peerServer = ExpressPeerServer(server, {
    debug: true,
    path: '/',
    allow_discovery: true
});

app.use('/myapp', peerServer);

server.listen(port, () => {
    console.log(`Server (Express + PeerJS) running on port ${port}`);
});
