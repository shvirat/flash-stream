import React from 'react';
import { motion } from 'framer-motion';
import { slideUp } from '../utils/animations';
import { Shield, Zap, Monitor, Lock, FileText, HelpCircle, Mail, Info, Download as DownloadIcon, Server, Smartphone, Globe } from 'lucide-react';

const Pagelayout = ({ title, icon: Icon, children }) => (
    <div className="w-full max-w-4xl mx-auto px-4">
        <motion.div
            initial="hidden"
            animate="visible"
            variants={slideUp}
            className="glass-panel p-8 rounded-2xl relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -z-10 -translate-y-1/2 translate-x-1/2"></div>
            <div className="flex items-center gap-4 mb-8 pb-8 border-b border-white/10">
                <div className="p-3 bg-white/5 rounded-xl">
                    <Icon size={32} className="text-blue-400" />
                </div>
                <h1 className="text-3xl font-bold text-white">{title}</h1>
            </div>
            <div className="prose prose-invert prose-blue max-w-none text-gray-300">
                {children}
            </div>
        </motion.div>
    </div>
);

export const Features = () => (
    <Pagelayout title="Features" icon={Zap}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2"><Lock size={20} className="text-emerald-400" /> End-to-End Encryption</h3>
                <p>Your files are encrypted before they leave your device and only decrypted on the receiver's device. We never see your data.</p>
            </div>
            <div>
                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2"><Server size={20} className="text-purple-400" /> Serverless & Unlimited</h3>
                <p>Transfer files of ANY size. Since files go directly between devices, there are no cloud storage limits or bandwidth caps.</p>
            </div>
            <div>
                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2"><Smartphone size={20} className="text-blue-400" /> Cross-Platform</h3>
                <p>Works on iPhone, Android, Windows, Mac, and Linux. Just open the browser and start sharing.</p>
            </div>
            <div>
                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2"><Globe size={20} className="text-yellow-400" /> Local Network Discovery</h3>
                <p>If devices are on the same Wi-Fi, transfers are blazing fast over your local network.</p>
            </div>
        </div>
    </Pagelayout>
);

export const HowItWorks = () => (
    <Pagelayout title="How It Works" icon={HelpCircle}>
        <ol className="list-decimal list-inside space-y-6">
            <li className="pl-4">
                <strong className="text-white">Open FlashStream:</strong> Open the app on both devices (Sender and Receiver).
            </li>
            <li className="pl-4">
                <strong className="text-white">Generate Code:</strong> The Sender gets a unique 6-character connection code.
            </li>
            <li className="pl-4">
                <strong className="text-white">Connect:</strong> The Receiver enters the code to establish a secure peer-to-peer tunnel.
            </li>
            <li className="pl-4">
                <strong className="text-white">Transfer:</strong> Drag and drop files or paste them to send instantly.
            </li>
        </ol>
    </Pagelayout>
);

export const DownloadApp = () => (
    <Pagelayout title="Download" icon={DownloadIcon}>
        <p className="mb-6">FlashStream is a Progressive Web App (PWA). You don't need to visit an App Store to install it!</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                <h3 className="text-lg font-bold text-white mb-2">iOS / Android</h3>
                <ol className="list-decimal list-inside text-sm space-y-2">
                    <li>Open <strong>FlashStream</strong> in Chrome or Safari.</li>
                    <li>Tap the <strong>Share</strong> button (iOS) or <strong>Menu</strong> (Android).</li>
                    <li>Select <strong>Add to Home Screen</strong>.</li>
                </ol>
            </div>
            <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                <h3 className="text-lg font-bold text-white mb-2">Desktop (Chrome/Edge)</h3>
                <ol className="list-decimal list-inside text-sm space-y-2">
                    <li>Look for the <strong>Install icon</strong> (monitor with down arrow) in the address bar.</li>
                    <li>Click <strong>Install FlashStream</strong>.</li>
                    <li>It will now run as a native-like app on your desktop.</li>
                </ol>
            </div>
        </div>
    </Pagelayout>
);

export const PrivacyPolicy = () => (
    <Pagelayout title="Privacy Policy" icon={Shield}>
        <p><strong>Last Updated: January 2024</strong></p>
        <p>At FlashStream, privacy is our core feature, not an afterthought.</p>

        <h3 className="text-xl font-bold text-white mt-6 mb-2">1. No Data Storage</h3>
        <p>We do not store your files. Files are streamed directly from the sender's device to the receiver's device using WebRTC.</p>

        <h3 className="text-xl font-bold text-white mt-6 mb-2">2. Connection Metadata</h3>
        <p>To establish a connection, a signaling server briefly coordinates the handshake (exchanging generic connection info like IP addresses). This data is ephemeral and is not logged or stored permanently.</p>

        <h3 className="text-xl font-bold text-white mt-6 mb-2">3. Cookies</h3>
        <p>We use local storage only to remember your generated Sender ID for convenience. We do not use tracking cookies.</p>
    </Pagelayout>
);

export const TermsOfService = () => (
    <Pagelayout title="Terms of Service" icon={FileText}>
        <p>By using FlashStream, you agree to these terms.</p>
        <ul className="list-disc list-inside space-y-2 mt-4">
            <li>You accept full responsibility for the files you transfer.</li>
            <li>Do not use this service for illegal file sharing or copyright infringement.</li>
            <li>The service is provided "as is" without warranties of any kind.</li>
            <li>We are not liable for any data loss during transfer (though we try our best to prevent it!).</li>
        </ul>
    </Pagelayout>
);

export const FAQ = () => (
    <Pagelayout title="Frequently Asked Questions" icon={HelpCircle}>
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-bold text-white mb-1">Is there a file size limit?</h3>
                <p>Technically no, but browser memory limits exist. For best results on mobile, keep files under 500MB. Desktop browsers can handle larger files reliably.</p>
            </div>
            <div>
                <h3 className="text-lg font-bold text-white mb-1">Are my files secure?</h3>
                <p>Yes. WebRTC encrypts data in transit using DTLS/SRTP protocols. No one in the middle (including us) can read your files.</p>
            </div>
            <div>
                <h3 className="text-lg font-bold text-white mb-1">Why does it sometimes fail to connect?</h3>
                <p>Strict corporate firewalls or certain mobile networks (CGNAT) can block P2P connections. Try switching to Wi-Fi if mobile data fails.</p>
            </div>
        </div>
    </Pagelayout>
);

export const Support = () => (
    <Pagelayout title="Support" icon={Mail}>
        <p>Need help? Encountered a bug?</p>
        <p className="mt-4">
            You can reach out to our team at: <br />
            <a href="mailto:thegenpixel@gmail.com" className="text-blue-400 hover:underline">thegenpixel@gmail.com</a>
        </p>
        <p className="mt-4 text-sm text-dim">
            Please include your device type, browser version, and a description of the error.
        </p>
    </Pagelayout>
);

export const About = () => (
    <Pagelayout title="About Us" icon={Info}>
        <p>FlashStream was built with a simple mission: <strong>Make file sharing invisible.</strong></p>
        <p className="mt-4">
            We were tired of emailing files to ourselves, logging into cloud drives just to move a photo, and dealing with compression limits on messaging apps.
        </p>
        <p className="mt-4">
            FlashStream is an open initiative to bring true Peer-to-Peer technology to the web, making the internet feel a little more like a local network.
        </p>
        <div className="mt-8 p-4 bg-white/5 rounded-xl border border-white/10 text-center">
            <p>Built with ❤️ using React, Node.js and PeerJS.</p>
        </div>
    </Pagelayout>
);
