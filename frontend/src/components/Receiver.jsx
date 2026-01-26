import React, { useState, useEffect, useRef } from 'react';
import { P2PClient } from '../utils/peerClient';
import { Download, Link, FileCheck, Loader2, ArrowRight, ShieldCheck, DownloadCloud } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

function Receiver() {
    const [targetId, setTargetId] = useState(() => {
        const saved = localStorage.getItem('lastTargetId');
        const timestamp = localStorage.getItem('lastTargetIdTime');
        const EXPIRATION = 30 * 60 * 1000;

        if (saved && timestamp && (Date.now() - parseInt(timestamp) < EXPIRATION)) {
            return saved;
        }
        return '';
    });
    const [status, setStatus] = useState('Ready to connect');
    const [progress, setProgress] = useState(0);
    const [isConnected, setIsConnected] = useState(false);

    const clientRef = useRef(null);

    useEffect(() => {
        if (!clientRef.current) clientRef.current = new P2PClient();
        const client = clientRef.current;
        client.onStatus = (msg) => {
            setStatus(msg);
            if (msg === 'Connected') { setIsConnected(true); toast.success('Connected to Sender!'); }
            if (msg === 'Disconnected') { setIsConnected(false); toast('Disconnected'); }
            if (msg.includes('Error')) toast.error(msg);
        };
        client.onProgress = (p) => setProgress(p);
        client.onFileReceived = (blob, name) => {
            const shortName = name.length > 20 ? name.substring(0, 15) + '...' + name.substring(name.lastIndexOf('.')) : name;
            toast.success(`Received ${shortName}!`);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = name;
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
            URL.revokeObjectURL(url);
        };
        client.init(false, null, 1);
        return () => { if (client.peer) client.peer.destroy(); };
    }, []);

    const handleConnect = () => {
        if (!targetId) { toast.error('Please enter a Sender ID'); return; }
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
        <div className="w-full max-w-2xl mx-auto px-4">
            <div className="glass-panel p-6 sm:p-8 rounded-2xl animate-fade-in relative overflow-hidden">
                {/* Decorative Glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -z-10 -translate-y-1/2 translate-x-1/2"></div>

                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-emerald-500/20 rounded-xl">
                        <DownloadCloud size={24} className="text-emerald-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">Receive File</h2>
                        <p className="text-dim text-sm">Download securely from a peer</p>
                    </div>
                </div>

                <div className="mb-8">
                    <label className="text-xs text-emerald-300 font-bold uppercase tracking-wider mb-2 block">
                        Enter Sender ID
                    </label>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="text"
                            value={targetId}
                            onChange={(e) => setTargetId(e.target.value.toUpperCase())}
                            placeholder="e.g. X7K2M9"
                            maxLength={6}
                            className="flex-1 bg-black/30 border border-white/10 rounded-xl px-6 py-4 text-2xl font-mono uppercase text-center sm:text-left text-white placeholder-white/20 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all tracking-widest"
                            disabled={isConnected}
                            onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
                        />
                        <button
                            onClick={handleConnect}
                            disabled={isConnected || !targetId}
                            className={clsx(
                                "px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all min-w-35cone",
                                isConnected || !targetId
                                    ? "bg-white/5 text-dim cursor-not-allowed"
                                    : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg hover:shadow-emerald-500/25 active:scale-95"
                            )}
                        >
                            {isConnected ? <ShieldCheck size={20} /> : status === 'Connecting...' ? <Loader2 className="animate-spin" size={20} /> : <Link size={20} />}
                            {isConnected ? 'Linked' : status === 'Connecting...' ? 'Joining' : 'Connect'}
                        </button>
                    </div>
                    <p className="text-xs text-dim mt-3 ml-1">
                        Enter the unique 6-character code from the sender's screen.
                    </p>
                </div>

                {progress > 0 && (
                    <div className="mt-8 animate-fade-in p-6 bg-black/20 rounded-xl border border-white/5">
                        <div className="flex justify-between items-center mb-4 text-sm font-medium">
                            <span className={clsx("flex items-center gap-2", progress === 100 ? "text-emerald-400" : "text-emerald-300")}>
                                {progress < 100 && <Loader2 size={16} className="animate-spin" />}
                                {progress === 100 ? 'Download Complete' : 'Downloading...'}
                            </span>
                            <div className="flex items-center gap-4">
                                <span className="text-white font-mono text-lg">{progress}%</span>
                                {progress < 100 && (
                                    <button
                                        onClick={cancelDownload}
                                        className="text-xs text-red-400 hover:text-red-300 underline"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
                            <div
                                className="h-full bg-linear-to-r from-emerald-500 to-teal-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                                style={{ width: `${progress}%`, transition: 'width 0.2s linear' }}
                            />
                        </div>
                    </div>
                )}

                <div className="mt-6 flex items-center justify-center gap-2 text-sm text-dim">
                    <span
                        className={clsx("w-2 h-2 rounded-full", {
                            'bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse': isConnected,
                            'bg-white/20': !isConnected && !status.includes('Error'),
                            'bg-red-500': status.includes('Error')
                        })}
                    />
                    <span>{status}</span>
                </div>
            </div>
        </div>
    );
}

export default Receiver;
