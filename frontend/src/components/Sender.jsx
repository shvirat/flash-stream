import React, { useState, useEffect, useRef } from 'react';
import { P2PClient } from '../utils/peerClient';
import { Copy, Check, File, UploadCloud, Loader2, RefreshCw, X, ArrowRight } from 'lucide-react';
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
        let savedId = localStorage.getItem('senderId');
        if (savedId && savedId.length > 8) savedId = null;

        client.onStatus = (msg) => {
            setStatus(msg);
            if (msg === 'Connected') {
                setIsConnected(true);
                toast.success('Receiver Connected!');
            }
            if (msg === 'File Sent!') {
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
            localStorage.setItem('senderId', id);
            setStatus('Waiting for connection...');
        }).catch((err) => {
            console.error('Init failed:', err);
            toast.error(`Failed: ${err.type || 'Connection Error'}`);
        });

        const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
        const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
        const handleDrop = (e) => { e.preventDefault(); setIsDragging(false); };

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

    const generateNewId = () => {
        if (isConnected) {
            toast.error('Cannot change ID while connected');
            return;
        }

        if (clientRef.current.peer) clientRef.current.destroy();
        setPeerId('');
        localStorage.removeItem('senderId');

        clientRef.current = new P2PClient();
        const client = clientRef.current;

        client.onStatus = (msg) => {
            setStatus(msg);
            if (msg === 'Connected') { setIsConnected(true); toast.success('Receiver Connected!'); }
            if (msg === 'File Sent!') toast.success('File Sent Successfully!');
            if (msg === 'Disconnected' || msg.startsWith('Error')) { setIsConnected(false); toast.error(msg); }
        };
        client.onProgress = (p) => setProgress(p);

        client.init(true, null, 1).then((id) => {
            setPeerId(id);
            localStorage.setItem('senderId', id);
            setStatus('Waiting for connection...');
            toast.success('New ID Generated');
        }).catch((err) => {
            console.error('Init failed:', err);
            toast.error(`Failed: ${err.type || 'Connection Error'}`);
        });
    };

    const handleFileChange = (e) => {
        if (e.target.files?.[0]) setFile(e.target.files[0]);
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

        const originalStatus = clientRef.current.onStatus;
        clientRef.current.onStatus = (msg) => {
            if (msg === 'File Sent!' || msg.includes('Error')) toast.dismiss(toastId);
            originalStatus(msg);
        };
        clientRef.current.sendFile(file);
    };

    const cancelTransfer = () => {
        clientRef.current.cancelTransfer();
        toast.dismiss();
        toast.error('Transfer Cancelled');
        setStatus('Cancelled');
        setProgress(0);
    };

    return (
        <div className="w-full max-w-2xl mx-auto px-4">
            <div className="glass-panel p-6 sm:p-8 rounded-2xl animate-fade-in relative overflow-hidden">
                {/* Decorative Glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -z-10 -translate-y-1/2 translate-x-1/2"></div>

                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-blue-500/20 rounded-xl">
                        <UploadCloud size={24} className="text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">Send File</h2>
                        <p className="text-dim text-sm">Share securely with a peer</p>
                    </div>
                </div>

                {!peerId ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-4 text-dim">
                        <Loader2 className="animate-spin text-blue-500" size={48} />
                        <span className="font-medium animate-pulse">Generating Secure ID...</span>
                    </div>
                ) : (
                    <>
                        <div className="mb-8">
                            <label className="text-xs text-blue-300 font-bold uppercase tracking-wider mb-2 block">
                                Your Session ID
                            </label>
                            <div className="glass-card p-2 rounded-xl flex items-center gap-2 border border-blue-500/30 bg-blue-500/5">
                                <div className="flex-1 font-mono text-xl sm:text-2xl text-center text-blue-400 font-bold tracking-widest py-2 select-all">
                                    {peerId}
                                </div>
                                <div className="flex flex-col sm:flex-row gap-1">
                                    <button
                                        onClick={copyToClipboard}
                                        className="p-3 hover:bg-blue-500/20 rounded-lg text-blue-300 transition-colors"
                                        title="Copy ID"
                                    >
                                        {copied ? <Check size={20} /> : <Copy size={20} />}
                                    </button>
                                    <button
                                        onClick={generateNewId}
                                        disabled={isConnected}
                                        className="p-3 hover:bg-blue-500/20 rounded-lg text-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Generate New ID"
                                    >
                                        <RefreshCw size={20} />
                                    </button>
                                </div>
                            </div>
                            <p className="text-center text-xs text-dim mt-2">
                                Share this code with the receiver to connect.
                            </p>
                        </div>

                        <div
                            onDrop={handleDropZone}
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                            className={clsx(
                                "border-2 border-dashed rounded-2xl transition-all duration-300 text-center cursor-pointer relative group",
                                isDragging
                                    ? "border-blue-400 bg-blue-500/10 scale-[1.02]"
                                    : "border-white/10 hover:border-blue-500/50 hover:bg-white/5"
                            )}
                        >
                            <input
                                type="file"
                                onChange={handleFileChange}
                                className="hidden"
                                id="file-input"
                            />
                            <label htmlFor="file-input" className="block p-8 sm:p-12 cursor-pointer w-full h-full">
                                {file ? (
                                    <div className="animate-slide-up">
                                        <div className="w-16 h-16 mx-auto mb-4 bg-blue-500/20 rounded-full flex items-center justify-center">
                                            <File size={32} className="text-blue-400" />
                                        </div>
                                        <h3 className="text-lg font-bold text-white mb-1 truncate max-w-full px-4">{file.name}</h3>
                                        <p className="text-dim font-mono text-sm mb-4">
                                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                                        </p>
                                        <span className="text-xs text-blue-300 uppercase tracking-widest font-bold border border-blue-500/30 px-3 py-1 rounded-full">
                                            Ready to Send
                                        </span>
                                    </div>
                                ) : (
                                    <div className="group-hover:-translate-y-1 transition-transform duration-300">
                                        <div className={clsx("w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center transition-colors", isDragging ? "bg-blue-500/20" : "bg-white/5")}>
                                            <UploadCloud size={32} className={clsx("transition-colors", isDragging ? "text-blue-400" : "text-dim group-hover:text-blue-400")} />
                                        </div>
                                        <h3 className="text-lg font-bold text-white mb-2">
                                            {isDragging ? 'Drop it here!' : 'Choose a file'}
                                        </h3>
                                        <p className="text-dim text-sm max-w-xs mx-auto">
                                            Drag & drop your file here, or click to browse.
                                        </p>
                                    </div>
                                )}
                            </label>
                        </div>

                        {progress > 0 && (
                            <div className="mt-8 animate-fade-in">
                                <div className="flex justify-between mb-2 text-sm font-medium">
                                    <span className={clsx("transition-colors", progress === 100 ? "text-emerald-400" : "text-blue-300")}>
                                        {progress === 100 ? 'File Sent!' : 'Transferring...'}
                                    </span>
                                    <span className="text-white font-mono">{progress}%</span>
                                </div>
                                <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                    <div
                                        className="h-full bg-linear-to-r from-blue-500 to-purple-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                                        style={{ width: `${progress}%`, transition: 'width 0.2s linear' }}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="flex items-center gap-3 bg-black/20 px-4 py-2 rounded-lg w-full sm:w-auto justify-center sm:justify-start">
                                <span
                                    className={clsx("w-2.5 h-2.5 rounded-full animate-pulse", {
                                        'bg-emerald-500 shadow-[0_0_8px_#10b981]': status === 'Connected',
                                        'bg-red-500': status.includes('Error'),
                                        'bg-yellow-500': !status.includes('Error') && status !== 'Connected'
                                    })}
                                />
                                <span className="text-sm font-medium text-dim">{status}</span>
                            </div>

                            <div className="flex gap-3 w-full sm:w-auto">
                                {status === 'Sending...' && (
                                    <button
                                        onClick={cancelTransfer}
                                        className="flex-1 sm:flex-none px-6 py-3 rounded-xl font-bold bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all"
                                    >
                                        Cancel
                                    </button>
                                )}
                                <button
                                    onClick={sendFile}
                                    disabled={!file || !isConnected || status === 'Sending...'}
                                    className={clsx(
                                        "flex-1 sm:flex-none px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all",
                                        (!file || !isConnected || status === 'Sending...')
                                            ? "bg-white/5 text-dim cursor-not-allowed"
                                            : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg hover:shadow-blue-500/25 active:scale-95"
                                    )}
                                >
                                    {status === 'Sending...' ? <Loader2 className="animate-spin" size={20} /> : <ArrowRight size={20} />}
                                    {status === 'Sending...' ? 'Sending...' : 'Send Now'}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default Sender;
