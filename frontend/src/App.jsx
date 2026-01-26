import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Sender from './components/Sender';
import Logo from './assets/logo.svg';
import Receiver from './components/Receiver';
import Clipboard from './components/Clipboard';
import { Features, HowItWorks, DownloadApp, PrivacyPolicy, TermsOfService, FAQ, Support, About } from './components/InfoPages';
import { Share2, DownloadCloud, ArrowLeft, Clipboard as ClipboardIcon, Smartphone, Monitor, Zap, Share, Share2Icon, UploadCloud, Send, Download, Upload, Github, Twitter, Heart } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeIn, slideUp, containerStagger, hoverScale, scaleIn } from './utils/animations';

function Landing() {
    return (
        <div className="w-full max-w-5xl mx-auto px-4">
            <motion.div
                initial="hidden"
                animate="visible"
                variants={slideUp}
                className="glass-panel p-8 mb-12 rounded-2xl text-center relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-blue-500 via-purple-500 to-emerald-500"></div>
                <motion.h2 variants={fadeIn} className="text-3xl md:text-5xl font-bold mb-4 text-white">Seamless Peer-to-Peer Sharing</motion.h2>
                <motion.p variants={fadeIn} className="text-dim text-lg md:text-xl max-w-2xl mx-auto mb-8">
                    Transfer files of any size or sync your clipboard instantly across devices.
                    No clouds. No servers. Just direct connection.
                </motion.p>
                <motion.div
                    variants={containerStagger}
                    initial="hidden"
                    animate="visible"
                    className="flex flex-wrap justify-center gap-4 text-sm text-dim"
                >
                    <motion.div variants={slideUp} className="flex items-center gap-1"><Zap size={16} className="text-yellow-400" /> Instant Speed</motion.div>
                    <motion.div variants={slideUp} className="flex items-center gap-1"><Monitor size={16} className="text-blue-400" /> Cross-Platform</motion.div>
                    <motion.div variants={slideUp} className="flex items-center gap-1"><Smartphone size={16} className="text-emerald-400" /> Mobile Ready</motion.div>
                </motion.div>
            </motion.div>

            <motion.div
                variants={containerStagger}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
                <Link to="/send" className="no-underline group">
                    <motion.div variants={scaleIn} whileHover={hoverScale} className="glass-card h-full p-8 rounded-2xl flex flex-col items-center text-center cursor-pointer group-hover:border-blue-500/50">
                        <div className="p-4 bg-blue-500/10 rounded-full mb-6">
                            <Upload size={40} className="text-blue-400" />
                        </div>
                        <h3 className="text-xl font-bold mb-2 text-white">Send Files</h3>
                        <p className="text-dim text-sm">Transfer photos, videos, or documents to any device nearby.</p>
                    </motion.div>
                </Link>

                <Link to="/receive" className="no-underline group">
                    <motion.div variants={scaleIn} whileHover={hoverScale} className="glass-card h-full p-8 rounded-2xl flex flex-col items-center text-center cursor-pointer group-hover:border-emerald-500/50">
                        <div className="p-4 bg-emerald-500/10 rounded-full mb-6">
                            <Download size={40} className="text-emerald-400" />
                        </div>
                        <h3 className="text-xl font-bold mb-2 text-white">Receive Files</h3>
                        <p className="text-dim text-sm">Securely download shared files directly to your device.</p>
                    </motion.div>
                </Link>

                <Link to="/clipboard" className="no-underline group">
                    <motion.div variants={scaleIn} whileHover={hoverScale} className="glass-card h-full p-8 rounded-2xl flex flex-col items-center text-center cursor-pointer group-hover:border-purple-500/50">
                        <div className="p-4 bg-purple-500/10 rounded-full mb-6">
                            <ClipboardIcon size={40} className="text-purple-400" />
                        </div>
                        <h3 className="text-xl font-bold mb-2 text-white">Clipboard Sync</h3>
                        <p className="text-dim text-sm">Copy on one device, paste on another. Magic.</p>
                    </motion.div>
                </Link>
            </motion.div>
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
                        <img src={Logo} alt="FlashStream Logo" className="w-10 h-10 object-contain hover:scale-110 transition-transform" />
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

            <footer className="border-t border-white/10 bg-black/20 mt-24">
                <div className="max-w-7xl mx-auto px-6 md:px-12  py-12">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-16 mb-8">
                        <div>
                            <h4 className="font-bold text-white mb-3">Product</h4>
                            <ul className="space-y-1 text-sm text-dim">
                                <li><Link to="/features" className="hover:text-blue-400 transition-colors">Features</Link></li>
                                <li><Link to="/how-it-works" className="hover:text-blue-400 transition-colors">How it Works</Link></li>
                                <li><Link to="/downloadapp" className="hover:text-blue-400 transition-colors">Download</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-white mb-3">Support</h4>
                            <ul className="space-y-1 text-sm text-dim">
                                <li><Link to="/faq" className="hover:text-blue-400 transition-colors">FAQ</Link></li>
                                <li><Link to="/support" className="hover:text-blue-400 transition-colors">Contact Us</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-white mb-3">Legal</h4>
                            <ul className="space-y-1 text-sm text-dim">
                                <li><Link to="/privacy" className="hover:text-blue-400 transition-colors">Privacy Policy</Link></li>
                                <li><Link to="/terms" className="hover:text-blue-400 transition-colors">Terms of Service</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-white mb-3">Company</h4>
                            <ul className="space-y-1 text-sm text-dim">
                                <li><Link to="/about" className="hover:text-blue-400 transition-colors">About Us</Link></li>
                                <li><a href="https://github.com/shvirat" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors flex items-center gap-1"><Github size={14} /> GitHub</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-dim">
                        <p>© {new Date().getFullYear()} FlashStream. Secure P2P Encryption.</p>
                        <p className="flex items-center gap-1">Made with <Heart size={12} className="text-red-500 fill-red-500" /> for the web.</p>
                    </div>
                </div>
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

                    {/* Info Pages */}
                    <Route path="/features" element={<Features />} />
                    <Route path="/how-it-works" element={<HowItWorks />} />
                    <Route path="/downloadapp" element={<DownloadApp />} />
                    <Route path="/privacy" element={<PrivacyPolicy />} />
                    <Route path="/terms" element={<TermsOfService />} />
                    <Route path="/faq" element={<FAQ />} />
                    <Route path="/support" element={<Support />} />
                    <Route path="/about" element={<About />} />
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
