import React, { useState, useEffect, useRef } from 'react';
import { P2PClient } from '../utils/peerClient';
import { Copy, Clipboard as ClipboardIcon, Link, Check, ArrowRight, Users, Monitor, Radio, X, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

function PeerList({ peers, mode }) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) setIsOpen(false);
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (peers.length === 0) return <span className="text-dim text-xs">Waiting for peers...</span>;
    if (mode === 'client' || mode === 'bidirectional') return <span className="text-emerald-400 text-xs font-medium bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">Connected</span>;

    return (
        <div ref={menuRef} className="relative inline-block">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
            >
                <span>{peers.length} Peer{peers.length !== 1 ? 's' : ''} Connected</span>
                {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>

            {isOpen && (
                <div className="absolute bottom-full right-0 mb-2 p-3 min-w-40 glass-card rounded-xl shadow-xl z-20 animate-fade-in border border-white/10">
                    <div className="text-xs font-bold text-dim uppercase tracking-wider mb-2 pb-2 border-b border-white/10">
                        Connected Peers
                    </div>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                        {peers.map((peer, idx) => (
                            <div key={idx} className="px-2 py-1.5 bg-white/5 rounded-lg font-mono text-xs text-blue-300">
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

    const textRef = useRef('');
    const clientRef = useRef(new P2PClient());

    useEffect(() => {
        const client = clientRef.current;
        const isHost = mode === 'host';

        client.onStatus = (msg) => {
            setStatus(msg);
            setPeers(client.connections.map(c => c.peer));
        };

        client.onTextReceived = (newText) => {
            if (!isHost) {
                setText(newText);
                textRef.current = newText;
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

        return () => client.destroy();
    }, []);

    const handleConnect = () => {
        if (!connectId) return;
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

    const accentColor = mode === 'host' ? 'purple' : (mode === 'client' ? 'emerald' : 'blue');

    return (
        <div className={clsx("animate-fade-in", visible ? "block" : "hidden")}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {mode !== 'client' && (
                    <div className="glass-card p-4 rounded-xl border border-white/10 bg-white/5">
                        <label className={`text-xs text-${accentColor}-300 font-bold uppercase tracking-wider mb-2 block`}>
                            {mode === 'host' ? 'Host Code' : 'Your ID'}
                        </label>
                        <div className="flex gap-2">
                            <code className={`flex-1 text-lg font-mono p-2 bg-black/30 rounded-lg text-${accentColor}-400`}>
                                {myId || '...'}
                            </code>
                            <button onClick={copyId} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-dim hover:text-white">
                                {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                            </button>
                        </div>
                    </div>
                )}

                {mode !== 'host' && (
                    <div className="glass-card p-4 rounded-xl border border-white/10 bg-white/5">
                        <label className={`text-xs text-${accentColor}-300 font-bold uppercase tracking-wider mb-2 block`}>
                            {mode === 'client' ? 'Enter Host Code' : 'Connect to Peer'}
                        </label>
                        <div className="flex gap-2">
                            <input
                                value={connectId}
                                onChange={(e) => setConnectId(e.target.value.toUpperCase())}
                                placeholder="PASTE CODE"
                                maxLength={6}
                                className="flex-1 min-w-0 bg-black/30 border border-white/10 rounded-lg px-3 py-2 font-mono uppercase text-white placeholder-white/20 focus:border-white/30 outline-none"
                                onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
                            />
                            <button
                                onClick={handleConnect}
                                className={`p-2 rounded-lg transition-colors bg-${accentColor}-500 hover:bg-${accentColor}-400 text-white shadow-lg`}
                            >
                                <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="relative group">
                {mode === 'client' && (
                    <div className="absolute top-8 left-0 right-0 h-1 bg-emerald-500/50 z-10 animate-pulse"></div>
                )}
                <div className="absolute -inset-0.5 bg-linear-to-r from-blue-500 to-purple-500 rounded-2xl opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
                <div className="relative bg-bg-surface rounded-xl overflow-hidden border border-white/10">
                    <div className="bg-black/40 px-4 py-2 flex items-center justify-between border-b border-white/5">
                        <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                        </div>
                        <span className="text-xs text-dim font-mono uppercase tracking-widest">
                            {mode === 'client' ? 'READ ONLY' : 'EDITOR'}
                        </span>
                        <button
                            onClick={copyContent}
                            className="text-xs flex items-center gap-1 text-dim hover:text-white transition-colors"
                        >
                            <Copy size={12} /> COPY
                        </button>
                    </div>
                    <textarea
                        value={text}
                        onChange={handleTextChange}
                        readOnly={mode === 'client'}
                        placeholder={mode === 'client' ? "Waiting for host updates..." : "Type or paste here to sync instantly..."}
                        className="w-full h-64 sm:h-80 bg-transparent p-4 font-mono text-sm sm:text-base text-gray-300 focus:outline-none resize-none"
                        spellCheck={false}
                    />
                </div>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-sm">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
                    <span
                        className={clsx("w-2 h-2 rounded-full", {
                            'bg-emerald-500 shadow-[0_0_8px_#10b981]': status === 'Ready' || status.includes('Connected'),
                            'bg-yellow-500': status === 'Initializing...' || status === 'Connecting...',
                            'bg-red-500': status.includes('Error') || status === 'Disconnected'
                        })}
                    />
                    <span className="text-dim text-xs font-medium uppercase tracking-wide">{status}</span>
                </div>

                <PeerList peers={peers} mode={mode} />
            </div>
        </div>
    );
}

function Clipboard() {
    const [activeMode, setActiveMode] = useState('bidirectional');

    const getModeStyles = () => {
        switch (activeMode) {
            case 'host': return { color: 'text-purple-400', bg: 'bg-purple-500/20', glow: 'bg-purple-500/10', border: 'border-purple-500/30' };
            case 'client': return { color: 'text-emerald-400', bg: 'bg-emerald-500/20', glow: 'bg-emerald-500/10', border: 'border-emerald-500/30' };
            default: return { color: 'text-blue-400', bg: 'bg-blue-500/20', glow: 'bg-blue-500/10', border: 'border-blue-500/30' };
        }
    };

    const styles = getModeStyles();

    return (
        <div className="w-full max-w-4xl mx-auto px-4">
            <div className={clsx("glass-panel p-6 sm:p-8 rounded-2xl animate-fade-in relative overflow-hidden transition-colors duration-500", styles.border)}>
                {/* Decorative Glow */}
                <div className={clsx("absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl -z-10 -translate-y-1/2 translate-x-1/2 transition-colors duration-500", styles.glow)}></div>

                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-3">
                        <div className={clsx("p-3 rounded-xl transition-colors duration-300", styles.bg)}>
                            <ClipboardIcon size={24} className={clsx("transition-colors duration-300", styles.color)} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Shared Clipboard</h2>
                            <p className="text-dim text-sm">Sync text across devices instantly</p>
                        </div>
                    </div>

                    <div className="flex p-1 rounded-xl bg-black/40 border border-white/10 w-full justify-between md:w-auto overflow-x-auto touch-scroll-hide">
                        {[
                            { id: 'bidirectional', label: 'Peer-to-Peer', activeClass: 'bg-blue-600' },
                            { id: 'host', label: 'Host Mode', activeClass: 'bg-purple-600' },
                            { id: 'client', label: 'Client Mode', activeClass: 'bg-emerald-600' }
                        ].map((mode) => (
                            <button
                                key={mode.id}
                                onClick={() => setActiveMode(mode.id)}
                                className={clsx(
                                    "px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                                    activeMode === mode.id
                                        ? clsx("text-white shadow-lg", mode.activeClass)
                                        : "text-dim hover:text-white hover:bg-white/5"
                                )}
                            >
                                {mode.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="transition-opacity duration-300">
                    <ClipboardSession mode="bidirectional" visible={activeMode === 'bidirectional'} />
                    <ClipboardSession mode="host" visible={activeMode === 'host'} />
                    <ClipboardSession mode="client" visible={activeMode === 'client'} />
                </div>
            </div>
        </div>
    );
}

export default Clipboard;
