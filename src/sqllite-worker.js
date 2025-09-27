import sqlite3InitModule from "@sqlite.org/sqlite-wasm";
import sqlite3WasmUrl from "@sqlite.org/sqlite-wasm/sqlite3.wasm?url";

let dbInstance = null;

onmessage = async (e) => {
  try {
    const { data } = e;

    if (!dbInstance) {
      dbInstance = await initDB();
      postMessage({ type: "ready" });
    }

    const { id, type, query } = data || {};

    switch (type) {
      case "ping": {
        postMessage({ id, type: "pong" });
        return;
      }
      case "migrate": {
        dbInstance.exec(`
          PRAGMA journal_mode=WAL;
          CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )`);
        postMessage({ id, type: "migrate", data: { ok: true } });
        return;
      }
      case "exec": {
        dbInstance.exec(query);
        postMessage({ id, type: "exec", data: { ok: true } });
        return;
      }
      case "select": {
        const result = dbInstance.selectObjects(query);
        postMessage({ id, type: "select", data: { ok: true, result } });
        return;
      }
      case "export": {
        const result = dbInstance.export();
        postMessage({ id, type: "export", data: { ok: true, result } });
        return;
      }
      default: {
        const err = new Error(`Unknown message type: ${type}`);
        postMessage({ id, type: "error", data: { error: err.message } });
        return;
      }
    }
  } catch (err) {
    console.error(err);
    postMessage({ type: "error", data: { error: err.message } });
  }
};

onerror = (e) => {
  console.error(e);
};

const initDB = async () => {
  const sqlite3Instance = await sqlite3InitModule({
    locateFile: (file) => (file.endsWith(".wasm") ? sqlite3WasmUrl : file),
  });

  dbInstance = new sqlite3Instance.oo1.OpfsDb("/encre.db", "c");

  return dbInstance;
};
