import Dexie, { type Table } from 'dexie';

export interface Transaction {
  id?: number;
  type: 'expense' | 'income' | 'transfer';
  amount: number;
  date: string;
  time?: string;
  timestamp: number;
  category: string;
  subCategory?: string;
  note?: string;
  transferType?: 'tarik' | 'setor';
  bankAccount?: string;
}

export interface Budget {
  id?: number;
  category: string;
  limitAmount: number;
}

export interface Schedule {
  id?: number;
  title: string;
  location?: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

export interface TaskItem {
  id?: number;
  title: string;
  deadline: string;
  priority: 'tinggi' | 'sedang' | 'rendah';
  completed: number;
}

export interface AlarmItem {
  id?: number;
  title: string;
  time: string;
  enabled: number;
}

export interface SettingItem {
  key: string;
  value: string;
}

export class InfokanDexieDB extends Dexie {
  transactions!: Table<Transaction>;
  budgets!: Table<Budget>;
  schedules!: Table<Schedule>;
  tasks!: Table<TaskItem>;
  alarms!: Table<AlarmItem>;
  settings!: Table<SettingItem>;

  constructor() {
    super('InfokanUangDanWaktuDB');
    this.version(1).stores({
      transactions: '++id, type, amount, date, timestamp, category',
      budgets: '++id, &category',
      schedules: '++id, dayOfWeek, startTime',
      tasks: '++id, deadline, priority, completed',
      alarms: '++id, time, enabled',
      settings: 'key'
    });
  }
}

export const db = new InfokanDexieDB();
