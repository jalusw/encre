class DatabaseClient {
  constructor() {
    this.worker = new Worker(new URL("../sqllite-worker.js", import.meta.url), {
      type: "module",
    });

    this.worker.onmessage = (e) => {
      console.log(e);
    };
  }

  async exec(query) {
    this.worker.postMessage({ type: "exec", query });
  }

  async select(query) {
    return new Promise((resolve, reject) => {
      this.worker.postMessage({ type: "select", query });
      this.worker.onmessage = (e) => {
        resolve(e.data);
      };
    });
  }

  async close() {
    this.worker.terminate();
  }
}

export default DatabaseClient;
