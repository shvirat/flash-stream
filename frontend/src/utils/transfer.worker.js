// This worker handles file reading preventing background throttling
// And implements flow control (wait for 'ack')
self.onmessage = (e) => {
    const { file, type } = e.data;

    // Initial start
    if (file) {
        self.file = file;
        self.offset = 0;
        self.CHUNK_SIZE = 256 * 1024; // 256KB
        self.reader = new FileReader();

        self.reader.onload = (evt) => {
            const data = evt.target.result;
            const len = data.byteLength; // Capture length BEFORE transfer

            // Send chunk back to main thread
            self.postMessage({
                type: 'chunk',
                data,
                offset: self.offset + len
            }, [data]);

            self.offset += len;
        };

        self.reader.onerror = (err) => {
            self.postMessage({ type: 'error', error: err });
        };

        // Read first chunk
        readNext();
    }
    // Flow control: wait for ack before reading next
    else if (type === 'ack') {
        if (self.offset < self.file.size) {
            readNext();
        } else {
            self.postMessage({ type: 'complete' });
        }
    }
};

function readNext() {
    const slice = self.file.slice(self.offset, self.offset + self.CHUNK_SIZE);
    self.reader.readAsArrayBuffer(slice);
}
