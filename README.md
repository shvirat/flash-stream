# ⚡ FlashStream

**FlashStream** is a high-performance, secure, and limitless Peer-to-Peer (P2P) file transfer and clipboard synchronization tool. Built with modern web technologies, it allows devices to share data directly without intermediate servers, ensuring maximum privacy and speed.

![FlashStream Banner](/frontend/public/images/flashstream-og-image.png)

## 🚀 Key Features

*   **⚡ Limitless File Transfer**: Send files of *any size* (GBs/TBs) simply by dragging and dropping.
*   **🔒 End-to-End Encrypted**: Data flows directly between peers via WebRTC. No servers see your files.
*   **📋 Universal Clipboard**: Instantly sync text, links, and code snippets across devices (Host/Client modes).
*   **🔁 Auto-Resume & Reliability**: 
    *   **Smart Handshake**: Ensures peers are ready before transfer begins.
    *   **Chunk validation**: Guaranteed data integrity with SHA-like checks.
    *   **Memory Safe**: Uses efficient streams and Web Workers to handle massive files without crashing the browser.
*   **📱 Cross-Platform**: Works on any device with a modern browser (Mobile, Desktop, Tablet).

## 🛠️ Tech Stack

*   **Frontend**: React + Vite
*   **P2P Connectivity**: PeerJS (WebRTC wrapper)
*   **Storage**: IndexedDB (for handling large file chunks safely)
*   **Concurrency**: Web Workers (off-main-thread processing)
*   **Styling**: TailwindCSS + Framer Motion (Glassmorphism UI)
*   **State Management**: React Hooks + LocalStorage Persistence

## 📦 Architecture Highlights

### 1. **Robust P2P Engine (`peerClient.js`)**
The core engine manages WebRTC connections with a custom **Heartbeat Protocol** to detect disconnections instantly. It features a specific **Handshake Mechanism** (`meta` -> `ready` -> `go`) to prevent race conditions during large transfers.

### 2. **Multi-Threaded Performance (`transfer.worker.js`)**
File reading and chunking happen in a background **Web Worker**. This prevents UI freezing (jank) even when processing 4K videos or huge ISO files. It uses a **Backpressure Mechanism** to match the network speed dynamically.

### 3. **Crash-Proof Storage (`db.js`)**
Incoming data is piped directly into **IndexedDB** rather than RAM. This allows receiving files larger than the device's available RAM. The database uses a **Composite Key (`fileId` + `offset`)** schema to guarantee zero data duplication, even if chunks are resent.

## 🏁 Getting Started

### Prerequisites
*   Node.js (v18+)
*   npm or yarn

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/yourusername/flashstream.git
    cd flashstream/frontend
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Start the development server:
    ```bash
    npm run dev
    ```

4.  Open your browser at `http://localhost:5173`.

## 🤝 Contributing

Contributions are welcome!
1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.