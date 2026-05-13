import { File, Directory, Paths } from "expo-file-system";
import { Asset } from "expo-asset";
import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase | null = null;

async function ensureDatabase() {
  if (db) return db;

  // expo-sqlite looks for DBs under <document>/SQLite/
  const sqliteDir = new Directory(Paths.document, "SQLite");
  if (!sqliteDir.exists) {
    sqliteDir.create({ intermediates: true });
  }

  const dbFile = new File(sqliteDir, "usda.db");

  if (!dbFile.exists) {
    // Download the bundled asset to the local cache
    const asset = Asset.fromModule(require("@/assets/databases/usda.db"));
    await asset.downloadAsync();

    const sourceUri = asset.localUri ?? asset.uri;
    if (!sourceUri) {
      throw new Error("[USDA] Asset download failed — localUri is null");
    }

    const sourceFile = new File(sourceUri);
    if (!sourceFile.exists) {
      throw new Error(`[USDA] Source file not found at: ${sourceUri}`);
    }

    sourceFile.copy(dbFile);
    console.log("[USDA] DB copied to:", dbFile.uri);
  }

  db = await SQLite.openDatabaseAsync("usda.db");
  return db;
}
export async function searchFoods(query: string, limit = 20) {
  const database = await ensureDatabase();
  const rows = await database.getAllAsync<{ data: string }>(
    `SELECT data FROM foods
     WHERE description LIKE ?
     ORDER BY description
     LIMIT ?`,
    [`%${query}%`, limit],
  );
  return rows.map((r) => JSON.parse(r.data));
}

export async function getFoodById(fdcId: number) {
  const database = await ensureDatabase();
  const row = await database.getFirstAsync<{ data: string }>(
    "SELECT data FROM foods WHERE fdc_id = ?",
    [fdcId],
  );
  return row ? JSON.parse(row.data) : null;
}

export async function getFoodsByCategory(category: string, limit = 50) {
  const database = await ensureDatabase();
  const rows = await database.getAllAsync<{ data: string }>(
    "SELECT data FROM foods WHERE category = ? LIMIT ?",
    [category, limit],
  );
  return rows.map((r) => JSON.parse(r.data));
}
