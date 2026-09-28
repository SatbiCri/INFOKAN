/**
 * Infokan Database Layer
 * Pure IndexedDB Implementation (Offline-First, Dexie-Compatible Schema)
 * Starts 100% empty - all data added by user
 */

class InfokanDB {
  constructor() {
    this.dbName = 'InfokanUangDanWaktuDB';
    this.version = 1;
    this.db = null;
  }

  async init() {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Transactions: expense, income, transfer (tarik/setor)
        if (!db.objectStoreNames.contains('transactions')) {
          const transStore = db.createObjectStore('transactions', { keyPath: 'id', autoIncrement: true });
          transStore.createIndex('type', 'type', { unique: false });
          transStore.createIndex('date', 'date', { unique: false });
          transStore.createIndex('category', 'category', { unique: false });
          transStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Budgets: category budget limits
        if (!db.objectStoreNames.contains('budgets')) {
          const budgetStore = db.createObjectStore('budgets', { keyPath: 'id', autoIncrement: true });
          budgetStore.createIndex('category', 'category', { unique: true });
        }

        // Schedules: agenda kuliah / kegiatan harian
        if (!db.objectStoreNames.contains('schedules')) {
          const schedStore = db.createObjectStore('schedules', { keyPath: 'id', autoIncrement: true });
          schedStore.createIndex('dayOfWeek', 'dayOfWeek', { unique: false });
          schedStore.createIndex('startTime', 'startTime', { unique: false });
        }

        // Tasks: tugas kuliah & deadline
        if (!db.objectStoreNames.contains('tasks')) {
          const taskStore = db.createObjectStore('tasks', { keyPath: 'id', autoIncrement: true });
          taskStore.createIndex('deadline', 'deadline', { unique: false });
          taskStore.createIndex('priority', 'priority', { unique: false });
          taskStore.createIndex('completed', 'completed', { unique: false });
        }

        // Alarms: pengingat suara offline
        if (!db.objectStoreNames.contains('alarms')) {
          const alarmStore = db.createObjectStore('alarms', { keyPath: 'id', autoIncrement: true });
          alarmStore.createIndex('time', 'time', { unique: false });
          alarmStore.createIndex('enabled', 'enabled', { unique: false });
        }

        // App Settings & Activation Status
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error('IndexedDB open error:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  async getStore(storeName, mode = 'readonly') {
    const db = await this.init();
    const transaction = db.transaction([storeName], mode);
    return transaction.objectStore(storeName);
  }

  // Generic CRUD
  async getAll(storeName) {
    const store = await this.getStore(storeName, 'readonly');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async getById(storeName, id) {
    const store = await this.getStore(storeName, 'readonly');
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async add(storeName, item) {
    const store = await this.getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.add(item);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async update(storeName, item) {
    const store = await this.getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(item);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName, id) {
    const store = await this.getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  // Settings
  async getSetting(key, defaultValue = null) {
    const store = await this.getStore('settings', 'readonly');
    return new Promise((resolve) => {
      const request = store.get(key);
      request.onsuccess = () => {
        resolve(request.result ? request.result.value : defaultValue);
      };
      request.onerror = () => resolve(defaultValue);
    });
  }

  async setSetting(key, value) {
    const store = await this.getStore('settings', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put({ key, value });
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
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
        // Pemasukan tanpa input rekening masuk ke bank/e-wallet secara default
        bankBalance += amount;
      } else if (t.type === 'expense') {
        totalExpense += amount;
        // Pengeluaran dipotong dari cash jika cash mencukupi, atau bank
        if (cashBalance >= amount) {
          cashBalance -= amount;
        } else {
          bankBalance -= amount;
        }
      } else if (t.type === 'transfer') {
        if (t.transferType === 'tarik') {
          // Tarik Tunai: Bank -> Cash
          bankBalance -= amount;
          cashBalance += amount;
        } else if (t.transferType === 'setor') {
          // Setor Tunai: Cash -> Bank
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
