import React, { useState, useEffect, useRef } from 'react';
import { P2PClient } from '../utils/peerClient';
import { Copy, Clipboard as ClipboardIcon, Link, Check, ArrowRight, Users, Monitor, Radio, X, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';

function PeerList({ peers, mode }) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    if (peers.length === 0) return <span>No Peers</span>;

    // Client/Bidirectional Mode: Just show the partner ID
    if (mode === 'client' || mode === 'bidirectional') {
        return <span>Connected to: {peers[0]}</span>;
    }

    // Host/Bidirectional: Show collapsible menu
    return (
        <div ref={menuRef} style={{ position: 'relative', display: 'inline-block' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-dim)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.9rem',
                    padding: 0
                }}
            >
                <span>{peers.length} Peer{peers.length !== 1 ? 's' : ''} Connected</span>
                {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    bottom: '120%',
                    right: 0,
                    background: '#161b22',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '0.5rem',
                    minWidth: '150px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                    zIndex: 10
                }}>
                    <div style={{ padding: '0.5rem', borderBottom: '1px solid #30363d', fontWeight: '600', marginBottom: '0.5rem' }}>
                        Connected Peers
                    </div>
                    <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        {peers.map((peer, idx) => (
                            <div key={idx} style={{
                                padding: '0.3rem 0.5rem',
                                background: '#0d1117',
                                borderRadius: '4px',
                                fontSize: '0.85rem',
                                color: '#58a6ff',
                                fontFamily: 'monospace'
                            }}>
                                {peer}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function ClipboardSession({ mode, visible }) {
    const [myId, setMyId] = useState('');
    const [connectId, setConnectId] = useState('');
    const [status, setStatus] = useState('Initializing...');
    const [text, setText] = useState('');
    const [peers, setPeers] = useState([]);
    const [copied, setCopied] = useState(false);

    // Stable Refs
    const textRef = useRef('');
    const clientRef = useRef(new P2PClient());

    useEffect(() => {
        const client = clientRef.current;

        // Mode-Specific Logic Wrapper
        const isHost = mode === 'host';
        const isClient = mode === 'client';

        client.onStatus = (msg) => {
            setStatus(msg);
            setPeers(client.connections.map(c => c.peer));
        };

        client.onTextReceived = (newText) => {
            if (!isHost) {
                setText(newText);
                textRef.current = newText;
                if (visible) {
                    //   toast.success('Clipboard Updated'); 
                }
            }
        };

        client.onPeerJoin = (conn) => {
            if (isHost && textRef.current) {
                conn.send({ type: 'text', text: textRef.current });
                if (visible) toast.success('Synced new peer');
            }
        };

        client.init(true, null, mode === 'bidirectional' ? 1 : Infinity).then((id) => {
            setMyId(id);
            setStatus('Ready');
        });

        // No cleanup on unmount/invisible effectively, 
        // but we do want to cleanup if the component truly unmounts (app navigation)
        return () => {
            client.destroy();
        };
    }, []); // Run once on mount

    const handleConnect = () => {
        if (!connectId) return;

        // In Client Mode, ensure we only connect to ONE host at a time
        if (mode === 'client') {
            clientRef.current.connections.forEach(c => c.close());
            clientRef.current.connections = [];
        }

        setStatus('Connecting...');
        clientRef.current.connect(connectId);
    };

    const handleTextChange = (e) => {
        const newText = e.target.value;
        setText(newText);
        textRef.current = newText;

        // Broadcast
        clientRef.current.sendText(newText);
    };

    const copyId = async () => {
        await navigator.clipboard.writeText(myId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success('ID Copied');
    };

    const copyContent = async () => {
        await navigator.clipboard.writeText(text);
        toast.success('Content Copied');
    };

    // Styling based on mode
    const borderColor = mode === 'host' ? '#a371f7' : (mode === 'client' ? '#238636' : '#58a6ff');
    const bgTint = mode === 'host' ? 'rgba(163, 113, 247, 0.03)' : (mode === 'client' ? 'rgba(35, 134, 54, 0.03)' : 'rgba(88, 166, 255, 0.03)');

    return (
        <div style={{ display: visible ? 'block' : 'none' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>

                {mode !== 'client' && (
                    <div style={{ background: '#0d1117', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'block', marginBottom: '0.5rem' }}>
                            {mode === 'host' ? 'HOST ROOM CODE' : 'YOUR ID'}
                        </label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <code style={{ flex: 1, color: borderColor, fontSize: '1.1rem' }}>{myId || '...'}</code>
                            <button onClick={copyId} style={{ padding: '0.2rem 0.5rem', height: 'auto' }}>
                                {copied ? <Check size={16} /> : <Copy size={16} />}
                            </button>
                        </div>
                    </div>
                )}

                {mode !== 'host' && (
                    <div style={{ background: '#0d1117', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'block', marginBottom: '0.5rem' }}>
                            {mode === 'client' ? 'ENTER HOST CODE' : 'CONNECT TO PARTNER'}
                        </label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                value={connectId}
                                onChange={(e) => setConnectId(e.target.value.toUpperCase())}
                                placeholder="Paste ID here"
                                maxLength={6}
                                style={{ flex: 1, background: 'transparent', border: 'none', borderBottom: '1px solid #30363d', borderRadius: 0, padding: '0 0 0.5rem 0', fontFamily: 'monospace', textTransform: 'uppercase' }}
                                onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
                            />
                            <button
                                onClick={handleConnect}
                                style={{ padding: '0.2rem 0.5rem', height: 'auto', background: '#58a6ff', borderColor: 'transparent' }}
                            >
                                <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div style={{ position: 'relative' }}>
                {mode === 'client' && (
                    <div style={{
                        position: 'absolute', top: '-25px', left: 0,
                        fontSize: '0.8rem', color: 'var(--text-dim)',
                        display: 'flex', alignItems: 'center', gap: '0.5rem'
                    }}>
                        <Monitor size={14} /> Read-Only View
                    </div>
                )}
                <textarea
                    value={text}
                    onChange={handleTextChange}
                    readOnly={mode === 'client'}
                    placeholder={mode === 'client' ? "Waiting for host updates..." : "Type or paste here to sync instantly..."}
                    style={{
                        width: '100%',
                        minHeight: '300px',
                        background: '#0d1117',
                        borderColor: borderColor,
                        backgroundColor: bgTint,
                        borderRadius: '8px',
                        padding: '1.5rem',
                        fontSize: '1.1rem',
                        fontFamily: 'monospace',
                        color: mode === 'client' ? '#8b949e' : '#c9d1d9',
                        resize: 'vertical',
                        lineHeight: '1.6',
                        borderWidth: '1px',
                        transition: 'all 0.3s ease'
                    }}
                />
                <button
                    onClick={copyContent}
                    style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        background: 'rgba(56, 139, 253, 0.15)',
                        color: '#58a6ff',
                        border: '1px solid rgba(56, 139, 253, 0.4)',
                        backdropFilter: 'blur(4px)'
                    }}
                >
                    <Copy size={16} style={{ marginRight: '0.5rem' }} /> Copy
                </button>
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-dim)' }}>
                <span>{status}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users size={16} />
                    <PeerList peers={peers} mode={mode} />
                </div>
            </div>
        </div>
    );
}

function Clipboard() {
    const [activeMode, setActiveMode] = useState('bidirectional');

    return (
        <div className="card" style={{ maxWidth: '800px' }}>
            <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ClipboardIcon size={24} color="#a371f7" />
                Shared Clipboard
            </h2>

            {/* Mode Switcher */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', padding: '0.5rem', background: '#0d1117', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <button
                    onClick={() => setActiveMode('bidirectional')}
                    style={{ flex: 1, background: activeMode === 'bidirectional' ? '#21262d' : 'transparent', border: 'none', color: activeMode === 'bidirectional' ? '#58a6ff' : 'var(--text-dim)' }}
                >
                    Bidirectional
                </button>
                <button
                    onClick={() => setActiveMode('host')}
                    style={{ flex: 1, background: activeMode === 'host' ? '#21262d' : 'transparent', border: 'none', color: activeMode === 'host' ? '#a371f7' : 'var(--text-dim)' }}
                >
                    Host Mode
                </button>
                <button
                    onClick={() => setActiveMode('client')}
                    style={{ flex: 1, background: activeMode === 'client' ? '#21262d' : 'transparent', border: 'none', color: activeMode === 'client' ? '#238636' : 'var(--text-dim)' }}
                >
                    Client Mode
                </button>
            </div>

            <ClipboardSession mode="bidirectional" visible={activeMode === 'bidirectional'} />
            <ClipboardSession mode="host" visible={activeMode === 'host'} />
            <ClipboardSession mode="client" visible={activeMode === 'client'} />
        </div>
    );
}

export default Clipboard;
