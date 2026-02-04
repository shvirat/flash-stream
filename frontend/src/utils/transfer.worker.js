/* eslint-disable no-restricted-globals */
self.onmessage = (e) => {
    const { file, type } = e.data;

    // Start New Transfer
    if (file) {
        // RESET STATE (Worker Reuse Safety)
        self.file = file;
        self.offset = 0;
        self.CHUNK_SIZE = 256 * 1024; // Start at 256KB (Adaptive logic can be added later)
        self.cancelled = false;
        self.reading = false;

        // Cleanup old reader if somehow active
        if (self.reader && self.reader.readyState === 1) {
            try { self.reader.abort(); } catch (e) { }
        }

        self.reader = new FileReader();

        self.reader.onload = (evt) => {
            if (self.cancelled) return;
            self.reading = false; // Release lock

            const data = evt.target.result;
            const len = data.byteLength;

            // Zero-byte check (Prevent infinite loop)
            if (!len) {
                self.postMessage({ type: 'complete' });
                return;
            }

            self.postMessage({
                type: 'chunk',
                data,
                offset: self.offset // Send START offset
            }, [data]);

            self.offset += len;
        };

        self.reader.onerror = (err) => {
            if (self.cancelled) return;
            self.reading = false;
            self.postMessage({ type: 'error', error: err });
        };

        readNext();
    }
    // Flow Control: Ack received
    else if (type === 'ack') {
        // Race Condition Protection: Don't read if already reading or cancelled.
        if (!self.cancelled && !self.reading) {
            if (self.offset < self.file.size) {
                readNext();
            } else {
                self.postMessage({ type: 'complete' });
            }
        }
    }
    // Cancellation
    else if (type === 'cancel') {
        self.cancelled = true;
        if (self.reader && self.reader.readyState === 1) {
            try { self.reader.abort(); } catch (e) { }
        }
        self.close(); // Terminate worker safely
    }
};

function readNext() {
    if (self.reading || self.cancelled) return;
    self.reading = true; // Acquire lock

    const slice = self.file.slice(self.offset, self.offset + self.CHUNK_SIZE);
    self.reader.readAsArrayBuffer(slice);
}
