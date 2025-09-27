import sqlite3InitModule from "@sqlite.org/sqlite-wasm";
import sqlite3WasmUrl from "@sqlite.org/sqlite-wasm/sqlite3.wasm?url";

let sqlite3Instance = null;
let dbInstance = null;

onmessage = async (e) => {
  try {
    const { data } = e;

    if (!dbInstance) {
      dbInstance = await initDB();
    }

    switch (data.type) {
      case "ping":
        postMessage({ type: "pong" });
        return;
      case "exec":
        dbInstance.exec(data.query);
        postMessage({ type: "exec", data: { query: data.query } });
        return;
      case "select":
        const result = dbInstance.selectObjects(data.query);
        postMessage({ type: "select", data: { query: data.query, result } });
        return;
      default:
        console.error(`Unknown message type: ${data.type}`);
        throw new Error(`Unknown message type: ${e.type}`);
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
  const sqlite3 = await sqlite3InitModule({
    locateFile: (file) => (file.endsWith(".wasm") ? sqlite3WasmUrl : file),
  });

  sqlite3Instance = sqlite3;
  dbInstance = new sqlite3.oo1.DB("/encre.db");

  dbInstance.exec(`
    PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

  return dbInstance;
};
