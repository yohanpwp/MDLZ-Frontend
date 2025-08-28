// Web Worker Service for managing background processing

class WebWorkerService {
  constructor() {
    this.worker = null;
    this.isProcessing = false;
    this.messageHandlers = new Map();
  }

  // Initialize the validation worker
  initializeValidationWorker() {
    if (this.worker) {
      this.terminateWorker();
    }

    try {
      this.worker = new Worker("/validation-worker.js");
      this.worker.onmessage = this.handleWorkerMessage.bind(this);
      this.worker.onerror = this.handleWorkerError.bind(this);

      // Test worker availability
      return this.pingWorker();
    } catch (error) {
      console.error("Failed to initialize web worker:", error);
      return Promise.reject(error);
    }
  }

  // Handle messages from the worker
  handleWorkerMessage(event) {
    const { type, data, error } = event.data;

    if (this.messageHandlers.has(type)) {
      this.messageHandlers.get(type)(data, error);
    }
  }

  // Handle worker errors
  handleWorkerError(error) {
    console.error("Web Worker error:", error);
    this.isProcessing = false;

    if (this.messageHandlers.has("error")) {
      this.messageHandlers.get("error")(null, error.message);
    }
  }

  // Register message handler
  onMessage(type, handler) {
    this.messageHandlers.set(type, handler);
  }

  // Remove message handler
  offMessage(type) {
    this.messageHandlers.delete(type);
  }

  // Test worker connectivity
  pingWorker() {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error("Worker not initialized"));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error("Worker ping timeout"));
      }, 5000);

      this.onMessage("pong", () => {
        clearTimeout(timeout);
        this.offMessage("pong");
        resolve();
      });

      this.worker.postMessage({ type: "ping" });
    });
  }

  // Validate records using web worker
  validateRecords(records, onProgress = null) {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error("Worker not initialized"));
        return;
      }

      if (this.isProcessing) {
        reject(new Error("Worker is already processing"));
        return;
      }

      this.isProcessing = true;

      // Set up progress handler
      if (onProgress) {
        this.onMessage("progress", (data) => {
          onProgress(data);
        });
      }

      // Set up completion handler
      this.onMessage("complete", (data) => {
        this.isProcessing = false;
        this.offMessage("complete");
        this.offMessage("progress");
        this.offMessage("error");
        resolve(data);
      });

      // Set up error handler
      this.onMessage("error", (data, error) => {
        this.isProcessing = false;
        this.offMessage("complete");
        this.offMessage("progress");
        this.offMessage("error");
        reject(new Error(error || "Validation failed"));
      });

      // Send validation request
      this.worker.postMessage({
        type: "validate",
        data: { records },
      });
    });
  }

  // Check if web workers are supported
  static isSupported() {
    return typeof Worker !== "undefined";
  }

  // Get worker status
  getStatus() {
    return {
      initialized: !!this.worker,
      processing: this.isProcessing,
      supported: WebWorkerService.isSupported(),
    };
  }

  // Terminate the worker
  terminateWorker() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.isProcessing = false;
      this.messageHandlers.clear();
    }
  }

  // Cleanup method
  cleanup() {
    this.terminateWorker();
  }
}

// Create singleton instance
export const webWorkerService = new WebWorkerService();

export default WebWorkerService;
