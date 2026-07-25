/* eslint-disable no-restricted-globals */
self.onmessage = (e) => {
    const { file, type } = e.data;

    // Start New Transfer
    if (file) {
        self.file = file;
        self.readOffset = 0;
        self.CHUNK_SIZE = 64 * 1024; // 64KB (Optimal for WebRTC SCTP)
        self.MAX_QUEUE = 32; // 2MB Prefetch Buffer (32 * 64KB)
        self.chunkQueue = [];
        self.cancelled = false;
        self.reading = false;
        self.paused = false; // Stream starts unpaused

        if (self.reader && self.reader.readyState === 1) {
            try { self.reader.abort(); } catch (e) { }
        }

        self.reader = new FileReader();

        self.reader.onload = (evt) => {
            if (self.cancelled) return;
            self.reading = false;

            const data = evt.target.result;
            
            // File read complete
            if (!data.byteLength) {
                if (self.chunkQueue.length === 0 && !self.paused) {
                    self.postMessage({ type: 'complete' });
                }
                return;
            }

            self.chunkQueue.push({ data, offset: self.readOffset });
            self.readOffset += data.byteLength;

            processQueue();
            readNext();
        };

        self.reader.onerror = (err) => {
            if (self.cancelled) return;
            self.reading = false;
            self.postMessage({ type: 'error', error: err });
        };

        readNext();
    }
    // Stream Control
    else if (type === 'resume') {
        if (self.cancelled) return;
        self.paused = false;
        processQueue(); 
        readNext();     
    }
    else if (type === 'pause') {
        self.paused = true;
    }
    // Cancellation
    else if (type === 'cancel') {
        self.cancelled = true;
        if (self.reader && self.reader.readyState === 1) {
            try { self.reader.abort(); } catch (e) { }
        }
        self.chunkQueue = []; 
        self.close(); 
    }
};

// Dumps memory queue to main thread instantly
function processQueue() {
    if (self.cancelled || self.paused) return;

    // LOOP: Empty the entire prefetch buffer into the main thread as fast as possible
    while (self.chunkQueue.length > 0 && !self.paused) {
        const chunk = self.chunkQueue.shift();
        
        self.postMessage({
            type: 'chunk',
            data: chunk.data,
            offset: chunk.offset
        }, [chunk.data]); 
    }

    // Trigger complete if done
    if (self.readOffset >= self.file.size && self.chunkQueue.length === 0) {
        self.postMessage({ type: 'complete' });
    }
}

function readNext() {
    if (self.reading || self.cancelled || self.readOffset >= self.file.size) return;
    if (self.chunkQueue.length >= self.MAX_QUEUE) return; 

    self.reading = true; 
    const slice = self.file.slice(self.readOffset, self.readOffset + self.CHUNK_SIZE);
    self.reader.readAsArrayBuffer(slice);
}