import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', 'data.json');

export async function ensureDB() {
  try {
    await fs.access(dbPath);
  } catch {
    const seed = { projects: [], tasks: [] };
    await fs.writeFile(dbPath, JSON.stringify(seed, null, 2), 'utf-8');
  }
}

export async function readDB() {
  const raw = await fs.readFile(dbPath, 'utf-8');
  try {
    return JSON.parse(raw);
  } catch {
    // reset if corrupted
    const seed = { projects: [], tasks: [] };
    await fs.writeFile(dbPath, JSON.stringify(seed, null, 2), 'utf-8');
    return seed;
  }
}

export async function writeDB(data) {
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf-8');
}
