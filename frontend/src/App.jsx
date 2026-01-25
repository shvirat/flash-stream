import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Sender from './components/Sender';
import Receiver from './components/Receiver';
import Clipboard from './components/Clipboard';
import { Share2, DownloadCloud, ArrowLeft, Github, Clipboard as ClipboardIcon } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

function Landing() {
    return (
        <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', marginTop: '3rem', flexWrap: 'wrap' }}>
            <Link to="/send" style={{ textDecoration: 'none' }}>
                <button
                    className="mode-card"
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        padding: '3rem',
                        minWidth: '200px',
                        gap: '1rem',
                        cursor: 'pointer'
                    }}
                >
                    <Share2 size={48} color="#58a6ff" />
                    <span style={{ fontSize: '1.2rem', fontWeight: '600' }}>Send a File</span>
                </button>
            </Link>

            <Link to="/receive" style={{ textDecoration: 'none' }}>
                <button
                    className="mode-card"
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        padding: '3rem',
                        minWidth: '200px',
                        gap: '1rem',
                        cursor: 'pointer'
                    }}
                >
                    <DownloadCloud size={48} color="#238636" />
                    <span style={{ fontSize: '1.2rem', fontWeight: '600' }}>Receive a File</span>
                </button>
            </Link>

            <Link to="/clipboard" style={{ textDecoration: 'none' }}>
                <button
                    className="mode-card"
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        padding: '3rem',
                        minWidth: '200px',
                        gap: '1rem',
                        cursor: 'pointer'
                    }}
                >
                    <ClipboardIcon size={48} color="#a371f7" />
                    <span style={{ fontSize: '1.2rem', fontWeight: '600' }}>Shared Clipboard</span>
                </button>
            </Link>
        </div>
    );
}

function Layout({ children }) {
    const location = useLocation();
    const isHome = location.pathname === '/';

    return (
        <div className="container">
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: '800', background: 'linear-gradient(to right, #58a6ff, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.5rem' }}>
                    FlashStream
                </h1>
                <p style={{ color: 'var(--text-dim)' }}>Peer-to-Peer file transfer. No limits. No servers.</p>
            </header>

            {!isHome && (
                <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'left' }}>
                    <Link
                        to="/"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            marginBottom: '1rem',
                            color: 'var(--text-dim)',
                            textDecoration: 'none',
                            fontSize: '0.9rem'
                        }}
                    >
                        <ArrowLeft size={16} /> Back to Home
                    </Link>
                </div>
            )}

            {children}

            <div style={{ marginTop: '4rem', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                <p>Your files are streamed directly. We don't store anything.</p>
            </div>
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
                        background: '#161b22',
                        color: '#fff',
                        border: '1px solid #30363d'
                    }
                }}
            />
        </Router>
    );
}

export default App;
