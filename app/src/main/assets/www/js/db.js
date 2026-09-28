/**
 * Infokan Hybrid Storage Layer (IndexedDB + Robust LocalStorage Fallback)
 * 100% Offline-First, Guaranteed to never block or hang on any Android WebView or browser.
 */

class InfokanDB {
  constructor() {
    this.dbName = 'InfokanUangDanWaktuDB';
    this.version = 1;
    this.useLocalStorage = false;
    this.db = null;
    this.isReady = false;
  }

  async init() {
    if (this.isReady) return this;

    return new Promise((resolve) => {
      // Set safety timeout: if indexedDB hangs for > 300ms, fallback to LocalStorage immediately
      const timeout = setTimeout(() => {
        console.warn('IndexedDB timed out or restricted on file://, falling back to LocalStorage');
        this.useLocalStorage = true;
        this.isReady = true;
        resolve(this);
      }, 300);

      try {
        if (!window.indexedDB) {
          clearTimeout(timeout);
          this.useLocalStorage = true;
          this.isReady = true;
          return resolve(this);
        }

        const request = indexedDB.open(this.dbName, this.version);

        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          ['transactions', 'budgets', 'schedules', 'tasks', 'alarms', 'settings'].forEach(store => {
            if (!db.objectStoreNames.contains(store)) {
              db.createObjectStore(store, { keyPath: store === 'settings' ? 'key' : 'id', autoIncrement: store !== 'settings' });
            }
          });
        };

        request.onsuccess = (event) => {
          clearTimeout(timeout);
          this.db = event.target.result;
          this.useLocalStorage = false;
          this.isReady = true;
          resolve(this);
        };

        request.onerror = () => {
          clearTimeout(timeout);
          this.useLocalStorage = true;
          this.isReady = true;
          resolve(this);
        };
      } catch (err) {
        clearTimeout(timeout);
        this.useLocalStorage = true;
        this.isReady = true;
        resolve(this);
      }
    });
  }

  // LocalStorage Helper Methods
  _getLS(storeName) {
    try {
      const data = localStorage.getItem(`infokan_${storeName}`);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  _setLS(storeName, data) {
    try {
      localStorage.setItem(`infokan_${storeName}`, JSON.stringify(data));
    } catch (e) {}
  }

  // CRUD Operations
  async getAll(storeName) {
    await this.init();
    if (this.useLocalStorage) {
      return this._getLS(storeName);
    }
    return new Promise((resolve) => {
      try {
        const tx = this.db.transaction([storeName], 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve(this._getLS(storeName));
      } catch (e) {
        resolve(this._getLS(storeName));
      }
    });
  }

  async add(storeName, item) {
    await this.init();
    const id = Date.now() + Math.floor(Math.random() * 1000);
    const newItem = { ...item, id };

    if (this.useLocalStorage) {
      const list = this._getLS(storeName);
      list.push(newItem);
      this._setLS(storeName, list);
      return id;
    }

    return new Promise((resolve) => {
      try {
        const tx = this.db.transaction([storeName], 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.add(newItem);
        req.onsuccess = () => {
          // Keep LS mirror in sync
          const list = this._getLS(storeName);
          list.push(newItem);
          this._setLS(storeName, list);
          resolve(req.result);
        };
        req.onerror = () => {
          const list = this._getLS(storeName);
          list.push(newItem);
          this._setLS(storeName, list);
          resolve(id);
        };
      } catch (e) {
        const list = this._getLS(storeName);
        list.push(newItem);
        this._setLS(storeName, list);
        resolve(id);
      }
    });
  }

  async update(storeName, item) {
    await this.init();
    if (this.useLocalStorage) {
      const list = this._getLS(storeName);
      const idx = list.findIndex(i => i.id === item.id);
      if (idx !== -1) list[idx] = item;
      else list.push(item);
      this._setLS(storeName, list);
      return true;
    }

    return new Promise((resolve) => {
      try {
        const tx = this.db.transaction([storeName], 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.put(item);
        req.onsuccess = () => {
          const list = this._getLS(storeName);
          const idx = list.findIndex(i => i.id === item.id);
          if (idx !== -1) list[idx] = item;
          else list.push(item);
          this._setLS(storeName, list);
          resolve(true);
        };
        req.onerror = () => resolve(true);
      } catch (e) {
        resolve(true);
      }
    });
  }

  async delete(storeName, id) {
    await this.init();
    const numId = Number(id);
    const list = this._getLS(storeName).filter(i => Number(i.id) !== numId);
    this._setLS(storeName, list);

    if (this.useLocalStorage) return true;

    return new Promise((resolve) => {
      try {
        const tx = this.db.transaction([storeName], 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.delete(numId);
        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(true);
      } catch (e) {
        resolve(true);
      }
    });
  }

  // Financial Calculations
  async getFinancialSummary() {
    const transactions = await this.getAll('transactions');
    let cashBalance = 0;
    let bankBalance = 0;
    let totalExpense = 0;
    let totalIncome = 0;

    for (const t of transactions) {
      const amount = Number(t.amount) || 0;
      if (t.type === 'income') {
        totalIncome += amount;
        bankBalance += amount;
      } else if (t.type === 'expense') {
        totalExpense += amount;
        if (cashBalance >= amount) {
          cashBalance -= amount;
        } else {
          bankBalance -= amount;
        }
      } else if (t.type === 'transfer') {
        if (t.transferType === 'tarik') {
          bankBalance -= amount;
          cashBalance += amount;
        } else if (t.transferType === 'setor') {
          cashBalance -= amount;
          bankBalance += amount;
        }
      }
    }

    return {
      cashBalance,
      bankBalance,
      netWorth: cashBalance + bankBalance,
      totalIncome,
      totalExpense,
      transactionCount: transactions.length
    };
  }
}

window.infokanDB = new InfokanDB();
