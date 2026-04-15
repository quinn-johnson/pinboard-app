import { Party, Item, Thread } from './types';

const DB_NAME = 'ActionItemsDB';
const DB_VERSION = 3;

class IndexedDBService {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create parties store
        if (!db.objectStoreNames.contains('parties')) {
          db.createObjectStore('parties', { keyPath: 'id' });
        }

        // Create items store
        if (!db.objectStoreNames.contains('items')) {
          db.createObjectStore('items', { keyPath: 'id' });
        }

        // Create item_parties store
        if (!db.objectStoreNames.contains('item_parties')) {
          const store = db.createObjectStore('item_parties', { keyPath: ['itemId', 'partyId'] });
          store.createIndex('byItemId', 'itemId');
          store.createIndex('byPartyId', 'partyId');
        }

        // Create threads store
        if (!db.objectStoreNames.contains('threads')) {
          const store = db.createObjectStore('threads', { keyPath: 'id' });
          store.createIndex('byItemId', 'itemId');
        }
      };
    });
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async createParty(name: string): Promise<Party> {
    const trimmedName = name.trim();

    if (!trimmedName) {
      throw new Error('Party name is required');
    }

    if (trimmedName.length > 100) {
      throw new Error('Party name must be 100 characters or less');
    }

    // Check for duplicate
    const existing = await this.getParties();
    if (existing.some(p => p.name.toLowerCase() === trimmedName.toLowerCase())) {
      throw new Error('A party with this name already exists');
    }

    const party: Party = {
      id: this.generateId(),
      name: trimmedName,
      createdAt: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['parties'], 'readwrite');
      const store = transaction.objectStore('parties');
      const request = store.add(party);

      request.onsuccess = () => resolve(party);
      request.onerror = () => reject(request.error);
    });
  }

  async updatePartyName(partyId: string, newName: string): Promise<Party> {
    const trimmedName = newName.trim();

    if (!trimmedName) {
      throw new Error('Party name is required');
    }

    if (trimmedName.length > 100) {
      throw new Error('Party name must be 100 characters or less');
    }

    // Check for duplicate (excluding current party)
    const existing = await this.getParties();
    if (existing.some(p => p.id !== partyId && p.name.toLowerCase() === trimmedName.toLowerCase())) {
      throw new Error('A party with this name already exists');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['parties'], 'readwrite');
      const store = transaction.objectStore('parties');
      const getRequest = store.get(partyId);

      getRequest.onsuccess = () => {
        const party = getRequest.result;
        if (!party) {
          reject(new Error('Party not found'));
          return;
        }

        party.name = trimmedName;
        const putRequest = store.put(party);

        putRequest.onsuccess = () => resolve(party);
        putRequest.onerror = () => reject(putRequest.error);
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async getParties(): Promise<Party[]> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['parties'], 'readonly');
      const store = transaction.objectStore('parties');
      const request = store.getAll();

      request.onsuccess = () => {
        const parties = request.result as Party[];
        parties.sort((a, b) => a.name.localeCompare(b.name));
        resolve(parties);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async createItem(text: string, partyIds: string[]): Promise<Item> {
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

    const now = new Date().toISOString();
    const itemId = this.generateId();

    const item = {
      id: itemId,
      text: trimmedText,
      createdAt: now,
      updatedAt: now,
      isCompleted: false,
      completedAt: null,
      reminderAt: null,
      isStarred: false
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['items', 'item_parties'], 'readwrite');

      const itemsStore = transaction.objectStore('items');
      const itemPartiesStore = transaction.objectStore('item_parties');

      itemsStore.add(item);

      for (const partyId of partyIds) {
        itemPartiesStore.add({ itemId, partyId });
      }

      transaction.oncomplete = async () => {
        const fullItem = await this.getItemById(itemId);
        resolve(fullItem!);
      };
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getItemById(itemId: string): Promise<Item | null> {
    const item: any = await new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['items'], 'readonly');
      const store = transaction.objectStore('items');
      const request = store.get(itemId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    if (!item) return null;

    const parties = await this.getPartiesForItem(itemId);
    const threads = await this.getThreadsForItem(itemId);
    return {
      ...item,
      reminderAt: item.reminderAt || null,
      isStarred: item.isStarred || false,
      parties,
      threads
    };
  }

  private async getPartiesForItem(itemId: string): Promise<Party[]> {
    const partyIds: string[] = await new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['item_parties'], 'readonly');
      const store = transaction.objectStore('item_parties');
      const index = store.index('byItemId');
      const request = index.getAll(itemId);

      request.onsuccess = () => {
        resolve(request.result.map((r: any) => r.partyId));
      };
      request.onerror = () => reject(request.error);
    });

    const allParties = await this.getParties();
    return allParties.filter(p => partyIds.includes(p.id));
  }

  async getItemsByParty(partyId: string): Promise<Item[]> {
    const itemIds: string[] = await new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['item_parties'], 'readonly');
      const store = transaction.objectStore('item_parties');
      const index = store.index('byPartyId');
      const request = index.getAll(partyId);

      request.onsuccess = () => {
        resolve(request.result.map((r: any) => r.itemId));
      };
      request.onerror = () => reject(request.error);
    });

    const items = await Promise.all(itemIds.map(id => this.getItemById(id)));
    return items.filter((item): item is Item => item !== null);
  }

  async getAllItems(): Promise<Item[]> {
    const items: any[] = await new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['items'], 'readonly');
      const store = transaction.objectStore('items');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    const fullItems = await Promise.all(items.map(item => this.getItemById(item.id)));
    return fullItems.filter((item): item is Item => item !== null)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async updateItemText(itemId: string, text: string): Promise<Item> {
    const trimmedText = text.trim();

    if (!trimmedText) {
      throw new Error('Item text is required');
    }

    if (trimmedText.length > 5000) {
      throw new Error('Item text must be 5000 characters or less');
    }

    return new Promise(async (resolve, reject) => {
      const transaction = this.db!.transaction(['items'], 'readwrite');
      const store = transaction.objectStore('items');
      const getRequest = store.get(itemId);

      getRequest.onsuccess = () => {
        const item = getRequest.result;
        item.text = trimmedText;
        item.updatedAt = new Date().toISOString();

        const putRequest = store.put(item);
        putRequest.onsuccess = async () => {
          const updated = await this.getItemById(itemId);
          resolve(updated!);
        };
        putRequest.onerror = () => reject(putRequest.error);
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async setItemCompletion(itemId: string, isCompleted: boolean): Promise<Item> {
    return new Promise(async (resolve, reject) => {
      const transaction = this.db!.transaction(['items'], 'readwrite');
      const store = transaction.objectStore('items');
      const getRequest = store.get(itemId);

      getRequest.onsuccess = () => {
        const item = getRequest.result;
        item.isCompleted = isCompleted;
        item.completedAt = isCompleted ? new Date().toISOString() : null;
        item.updatedAt = new Date().toISOString();

        const putRequest = store.put(item);
        putRequest.onsuccess = async () => {
          const updated = await this.getItemById(itemId);
          resolve(updated!);
        };
        putRequest.onerror = () => reject(putRequest.error);
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async addPartyToItem(itemId: string, partyId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['item_parties'], 'readwrite');
      const store = transaction.objectStore('item_parties');
      const request = store.add({ itemId, partyId });

      request.onsuccess = () => resolve();
      request.onerror = () => {
        if (request.error?.name === 'ConstraintError') {
          resolve(); // Already exists, ignore
        } else {
          reject(request.error);
        }
      };
    });
  }

  async removePartyFromItem(itemId: string, partyId: string): Promise<void> {
    // Check if this is the last party
    const parties = await this.getPartiesForItem(itemId);
    if (parties.length <= 1) {
      throw new Error('Cannot remove the last party from an item');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['item_parties'], 'readwrite');
      const store = transaction.objectStore('item_parties');
      const request = store.delete([itemId, partyId]);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async setItemReminder(itemId: string, reminderAt: string | null): Promise<Item> {
    return new Promise(async (resolve, reject) => {
      const transaction = this.db!.transaction(['items'], 'readwrite');
      const store = transaction.objectStore('items');
      const getRequest = store.get(itemId);

      getRequest.onsuccess = () => {
        const item = getRequest.result;
        item.reminderAt = reminderAt;
        item.updatedAt = new Date().toISOString();

        const putRequest = store.put(item);
        putRequest.onsuccess = async () => {
          const updated = await this.getItemById(itemId);
          resolve(updated!);
        };
        putRequest.onerror = () => reject(putRequest.error);
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async toggleItemStar(itemId: string): Promise<Item> {
    return new Promise(async (resolve, reject) => {
      const transaction = this.db!.transaction(['items'], 'readwrite');
      const store = transaction.objectStore('items');
      const getRequest = store.get(itemId);

      getRequest.onsuccess = () => {
        const item = getRequest.result;
        item.isStarred = !item.isStarred;
        item.updatedAt = new Date().toISOString();

        const putRequest = store.put(item);
        putRequest.onsuccess = async () => {
          const updated = await this.getItemById(itemId);
          resolve(updated!);
        };
        putRequest.onerror = () => reject(putRequest.error);
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  private async getThreadsForItem(itemId: string): Promise<Thread[]> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['threads'], 'readonly');
      const store = transaction.objectStore('threads');
      const index = store.index('byItemId');
      const request = index.getAll(itemId);

      request.onsuccess = () => {
        const threads = request.result as Thread[];
        threads.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        resolve(threads);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async addThread(itemId: string, text: string): Promise<Thread> {
    const trimmedText = text.trim();

    if (!trimmedText) {
      throw new Error('Thread text is required');
    }

    if (trimmedText.length > 5000) {
      throw new Error('Thread text must be 5000 characters or less');
    }

    const thread: Thread = {
      id: this.generateId(),
      itemId,
      text: trimmedText,
      createdAt: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['threads'], 'readwrite');
      const store = transaction.objectStore('threads');
      const request = store.add(thread);

      request.onsuccess = () => resolve(thread);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteThread(threadId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['threads'], 'readwrite');
      const store = transaction.objectStore('threads');
      const request = store.delete(threadId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const db = new IndexedDBService();
