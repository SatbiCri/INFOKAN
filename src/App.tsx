import React, { useState, useEffect } from 'react';
import { db, type Transaction, type Budget, type Schedule, type TaskItem } from './db';
import { getInstallationId, verifyActivationCode } from './utils/activation';
import { playSuccessChime, playClickSound } from './utils/sound';

export default function App() {
  const [tab, setTab] = useState<'dashboard' | 'transactions' | 'budget' | 'schedule' | 'tasks'>('dashboard');
  const [netWorth, setNetWorth] = useState<number>(0);
  const [cashBalance, setCashBalance] = useState<number>(0);
  const [bankBalance, setBankBalance] = useState<number>(0);
  const [isActivated, setIsActivated] = useState<boolean>(false);
  const [installId, setInstallId] = useState<string>('');

  useEffect(() => {
    getInstallationId().then(setInstallId);
    setIsActivated(localStorage.getItem('infokan_activated') === 'true');
    loadFinanceSummary();
  }, []);

  async function loadFinanceSummary() {
    const list = await db.transactions.toArray();
    let cash = 0;
    let bank = 0;
    list.forEach(t => {
      const amt = Number(t.amount) || 0;
      if (t.type === 'income') {
        bank += amt;
      } else if (t.type === 'expense') {
        if (cash >= amt) cash -= amt;
        else bank -= amt;
      } else if (t.type === 'transfer') {
        if (t.transferType === 'tarik') {
          bank -= amt;
          cash += amt;
        } else {
          cash -= amt;
          bank += amt;
        }
      }
    });
    setCashBalance(cash);
    setBankBalance(bank);
    setNetWorth(cash + bank);
  }

  function formatRp(n: number) {
    return new Intl.NumberFormat('id-ID').format(n);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col max-w-lg mx-auto pb-24">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg">
            I
          </div>
          <div>
            <h1 className="font-bold text-base bg-gradient-to-r from-white to-emerald-400 bg-clip-text text-transparent">Infokan</h1>
            <p className="text-[10px] text-slate-400">uang dan waktu • offline-first</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${isActivated ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'}`}>
            {isActivated ? 'Aktif (Pro)' : 'Aktivasi'}
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="p-4 flex-1 flex flex-col gap-4">
        {/* Balance Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-cyan-500/20 shadow-xl relative overflow-hidden">
          <div className="flex justify-between items-center text-xs text-cyan-400 font-semibold uppercase tracking-wider">
            <span>Total Saldo Bersih</span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">100% Offline</span>
          </div>
          <div className="text-3xl font-extrabold text-white my-2 flex items-baseline gap-1">
            <span className="text-lg text-cyan-400 font-semibold">Rp</span>
            <span>{formatRp(netWorth)}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800/80 text-xs">
            <div>
              <span className="text-slate-400">Dompet Tunai</span>
              <div className="font-bold text-emerald-400 text-sm">Rp {formatRp(cashBalance)}</div>
            </div>
            <div>
              <span className="text-slate-400">Bank & E-Wallet</span>
              <div className="font-bold text-cyan-400 text-sm">Rp {formatRp(bankBalance)}</div>
            </div>
          </div>
        </div>

        {/* Dynamic Empty State Warning */}
        <div className="p-6 rounded-2xl bg-slate-900/50 border border-dashed border-slate-800 text-center flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-xl bg-slate-800/60 flex items-center justify-center text-slate-400 text-xl">
            ✨
          </div>
          <h2 className="font-bold text-sm text-slate-300">Aplikasi Siap Digunakan</h2>
          <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
            Data keuangan, anggaran, jadwal, dan tugas masih kosong sesuai permintaan Anda. Mulai catat transaksi pertama Anda!
          </p>
        </div>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-slate-900/90 backdrop-blur-xl border-t border-slate-800 flex items-center justify-around py-2.5 z-40">
        <button onClick={() => { playClickSound(); setTab('dashboard'); }} className={`text-xs flex flex-col items-center gap-1 ${tab === 'dashboard' ? 'text-emerald-400' : 'text-slate-400'}`}>
          <span>🏠</span>
          <span>Beranda</span>
        </button>
        <button onClick={() => { playClickSound(); setTab('budget'); }} className={`text-xs flex flex-col items-center gap-1 ${tab === 'budget' ? 'text-emerald-400' : 'text-slate-400'}`}>
          <span>📊</span>
          <span>Anggaran</span>
        </button>
        <button onClick={() => { playClickSound(); setTab('transactions'); }} className="w-12 h-12 -mt-5 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 text-slate-950 font-bold text-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
          +
        </button>
        <button onClick={() => { playClickSound(); setTab('schedule'); }} className={`text-xs flex flex-col items-center gap-1 ${tab === 'schedule' ? 'text-emerald-400' : 'text-slate-400'}`}>
          <span>⏰</span>
          <span>Jadwal</span>
        </button>
        <button onClick={() => { playClickSound(); setTab('tasks'); }} className={`text-xs flex flex-col items-center gap-1 ${tab === 'tasks' ? 'text-emerald-400' : 'text-slate-400'}`}>
          <span>✅</span>
          <span>Tugas</span>
        </button>
      </nav>
    </div>
  );
}
