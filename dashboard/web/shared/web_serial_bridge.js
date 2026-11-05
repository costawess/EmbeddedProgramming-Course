(function attachWebSerialBridge(globalScope) {
  class WebSerialLineBridge {
    constructor(callbacks = {}) {
      this.onLine = callbacks.onLine || (() => {});
      this.onStatus = callbacks.onStatus || (() => {});
      this.onError = callbacks.onError || (() => {});
      this.port = null;
      this.reader = null;
      this.writer = null;
      this.readableClosed = null;
      this.writableClosed = null;
      this.isClosing = false;
    }

    get supported() {
      return typeof navigator !== "undefined" && "serial" in navigator;
    }

    get connected() {
      return Boolean(this.port);
    }

    async connect(baudRate) {
      if (!this.supported) {
        throw new Error("Web Serial API is not available in this browser or context.");
      }

      if (this.connected) {
        await this.disconnect();
      }

      this.port = await navigator.serial.requestPort();
      await this.port.open({ baudRate });
      this.isClosing = false;

      const encoder = new TextEncoderStream();
      this.writableClosed = encoder.readable.pipeTo(this.port.writable).catch(() => {});
      this.writer = encoder.writable.getWriter();

      const decoder = new TextDecoderStream();
      this.readableClosed = this.port.readable.pipeTo(decoder.writable).catch(() => {});
      this.reader = decoder.readable.getReader();

      this.onStatus("connected");
      this.readLoop();
    }

    async readLoop() {
      let buffer = "";

      try {
        while (this.reader && !this.isClosing) {
          const { value, done } = await this.reader.read();
          if (done) break;
          if (!value) continue;

          buffer += value;
          while (buffer.includes("\n")) {
            const newlineIndex = buffer.indexOf("\n");
            const line = buffer.slice(0, newlineIndex).replace(/\r/g, "").trim();
            buffer = buffer.slice(newlineIndex + 1);
            if (line) {
              this.onLine(line);
            }
          }
        }

        const tail = buffer.replace(/\r/g, "").trim();
        if (tail) {
          this.onLine(tail);
        }
      } catch (error) {
        if (!this.isClosing) {
          this.onError(error);
        }
      } finally {
        if (!this.isClosing) {
          await this.disconnect({ silentStatus: true });
          this.onStatus("disconnected");
        }
      }
    }

    async sendLine(line) {
      if (!this.writer) {
        throw new Error("Serial port is not connected.");
      }
      await this.writer.write(`${line}\n`);
    }

    async disconnect(options = {}) {
      const { silentStatus = false } = options;
      const port = this.port;
      const reader = this.reader;
      const writer = this.writer;

      this.isClosing = true;
      this.port = null;
      this.reader = null;
      this.writer = null;

      try {
        if (reader) {
          await reader.cancel();
          reader.releaseLock();
        }
      } catch (_) {}

      try {
        if (writer) {
          await writer.close();
          writer.releaseLock();
        }
      } catch (_) {}

      try {
        if (this.readableClosed) {
          await this.readableClosed;
        }
      } catch (_) {}

      try {
        if (this.writableClosed) {
          await this.writableClosed;
        }
      } catch (_) {}

      try {
        if (port) {
          await port.close();
        }
      } catch (_) {}

      this.readableClosed = null;
      this.writableClosed = null;
      this.isClosing = false;

      if (!silentStatus) {
        this.onStatus("disconnected");
      }
    }
  }

  globalScope.WebSerialLineBridge = WebSerialLineBridge;
})(window);
