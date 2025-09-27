class DatabaseClient {
  constructor() {
    this.worker = new Worker(new URL("../sqlite-worker.js", import.meta.url), {
      type: "module",
    });
    this.nextId = 1;
    this.pending = new Map();

    this.worker.onmessage = (e) => {
      const { id, type, data } = e.data || {};
      if (typeof id !== "undefined" && this.pending.has(id)) {
        const { resolve, reject } = this.pending.get(id);
        this.pending.delete(id);
        if (type === "error") {
          reject(new Error((data && data.error) || "Worker error"));
        } else {
          resolve({ type, data });
        }
        return;
      }
      // Non-request messages like "ready"
      if (type === "ready") {
        // can emit event/log if needed
        return;
      }
    };

    this.worker.onerror = (err) => {
      console.error("SQLite worker error:", err.message || err);
    };
  }

  call(type, payload = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.worker.postMessage({ id, type, ...payload });
    });
  }

  async migrate() {
    const res = await this.call("migrate");
    return res.data;
  }

  async exec(query) {
    const res = await this.call("exec", { query });
    return res.data;
  }

  async select(query) {
    const res = await this.call("select", { query });
    return res.data;
  }

  async ping() {
    const res = await this.call("ping");
    return res.type === "pong";
  }

  async close() {
    this.worker.terminate();
    this.pending.clear();
  }
}

export default DatabaseClient;
