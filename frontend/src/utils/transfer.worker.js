/* eslint-disable no-restricted-globals */
self.onmessage = (e) => {
    const { file, type } = e.data;

    // Start New Transfer
    if (file) {
        self.file = file;
        self.readOffset = 0;
        self.CHUNK_SIZE = 64 * 1024; // 64KB (Optimal for WebRTC SCTP)
        self.MAX_QUEUE = 32; // 32 chunks * 64KB = 2MB Prefetch Buffer
        self.chunkQueue = [];
        self.cancelled = false;
        self.reading = false;
        self.awaitingAck = true; // Pretend we have initial Ack to start instantly

        // Cleanup old reader if active
        if (self.reader && self.reader.readyState === 1) {
            try { self.reader.abort(); } catch (e) { }
        }

        self.reader = new FileReader();

        self.reader.onload = (evt) => {
            if (self.cancelled) return;
            self.reading = false; // Release disk lock

            const data = evt.target.result;
            
            // Zero-byte check completion
            if (!data.byteLength) {
                if (self.chunkQueue.length === 0 && !self.awaitingAck) {
                    self.postMessage({ type: 'complete' });
                }
                return;
            }

            // 1. Push to prefetch memory queue
            self.chunkQueue.push({
                data: data,
                offset: self.readOffset
            });
            self.readOffset += data.byteLength;

            // 2. Instantly push to network if main thread is waiting
            processQueue();

            // 3. Immediately read next chunk if queue isn't full yet
            readNext();
        };

        self.reader.onerror = (err) => {
            if (self.cancelled) return;
            self.reading = false;
            self.postMessage({ type: 'error', error: err });
        };

        // Kick off the continuous read loop
        readNext();
    }
    // Flow Control: Network is ready for more data
    else if (type === 'ack') {
        if (self.cancelled) return;
        self.awaitingAck = true;
        
        processQueue(); // Send from memory instantly
        readNext();     // Top off the memory queue
    }
    // Cancellation
    else if (type === 'cancel') {
        self.cancelled = true;
        if (self.reader && self.reader.readyState === 1) {
            try { self.reader.abort(); } catch (e) { }
        }
        self.chunkQueue = []; // Free memory
        self.close(); // Terminate worker safely
    }
};

// Pushes chunks to the main thread from memory with zero delay
function processQueue() {
    if (self.cancelled || !self.awaitingAck) return;

    if (self.chunkQueue.length > 0) {
        const chunk = self.chunkQueue.shift();
        self.awaitingAck = false; // Consume the ACK

        self.postMessage({
            type: 'chunk',
            data: chunk.data,
            offset: chunk.offset
        }, [chunk.data]); // Pass by reference for zero-copy transfer
    } else if (self.readOffset >= self.file.size) {
        // Disk is fully read AND memory queue is empty
        self.postMessage({ type: 'complete' });
    }
}

// Continuously pulls from disk into RAM
function readNext() {
    if (self.reading || self.cancelled || self.readOffset >= self.file.size) return;
    if (self.chunkQueue.length >= self.MAX_QUEUE) return; // Stop if RAM buffer is full

    self.reading = true; // Acquire disk lock
    const slice = self.file.slice(self.readOffset, self.readOffset + self.CHUNK_SIZE);
    self.reader.readAsArrayBuffer(slice);
}