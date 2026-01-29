import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';
import { scaleIn } from '../utils/animations';

const NotFound = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <motion.div
                variants={scaleIn}
                initial="hidden"
                animate="visible"
                className="glass-panel p-12 rounded-3xl max-w-lg w-full flex flex-col items-center"
            >
                <div className="relative mb-6">
                    <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full"></div>
                    <FileQuestion size={80} className="text-blue-400 relative z-10" />
                </div>

                <h1 className="text-6xl font-bold mb-2 text-white">404</h1>
                <h2 className="text-2xl font-semibold mb-6 text-gradient">Page Not Found</h2>

                <p className="text-dim mb-8 text-lg">
                    Oops! It looks like you've drifted into the void.
                    The page you're looking for doesn't exist or has been moved.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                    <Link
                        to="/"
                        className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all shadow-lg hover:shadow-blue-500/25 w-full sm:w-auto"
                    >
                        <Home size={18} />
                        Go Home
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium border border-white/10 transition-all w-full sm:w-auto cursor-pointer"
                    >
                        <ArrowLeft size={18} />
                        Go Back
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default NotFound;
