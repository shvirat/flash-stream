import React, { useState, useEffect, useRef } from 'react';
import { P2PClient } from '../utils/peerClient';
import { Download, Link, FileCheck } from 'lucide-react';
import toast from 'react-hot-toast';

function Receiver() {
    const [targetId, setTargetId] = useState(() => {
        const saved = localStorage.getItem('lastTargetId');
        const timestamp = localStorage.getItem('lastTargetIdTime');
        const EXPIRATION = 30 * 60 * 1000; // 30 minutes

        if (saved && timestamp) {
            if (Date.now() - parseInt(timestamp) < EXPIRATION) {
                return saved;
            }
        }
        return '';
    });
    const [status, setStatus] = useState('Ready to connect');
    const [progress, setProgress] = useState(0);
    const [isConnected, setIsConnected] = useState(false);

    const clientRef = useRef(new P2PClient());

    useEffect(() => {
        const client = clientRef.current;

        client.onStatus = (msg) => {
            setStatus(msg);
            if (msg === 'Connected') {
                setIsConnected(true);
                toast.success('Connected to Sender!');
            }
            if (msg === 'Disconnected') {
                setIsConnected(false);
                toast('Disconnected');
            }
            if (msg.includes('Error')) toast.error(msg);
        };
        client.onProgress = (p) => setProgress(p);

        client.onFileReceived = (blob, name) => {
            toast.success(`Received ${name}!`);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        };

        client.init(false, null, 1);

        return () => {
            if (client.peer) client.peer.destroy();
        };
    }, []);

    const handleConnect = () => {
        if (!targetId) {
            toast.error('Please enter a Sender ID');
            return;
        }
        localStorage.setItem('lastTargetId', targetId);
        localStorage.setItem('lastTargetIdTime', Date.now().toString());
        setStatus('Connecting...');
        clientRef.current.connect(targetId);
    };

    const cancelDownload = () => {
        clientRef.current.cancelTransfer();
        setStatus('Cancelled');
        setProgress(0);
        toast.error('Download Cancelled');
    };

    return (
        <div className="card">
            <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Download size={24} color="#238636" />
                Receive Mode
            </h2>

            <div style={{ marginBottom: '2rem', textAlign: 'left' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-dim)', marginBottom: '0.5rem' }}>
                    Enter Sender ID:
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                        type="text"
                        value={targetId}
                        onChange={(e) => setTargetId(e.target.value.toUpperCase())}
                        placeholder="e.g. X7K2M9"
                        maxLength={6}
                        style={{ flex: 1, fontFamily: 'monospace', textTransform: 'uppercase' }}
                        disabled={isConnected}
                        onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
                    />
                    <button onClick={handleConnect} disabled={isConnected || !targetId}>
                        {isConnected ? 'Connected' : 'Connect'}
                    </button>
                </div>
            </div>

            {progress > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                        <span>Downloading...</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <span>{progress}%</span>
                            {progress < 100 && (
                                <button
                                    onClick={cancelDownload}
                                    style={{
                                        padding: '0.2rem 0.6rem',
                                        fontSize: '0.8rem',
                                        background: '#da3633',
                                        border: 'none',
                                        color: 'white',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        marginTop: '-2px'
                                    }}
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: '#30363d', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{
                            width: `${progress}%`,
                            height: '100%',
                            background: '#58a6ff',
                            transition: 'width 0.2s ease'
                        }} />
                    </div>
                </div>
            )}

            <div style={{
                padding: '1rem',
                background: '#0d1117',
                borderRadius: '8px',
                color: status.includes('Error') ? 'var(--danger-color)' : 'var(--text-dim)',
                fontSize: '0.9rem',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                justifyContent: 'center'
            }}>
                {status === 'Download Complete' && <FileCheck size={16} color="#238636" />}
                {status}
            </div>
        </div>
    );
}

export default Receiver;
