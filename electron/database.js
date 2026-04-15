const Database = require('better-sqlite3');
const { randomUUID } = require('crypto');

class ActionItemDatabase {
  constructor(dbPath) {
    this.db = new Database(dbPath);
    this.initSchema();
  }

  initSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS parties (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE COLLATE NOCASE,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS items (
        id TEXT PRIMARY KEY,
        text TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        is_completed INTEGER NOT NULL DEFAULT 0,
        completed_at TEXT
      );

      CREATE TABLE IF NOT EXISTS item_parties (
        item_id TEXT NOT NULL,
        party_id TEXT NOT NULL,
        PRIMARY KEY (item_id, party_id),
        FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
        FOREIGN KEY (party_id) REFERENCES parties(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_item_parties_party_id ON item_parties (party_id);
      CREATE INDEX IF NOT EXISTS idx_items_is_completed ON items (is_completed);
    `);
  }

  createParty(name) {
    const trimmedName = name.trim();

    if (!trimmedName) {
      throw new Error('Party name is required');
    }

    if (trimmedName.length > 100) {
      throw new Error('Party name must be 100 characters or less');
    }

    const id = randomUUID();
    const createdAt = new Date().toISOString();

    try {
      const stmt = this.db.prepare('INSERT INTO parties (id, name, created_at) VALUES (?, ?, ?)');
      stmt.run(id, trimmedName, createdAt);

      return { id, name: trimmedName, createdAt };
    } catch (error) {
      if (error.message.includes('UNIQUE constraint failed')) {
        throw new Error('A party with this name already exists');
      }
      throw error;
    }
  }

  getParties() {
    const stmt = this.db.prepare('SELECT id, name, created_at as createdAt FROM parties ORDER BY name');
    return stmt.all();
  }

  createItem(text, partyIds) {
    const trimmedText = text.trim();

    if (!trimmedText) {
      throw new Error('Item text is required');
    }

    if (trimmedText.length > 5000) {
      throw new Error('Item text must be 5000 characters or less');
    }

    if (!partyIds || partyIds.length === 0) {
      throw new Error('At least one party is required');
    }

    const id = randomUUID();
    const now = new Date().toISOString();

    const transaction = this.db.transaction(() => {
      const itemStmt = this.db.prepare(`
        INSERT INTO items (id, text, created_at, updated_at, is_completed)
        VALUES (?, ?, ?, ?, 0)
      `);
      itemStmt.run(id, trimmedText, now, now);

      const partyStmt = this.db.prepare('INSERT INTO item_parties (item_id, party_id) VALUES (?, ?)');
      for (const partyId of partyIds) {
        partyStmt.run(id, partyId);
      }
    });

    transaction();

    return this.getItemById(id);
  }

  getItemById(itemId) {
    const item = this.db.prepare(`
      SELECT id, text, created_at as createdAt, updated_at as updatedAt,
             is_completed as isCompleted, completed_at as completedAt
      FROM items WHERE id = ?
    `).get(itemId);

    if (!item) {
      return null;
    }

    item.isCompleted = Boolean(item.isCompleted);

    const parties = this.db.prepare(`
      SELECT p.id, p.name, p.created_at as createdAt
      FROM parties p
      JOIN item_parties ip ON p.id = ip.party_id
      WHERE ip.item_id = ?
      ORDER BY p.name
    `).all(itemId);

    return { ...item, parties };
  }

  getItemsByParty(partyId) {
    const itemIds = this.db.prepare(`
      SELECT DISTINCT item_id FROM item_parties WHERE party_id = ?
    `).all(partyId).map(row => row.item_id);

    return itemIds.map(id => this.getItemById(id)).filter(item => item !== null);
  }

  getAllItems() {
    const items = this.db.prepare(`
      SELECT id, text, created_at as createdAt, updated_at as updatedAt,
             is_completed as isCompleted, completed_at as completedAt
      FROM items ORDER BY created_at DESC
    `).all();

    return items.map(item => {
      item.isCompleted = Boolean(item.isCompleted);
      const parties = this.db.prepare(`
        SELECT p.id, p.name, p.created_at as createdAt
        FROM parties p
        JOIN item_parties ip ON p.id = ip.party_id
        WHERE ip.item_id = ?
        ORDER BY p.name
      `).all(item.id);
      return { ...item, parties };
    });
  }

  updateItemText(itemId, text) {
    const trimmedText = text.trim();

    if (!trimmedText) {
      throw new Error('Item text is required');
    }

    if (trimmedText.length > 5000) {
      throw new Error('Item text must be 5000 characters or less');
    }

    const updatedAt = new Date().toISOString();
    const stmt = this.db.prepare('UPDATE items SET text = ?, updated_at = ? WHERE id = ?');
    stmt.run(trimmedText, updatedAt, itemId);

    return this.getItemById(itemId);
  }

  setItemCompletion(itemId, isCompleted) {
    const completedAt = isCompleted ? new Date().toISOString() : null;
    const updatedAt = new Date().toISOString();

    const stmt = this.db.prepare(`
      UPDATE items
      SET is_completed = ?, completed_at = ?, updated_at = ?
      WHERE id = ?
    `);
    stmt.run(isCompleted ? 1 : 0, completedAt, updatedAt, itemId);

    return this.getItemById(itemId);
  }

  addPartyToItem(itemId, partyId) {
    try {
      const stmt = this.db.prepare('INSERT INTO item_parties (item_id, party_id) VALUES (?, ?)');
      stmt.run(itemId, partyId);
    } catch (error) {
      if (error.message.includes('UNIQUE constraint failed')) {
        // Party already assigned, ignore
        return;
      }
      throw error;
    }
  }

  removePartyFromItem(itemId, partyId) {
    // Check if this is the last party
    const count = this.db.prepare('SELECT COUNT(*) as count FROM item_parties WHERE item_id = ?')
      .get(itemId).count;

    if (count <= 1) {
      throw new Error('Cannot remove the last party from an item');
    }

    const stmt = this.db.prepare('DELETE FROM item_parties WHERE item_id = ? AND party_id = ?');
    stmt.run(itemId, partyId);
  }
}

module.exports = ActionItemDatabase;
