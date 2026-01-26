import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Sender from './components/Sender';
import Receiver from './components/Receiver';
import Clipboard from './components/Clipboard';
import { Share2, DownloadCloud, ArrowLeft, Clipboard as ClipboardIcon, Smartphone, Monitor, Zap, Share, Share2Icon, UploadCloud, Send, Download, Upload } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

function Landing() {
    return (
        <div className="w-full max-w-5xl mx-auto px-4">
            <div className="glass-panel p-8 mb-12 rounded-2xl text-center relative overflow-hidden animate-fade-in">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500"></div>
                <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white">Seamless Peer-to-Peer Sharing</h2>
                <p className="text-dim text-lg md:text-xl max-w-2xl mx-auto mb-8">
                    Transfer files of any size or sync your clipboard instantly across devices.
                    No clouds. No servers. Just direct connection.
                </p>
                <div className="flex flex-wrap justify-center gap-4 text-sm text-dim">
                    <span className="flex items-center gap-1"><Zap size={16} className="text-yellow-400" /> Instant Speed</span>
                    <span className="flex items-center gap-1"><Monitor size={16} className="text-blue-400" /> Cross-Platform</span>
                    <span className="flex items-center gap-1"><Smartphone size={16} className="text-emerald-400" /> Mobile Ready</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up">
                <Link to="/send" className="no-underline group">
                    <div className="glass-card h-full p-8 rounded-2xl flex flex-col items-center text-center cursor-pointer group-hover:border-blue-500/50 transition-colors">
                        <div className="p-4 bg-blue-500/10 rounded-full mb-6 group-hover:scale-110 transition-transform">
                            <Upload size={40} className="text-blue-400" />
                        </div>
                        <h3 className="text-xl font-bold mb-2 text-white">Send Files</h3>
                        <p className="text-dim text-sm">Transfer photos, videos, or documents to any device nearby.</p>
                    </div>
                </Link>

                <Link to="/receive" className="no-underline group">
                    <div className="glass-card h-full p-8 rounded-2xl flex flex-col items-center text-center cursor-pointer group-hover:border-emerald-500/50 transition-colors">
                        <div className="p-4 bg-emerald-500/10 rounded-full mb-6 group-hover:scale-110 transition-transform">
                            <Download size={40} className="text-emerald-400" />
                        </div>
                        <h3 className="text-xl font-bold mb-2 text-white">Receive Files</h3>
                        <p className="text-dim text-sm">Securely download shared files directly to your device.</p>
                    </div>
                </Link>

                <Link to="/clipboard" className="no-underline group">
                    <div className="glass-card h-full p-8 rounded-2xl flex flex-col items-center text-center cursor-pointer group-hover:border-purple-500/50 transition-colors">
                        <div className="p-4 bg-purple-500/10 rounded-full mb-6 group-hover:scale-110 transition-transform">
                            <ClipboardIcon size={40} className="text-purple-400" />
                        </div>
                        <h3 className="text-xl font-bold mb-2 text-white">Clipboard Sync</h3>
                        <p className="text-dim text-sm">Copy on one device, paste on another. Magic.</p>
                    </div>
                </Link>
            </div>
        </div>
    );
}

function Layout({ children }) {
    const location = useLocation();
    const isHome = location.pathname === '/';

    return (
        <div className="min-h-screen flex flex-col bg-bg-deep font-sans">
            <header className="py-6 px-4 mb-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 no-underline">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <Zap size={20} className="text-white fill-white" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-white">
                            Flash<span className="text-gradient">Stream</span>
                        </h1>
                    </Link>

                    {!isHome && (
                        <Link
                            to="/"
                            className="flex items-center gap-2 text-sm text-dim hover:text-white transition-colors px-4 py-2 rounded-full hover:bg-white/5"
                        >
                            <ArrowLeft size={16} /> <span className="hidden sm:inline">Back to Home</span>
                        </Link>
                    )}
                </div>
            </header>

            <main className="flex-1 w-full max-w-7xl mx-auto p-4 flex flex-col">
                {children}
            </main>

            <footer className="py-8 text-center text-dim text-sm">
                <p>© {new Date().getFullYear()} FlashStream. Secure P2P Encryption.</p>
            </footer>
        </div>
    );
}

function App() {
    return (
        <Router>
            <Layout>
                <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/send" element={<Sender />} />
                    <Route path="/receive" element={<Receiver />} />
                    <Route path="/clipboard" element={<Clipboard />} />
                </Routes>
            </Layout>
            <Toaster
                position="bottom-center"
                toastOptions={{
                    style: {
                        background: '#1e293b',
                        color: '#f8fafc',
                        border: '1px solid rgba(255,255,255,0.1)',
                    },
                }}
            />
        </Router>
    );
}

export default App;
