import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = process.env.DB_FILE ? path.resolve(process.env.DB_FILE) : path.join(__dirname, 'db.json');

const COLLECTIONS = ['transactions', 'sessions', 'trials', 'tvConnections', 'events'];
const defaultData = Object.fromEntries(COLLECTIONS.map((name) => [name, []]));

export const db = new Low(new JSONFile(file), defaultData);

export async function initDb() {
  await db.read();
  db.data ||= structuredClone(defaultData);
  // Older db.json files predate trials / TVs / events: backfill them.
  for (const name of COLLECTIONS) db.data[name] ||= [];
  await db.write();
}
