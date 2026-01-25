import React, { useState, useEffect, useRef } from 'react';
import { P2PClient } from '../utils/peerClient';
import { Copy, Check, File, UploadCloud, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

function Sender() {
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState('Initializing...');
    const [peerId, setPeerId] = useState('');
    const [progress, setProgress] = useState(0);
    const [copied, setCopied] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isConnected, setIsConnected] = useState(false);

    // Stable client ref
    const clientRef = useRef(new P2PClient());

    useEffect(() => {
        const client = clientRef.current;
        // Persistence: Load saved ID, but ignore legacy long IDs
        let savedId = localStorage.getItem('senderId');
        if (savedId && savedId.length > 8) savedId = null;

        client.onStatus = (msg) => {
            setStatus(msg);
            if (msg === 'Connected') {
                setIsConnected(true);
                toast.success('Receiver Connected!');
            }
            if (msg === 'File Sent!') {
                // Keep connected true
                toast.success('File Sent Successfully!');
            }
            if (msg === 'Disconnected' || msg.startsWith('Error')) {
                setIsConnected(false);
                toast.error(msg);
            }
        };

        client.onProgress = (p) => setProgress(p);

        client.init(true, savedId, 1).then((id) => {
            setPeerId(id);
            // Persistence: Save ID
            localStorage.setItem('senderId', id);
            setStatus('Waiting for connection...');
        }).catch(() => {
            toast.error('Failed to initialize connection');
        });

        // Global Drag & Drop events
        const handleDragOver = (e) => {
            e.preventDefault();
            setIsDragging(true);
        };
        const handleDragLeave = (e) => {
            e.preventDefault();
            setIsDragging(false);
        };
        const handleDrop = (e) => {
            e.preventDefault();
            setIsDragging(false);
        };

        window.addEventListener('dragover', handleDragOver);
        window.addEventListener('dragleave', handleDragLeave);
        window.addEventListener('drop', handleDrop);

        return () => {
            if (client.peer) client.peer.destroy();
            window.removeEventListener('dragover', handleDragOver);
            window.removeEventListener('dragleave', handleDragLeave);
            window.removeEventListener('drop', handleDrop);
        };
    }, []);

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(peerId);
            setCopied(true);
            toast.success('ID Copied!');
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            toast.error('Failed to copy');
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files?.[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleDropZone = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files?.[0]) {
            setFile(e.dataTransfer.files[0]);
            toast.success('File Selected');
        }
    };

    const sendFile = () => {
        if (!file) return;
        setStatus('Sending...');
        const toastId = toast.loading('Sending file...');

        // Wrap original onStatus to dismiss loading toast
        const originalStatus = clientRef.current.onStatus;
        clientRef.current.onStatus = (msg) => {
            if (msg === 'File Sent!' || msg.includes('Error')) {
                toast.dismiss(toastId);
            }
            originalStatus(msg);
        };

        clientRef.current.sendFile(file);
    };

    const cancelTransfer = () => {
        clientRef.current.cancelTransfer();
        toast.dismiss(); // Dismiss any loading toasts
        toast.error('Transfer Cancelled');
        setStatus('Cancelled');
        setProgress(0);
    };

    return (
        <div className="card">
            <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UploadCloud size={24} color="#58a6ff" />
                Send Mode
            </h2>

            {!peerId ? (
                <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', color: 'var(--text-dim)' }}>
                    <Loader2 className="spin" size={32} />
                    Generating Secure ID...
                </div>
            ) : (
                <>
                    <div style={{ marginBottom: '2rem', textAlign: 'left' }}>
                        <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-dim)', marginBottom: '0.5rem' }}>
                            Share this ID with the receiver:
                        </label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <div style={{
                                flex: 1,
                                background: '#0d1117',
                                border: '1px solid var(--border-color)',
                                padding: '0.8rem',
                                borderRadius: '6px',
                                fontFamily: 'monospace',
                                fontSize: '1.1rem',
                                color: '#58a6ff',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}>
                                {peerId}
                            </div>
                            <button onClick={copyToClipboard} title="Copy ID">
                                {copied ? <Check size={20} color="#238636" /> : <Copy size={20} />}
                            </button>
                        </div>
                    </div>

                    <div
                        onDrop={handleDropZone}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                        style={{
                            border: `2px dashed ${isDragging ? '#58a6ff' : 'var(--border-color)'}`,
                            borderRadius: '8px',
                            padding: '3rem',
                            textAlign: 'center',
                            marginBottom: '2rem',
                            cursor: 'pointer',
                            background: isDragging
                                ? 'rgba(88, 166, 255, 0.15)'
                                : (file ? 'rgba(88, 166, 255, 0.05)' : 'transparent'),
                            borderColor: (isDragging || file) ? '#58a6ff' : 'var(--border-color)',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <input
                            type="file"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                            id="file-input"
                        />
                        <label htmlFor="file-input" style={{ cursor: 'pointer', width: '100%', display: 'block' }}>
                            {file ? (
                                <div>
                                    <File size={48} color="#58a6ff" style={{ margin: '0 auto 1rem' }} />
                                    <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>{file.name}</div>
                                    <div style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                                    </div>
                                    <div style={{ marginTop: '1rem', color: '#58a6ff', fontSize: '0.8rem' }}>
                                        Click or Drop to change
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <UploadCloud size={48} color={isDragging ? '#58a6ff' : 'var(--text-dim)'} style={{ margin: '0 auto 1rem' }} />
                                    <div style={{ color: isDragging ? '#58a6ff' : 'var(--text-dim)', fontWeight: isDragging ? 600 : 400 }}>
                                        {isDragging ? 'Drop file here!' : 'Click or Drag file here'}
                                    </div>
                                </div>
                            )}
                        </label>
                    </div>

                    {progress > 0 && (
                        <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                <span>Transfer Progress</span>
                                <span>{progress}%</span>
                            </div>
                            <div style={{ width: '100%', height: '8px', background: '#30363d', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{
                                    width: `${progress}%`,
                                    height: '100%',
                                    background: '#238636',
                                    transition: 'width 0.2s ease'
                                }} />
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{
                            fontSize: '0.9rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <span className={clsx({
                                'status-dot': true,
                                'connected': status === 'Connected',
                                'error': status.includes('Error')
                            })} style={{
                                width: '8px', height: '8px', borderRadius: '50%',
                                background: status === 'Connected' ? '#238636' : (status.includes('Error') ? '#da3633' : '#8b949e')
                            }}></span>
                            {status}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {status === 'Sending...' && (
                                <button
                                    onClick={cancelTransfer}
                                    style={{
                                        background: '#da3633',
                                        borderColor: '#da3633',
                                        color: 'white',
                                        padding: '0.8em 1.5em'
                                    }}
                                >
                                    Cancel
                                </button>
                            )}
                            <button
                                onClick={sendFile}
                                disabled={!file || !isConnected || status === 'Sending...'}
                                style={{
                                    opacity: (!file || !isConnected || status === 'Sending...') ? 0.5 : 1,
                                    background: '#238636',
                                    borderColor: '#238636',
                                    color: 'white',
                                    padding: '0.8em 1.5em'
                                }}
                            >
                                {status === 'Sending...' ? 'Sending...' : 'Send File'}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default Sender;
