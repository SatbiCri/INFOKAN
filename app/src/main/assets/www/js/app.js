/**
 * Infokan (uang dan waktu) - Main Application Controller
 * Ultra-Responsive, Offline-First PWA Controller
 */

document.addEventListener('DOMContentLoaded', async () => {
  // ===================== STATE & REFERENCES =====================
  const state = {
    currentTab: 'dashboard',
    transactionSubTab: 'expense',
    selectedExpenseCategory: 'Makan & Minum',
    selectedExpenseSubCategory: 'Makan Harian',
    selectedIncomeCategory: 'Kiriman Orang Tua / Keluarga',
    transferMode: 'tarik', // 'tarik' or 'setor'
    selectedTransferBank: 'BCA',
    dayFilter: 'all',
    taskPriorityFilter: 'all',
    activeAlarmId: null
  };

  const subCategoryMap = {
    'Makan & Minum': ['Makan Harian', 'Jajanan/Kopi', 'Belanja Bahan Masak', 'Galon & Gas LPG'],
    'Kebutuhan Kost': ['Uang Sewa Kost', 'Token Listrik & Air', 'Sabun/Deterjen', 'Kebersihan'],
    'Akademik & Kuliah': ['UKT/SPP', 'Fotokopi & Cetak Tugas', 'Buku & ATK', 'Uang Kas'],
    'Transportasi': ['Bensin Motor', 'Ojek Online', 'Angkutan', 'Servis'],
    'Hiburan & Pribadi': ['Paket Data & WiFi', 'Langganan Streaming', 'Nongkrong', 'Skincare'],
    'Kesehatan & Darurat': ['Obat/Vitamin', 'Berobat', 'Dana Darurat', 'Sedekah']
  };

  // Helper: Format Rupiah
  function formatRupiah(number) {
    const num = Number(number) || 0;
    return new Intl.NumberFormat('id-ID').format(num);
  }

  // Helper: Parse Rupiah Raw Input
  function parseRupiahInput(value) {
    return parseInt(value.replace(/[^0-9]/g, ''), 10) || 0;
  }

  // Toast System
  function showToast(message, icon = '✨') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.transition = 'all 0.3s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-8px)';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  // Set Default Date & Time to Now
  function resetDateTimePickers() {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;

    ['expenseDateInput', 'incomeDateInput', 'transferDateInput', 'taskDeadlineDateInput'].forEach(id => {
      const el = document.getElementById(id);
      if (el && !el.value) el.value = todayStr;
    });

    ['expenseTimeInput', 'incomeTimeInput', 'transferTimeInput', 'taskDeadlineTimeInput'].forEach(id => {
      const el = document.getElementById(id);
      if (el && !el.value) el.value = timeStr;
    });
  }

  // ===================== NAVIGATION =====================
  const pages = {
    dashboard: document.getElementById('pageDashboard'),
    transactions: document.getElementById('pageTransactions'),
    budget: document.getElementById('pageBudget'),
    schedule: document.getElementById('pageSchedule'),
    tasks: document.getElementById('pageTasks')
  };

  const navItems = {
    dashboard: document.getElementById('navDashboard'),
    budget: document.getElementById('navBudget'),
    schedule: document.getElementById('navSchedule'),
    tasks: document.getElementById('navTasks')
  };

  function switchTab(tabName) {
    state.currentTab = tabName;
    window.soundEngine.playClick();

    // Toggle pages
    Object.keys(pages).forEach(key => {
      if (pages[key]) {
        pages[key].style.display = (key === tabName) ? 'flex' : 'none';
      }
    });

    // Toggle bottom nav highlights
    Object.keys(navItems).forEach(key => {
      if (navItems[key]) {
        navItems[key].classList.toggle('active', key === tabName);
      }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Refresh views
    if (tabName === 'dashboard') refreshDashboard();
    if (tabName === 'transactions') refreshTransactionsHistory();
    if (tabName === 'budget') refreshBudgetView();
    if (tabName === 'schedule') refreshScheduleView();
    if (tabName === 'tasks') refreshTasksView();
  }

  // Bind Nav Items
  Object.keys(navItems).forEach(key => {
    if (navItems[key]) {
      navItems[key].addEventListener('click', () => switchTab(key));
    }
  });

  // FAB button in center: Go to Transactions Tab
  const navFabAdd = document.getElementById('navFabAdd');
  if (navFabAdd) {
    navFabAdd.addEventListener('click', () => switchTab('transactions'));
  }

  // Direct buttons from dashboard widgets
  document.getElementById('btnGoBudget')?.addEventListener('click', () => switchTab('budget'));
  document.getElementById('btnGoSchedule')?.addEventListener('click', () => switchTab('schedule'));
  document.getElementById('btnGoTasks')?.addEventListener('click', () => switchTab('tasks'));

  // ===================== SEGMENTED CONTROLLER (TRANSAKSI) =====================
  const tabExpenseBtn = document.getElementById('tabExpenseBtn');
  const tabIncomeBtn = document.getElementById('tabIncomeBtn');
  const tabTransferBtn = document.getElementById('tabTransferBtn');

  const formExpense = document.getElementById('formExpense');
  const formIncome = document.getElementById('formIncome');
  const formTransfer = document.getElementById('formTransfer');

  function switchTransactionSubTab(subTab) {
    state.transactionSubTab = subTab;
    window.soundEngine.playClick();

    // Reset button classes
    tabExpenseBtn?.classList.remove('active-expense');
    tabIncomeBtn?.classList.remove('active-income');
    tabTransferBtn?.classList.remove('active-transfer');

    if (formExpense) formExpense.style.display = 'none';
    if (formIncome) formIncome.style.display = 'none';
    if (formTransfer) formTransfer.style.display = 'none';

    if (subTab === 'expense') {
      tabExpenseBtn?.classList.add('active-expense');
      if (formExpense) formExpense.style.display = 'flex';
    } else if (subTab === 'income') {
      tabIncomeBtn?.classList.add('active-income');
      if (formIncome) formIncome.style.display = 'flex';
    } else if (subTab === 'transfer') {
      tabTransferBtn?.classList.add('active-transfer');
      if (formTransfer) formTransfer.style.display = 'flex';
    }
  }

  tabExpenseBtn?.addEventListener('click', () => switchTransactionSubTab('expense'));
  tabIncomeBtn?.addEventListener('click', () => switchTransactionSubTab('income'));
  tabTransferBtn?.addEventListener('click', () => switchTransactionSubTab('transfer'));

  // Sub-Categories Populator
  function populateExpenseSubCategories(cat) {
    const container = document.getElementById('expenseSubCategoryChips');
    if (!container) return;
    container.innerHTML = '';
    const subs = subCategoryMap[cat] || ['Umum'];
    state.selectedExpenseSubCategory = subs[0];

    subs.forEach((sub, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `chip-btn ${idx === 0 ? 'selected-rose' : ''}`;
      btn.textContent = sub;
      btn.addEventListener('click', () => {
        window.soundEngine.playClick();
        container.querySelectorAll('.chip-btn').forEach(b => b.classList.remove('selected-rose'));
        btn.classList.add('selected-rose');
        state.selectedExpenseSubCategory = sub;
      });
      container.appendChild(btn);
    });
  }

  // Bind Expense Category Chips
  const expenseCatChips = document.querySelectorAll('#expenseCategoryChips .chip-btn');
  expenseCatChips.forEach(chip => {
    chip.addEventListener('click', () => {
      window.soundEngine.playClick();
      expenseCatChips.forEach(c => c.classList.remove('selected-rose'));
      chip.classList.add('selected-rose');
      state.selectedExpenseCategory = chip.dataset.cat;
      populateExpenseSubCategories(chip.dataset.cat);
    });
  });
  populateExpenseSubCategories('Makan & Minum');

  // Bind Income Category Chips
  const incomeCatChips = document.querySelectorAll('#incomeCategoryChips .chip-btn');
  incomeCatChips.forEach(chip => {
    chip.addEventListener('click', () => {
      window.soundEngine.playClick();
      incomeCatChips.forEach(c => c.classList.remove('selected-emerald'));
      chip.classList.add('selected-emerald');
      state.selectedIncomeCategory = chip.dataset.inc;
    });
  });

  // Transfer Mode Toggle (Tarik vs Setor)
  const btnModeTarik = document.getElementById('btnModeTarik');
  const btnModeSetor = document.getElementById('btnModeSetor');
  const transferAmountLabel = document.getElementById('transferAmountLabel');

  function setTransferMode(mode) {
    state.transferMode = mode;
    window.soundEngine.playClick();
    if (mode === 'tarik') {
      btnModeTarik?.classList.add('active');
      btnModeSetor?.classList.remove('active');
      if (transferAmountLabel) transferAmountLabel.textContent = 'Nominal Tarik Tunai (Bank ➔ Cash)';
    } else {
      btnModeSetor?.classList.add('active');
      btnModeTarik?.classList.remove('active');
      if (transferAmountLabel) transferAmountLabel.textContent = 'Nominal Setor Tunai (Cash ➔ Bank)';
    }
  }

  btnModeTarik?.addEventListener('click', () => setTransferMode('tarik'));
  btnModeSetor?.addEventListener('click', () => setTransferMode('setor'));

  // Transfer Bank Chips
  const transferBankChips = document.querySelectorAll('#transferBankChips .chip-btn');
  transferBankChips.forEach(chip => {
    chip.addEventListener('click', () => {
      window.soundEngine.playClick();
      transferBankChips.forEach(c => c.classList.remove('selected-cyan'));
      chip.classList.add('selected-cyan');
      state.selectedTransferBank = chip.dataset.bank;
    });
  });

  // Rupiah Currency Formatter for Inputs
  function setupRupiahInput(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.addEventListener('input', (e) => {
      const raw = parseRupiahInput(e.target.value);
      e.target.value = raw > 0 ? formatRupiah(raw) : '';
    });
  }

  setupRupiahInput('expenseAmountInput');
  setupRupiahInput('incomeAmountInput');
  setupRupiahInput('transferAmountInput');
  setupRupiahInput('budgetLimitInput');

  // Quick Amount Buttons (Expense)
  document.querySelectorAll('[data-add]').forEach(btn => {
    btn.addEventListener('click', () => {
      window.soundEngine.playClick();
      const input = document.getElementById('expenseAmountInput');
      const add = parseInt(btn.dataset.add, 10);
      const current = parseRupiahInput(input.value);
      input.value = formatRupiah(current + add);
    });
  });

  document.querySelector('[data-clear]')?.addEventListener('click', () => {
    window.soundEngine.playClick();
    const input = document.getElementById('expenseAmountInput');
    if (input) input.value = '';
  });

  // Quick Amount Buttons (Income)
  document.querySelectorAll('[data-add-inc]').forEach(btn => {
    btn.addEventListener('click', () => {
      window.soundEngine.playClick();
      const input = document.getElementById('incomeAmountInput');
      const add = parseInt(btn.dataset.addInc, 10);
      const current = parseRupiahInput(input.value);
      input.value = formatRupiah(current + add);
    });
  });

  document.querySelector('[data-clear-inc]')?.addEventListener('click', () => {
    window.soundEngine.playClick();
    const input = document.getElementById('incomeAmountInput');
    if (input) input.value = '';
  });

  // Character Counter for Notes
  const expenseNoteInput = document.getElementById('expenseNoteInput');
  const expenseCharCount = document.getElementById('expenseCharCount');
  expenseNoteInput?.addEventListener('input', (e) => {
    if (expenseCharCount) expenseCharCount.textContent = `${e.target.value.length}/150`;
  });

  const incomeNoteInput = document.getElementById('incomeNoteInput');
  const incomeCharCount = document.getElementById('incomeCharCount');
  incomeNoteInput?.addEventListener('input', (e) => {
    if (incomeCharCount) incomeCharCount.textContent = `${e.target.value.length}/150`;
  });

  // ===================== FORM SUBMISSIONS =====================

  // Form: Simpan Pengeluaran
  formExpense?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const amount = parseRupiahInput(document.getElementById('expenseAmountInput').value);
    if (amount <= 0) {
      showToast('Masukkan nominal pengeluaran yang valid!', '⚠️');
      return;
    }

    const date = document.getElementById('expenseDateInput').value;
    const time = document.getElementById('expenseTimeInput').value;
    const note = document.getElementById('expenseNoteInput').value.trim();

    await window.infokanDB.add('transactions', {
      type: 'expense',
      amount,
      date,
      time,
      timestamp: new Date(`${date}T${time}`).getTime() || Date.now(),
      category: state.selectedExpenseCategory,
      subCategory: state.selectedExpenseSubCategory,
      note
    });

    window.soundEngine.playSuccess();
    showToast(`Pengeluaran Rp ${formatRupiah(amount)} berhasil disimpan!`, '💸');
    document.getElementById('expenseAmountInput').value = '';
    document.getElementById('expenseNoteInput').value = '';
    if (expenseCharCount) expenseCharCount.textContent = '0/150';

    refreshDashboard();
    refreshTransactionsHistory();
  });

  // Form: Simpan Pemasukan
  formIncome?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const amount = parseRupiahInput(document.getElementById('incomeAmountInput').value);
    if (amount <= 0) {
      showToast('Masukkan nominal pemasukan yang valid!', '⚠️');
      return;
    }

    const date = document.getElementById('incomeDateInput').value;
    const time = document.getElementById('incomeTimeInput').value;
    const note = document.getElementById('incomeNoteInput').value.trim();

    await window.infokanDB.add('transactions', {
      type: 'income',
      amount,
      date,
      time,
      timestamp: new Date(`${date}T${time}`).getTime() || Date.now(),
      category: state.selectedIncomeCategory,
      note
    });

    window.soundEngine.playSuccess();
    showToast(`Pemasukan Rp ${formatRupiah(amount)} berhasil disimpan!`, '💵');
    document.getElementById('incomeAmountInput').value = '';
    document.getElementById('incomeNoteInput').value = '';
    if (incomeCharCount) incomeCharCount.textContent = '0/150';

    refreshDashboard();
    refreshTransactionsHistory();
  });

  // Form: Simpan Tarik / Setor Tunai
  formTransfer?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const amount = parseRupiahInput(document.getElementById('transferAmountInput').value);
    if (amount <= 0) {
      showToast('Masukkan nominal mutasi yang valid!', '⚠️');
      return;
    }

    const date = document.getElementById('transferDateInput').value;
    const time = document.getElementById('transferTimeInput').value;
    const note = document.getElementById('transferNoteInput').value.trim();

    await window.infokanDB.add('transactions', {
      type: 'transfer',
      transferType: state.transferMode,
      amount,
      date,
      time,
      timestamp: new Date(`${date}T${time}`).getTime() || Date.now(),
      bankAccount: state.selectedTransferBank,
      category: state.transferMode === 'tarik' ? 'Tarik Tunai' : 'Setor Tunai',
      note
    });

    window.soundEngine.playSuccess();
    const label = state.transferMode === 'tarik' ? 'Tarik Tunai' : 'Setor Tunai';
    showToast(`${label} Rp ${formatRupiah(amount)} (${state.selectedTransferBank}) berhasil!`, '🔄');
    document.getElementById('transferAmountInput').value = '';
    document.getElementById('transferNoteInput').value = '';

    refreshDashboard();
    refreshTransactionsHistory();
  });

  // ===================== DASHBOARD & HISTORY REFRESH =====================

  async function refreshDashboard() {
    const summary = await window.infokanDB.getFinancialSummary();
    const netEl = document.getElementById('dashNetWorth');
    const cashEl = document.getElementById('dashCashBalance');
    const bankEl = document.getElementById('dashBankBalance');

    if (netEl) netEl.textContent = formatRupiah(summary.netWorth);
    if (cashEl) cashEl.textContent = `Rp ${formatRupiah(summary.cashBalance)}`;
    if (bankEl) bankEl.textContent = `Rp ${formatRupiah(summary.bankBalance)}`;

    // Mini-Widget: Budget Summary
    renderDashboardBudgetWidget();
    // Mini-Widget: Schedule Today
    renderDashboardScheduleWidget();
    // Mini-Widget: Urgent Tasks
    renderDashboardTaskWidget();
  }

  async function refreshTransactionsHistory() {
    const listEl = document.getElementById('transHistoryList');
    const countEl = document.getElementById('transHistoryCount');
    if (!listEl) return;

    const transactions = await window.infokanDB.getAll('transactions');
    transactions.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    if (countEl) countEl.textContent = `${transactions.length} Transaksi`;

    if (transactions.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon-wrap">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
          </div>
          <div class="empty-title">Belum Ada Transaksi</div>
          <div class="empty-desc">Catat pengeluaran harian, pemasukan, atau tarik/setor tunai Anda di form atas.</div>
        </div>
      `;
      return;
    }

    listEl.innerHTML = '';
    transactions.forEach(t => {
      const item = document.createElement('div');
      item.style.display = 'flex';
      item.style.alignItems = 'center';
      item.style.justifyContent = 'space-between';
      item.style.padding = '10px 12px';
      item.style.background = 'rgba(255, 255, 255, 0.02)';
      item.style.borderRadius = '12px';
      item.style.border = '1px solid var(--border-subtle)';

      let colorClass = 'var(--rose-400)';
      let sign = '-';
      let typeLabel = t.category;

      if (t.type === 'income') {
        colorClass = 'var(--emerald-400)';
        sign = '+';
      } else if (t.type === 'transfer') {
        colorClass = 'var(--cyan-400)';
        sign = '⇄';
        typeLabel = `${t.transferType === 'tarik' ? 'Tarik Tunai' : 'Setor Tunai'} • ${t.bankAccount}`;
      }

      item.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 2px;">
          <span style="font-size: 0.85rem; font-weight: 700; color: var(--text-main);">${typeLabel}</span>
          <span style="font-size: 0.72rem; color: var(--text-dim);">${t.date} ${t.time || ''} ${t.subCategory ? `• ${t.subCategory}` : ''} ${t.note ? `• "${t.note}"` : ''}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 0.95rem; font-weight: 800; color: ${colorClass};">${sign} Rp ${formatRupiah(t.amount)}</span>
          <button class="sheet-close-btn" style="width: 26px; height: 26px; font-size: 0.75rem;" data-del-trans="${t.id}">&times;</button>
        </div>
      `;

      item.querySelector('[data-del-trans]')?.addEventListener('click', async () => {
        window.soundEngine.playClick();
        await window.infokanDB.delete('transactions', t.id);
        showToast('Transaksi dihapus', '🗑️');
        refreshDashboard();
        refreshTransactionsHistory();
      });

      listEl.appendChild(item);
    });
  }

  // ===================== BUDGET MODULE =====================
  const modalBudget = document.getElementById('modalBudget');
  const btnOpenAddBudget = document.getElementById('btnOpenAddBudget');
  const btnCloseBudget = document.getElementById('btnCloseBudget');
  const formBudgetModal = document.getElementById('formBudgetModal');

  btnOpenAddBudget?.addEventListener('click', () => {
    window.soundEngine.playClick();
    document.getElementById('budgetIdInput').value = '';
    document.getElementById('budgetLimitInput').value = '';
    modalBudget?.classList.add('open');
  });

  btnCloseBudget?.addEventListener('click', () => {
    modalBudget?.classList.remove('open');
  });

  formBudgetModal?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('budgetIdInput').value;
    const category = document.getElementById('budgetCategorySelect').value;
    const limitAmount = parseRupiahInput(document.getElementById('budgetLimitInput').value);

    if (limitAmount <= 0) {
      showToast('Masukkan nominal batas anggaran yang valid!', '⚠️');
      return;
    }

    // Check if category already has budget
    const allBudgets = await window.infokanDB.getAll('budgets');
    const existing = allBudgets.find(b => b.category === category && (!id || b.id !== Number(id)));

    if (existing) {
      existing.limitAmount = limitAmount;
      await window.infokanDB.update('budgets', existing);
      showToast(`Anggaran ${category} diperbarui!`, '📊');
    } else if (id) {
      await window.infokanDB.update('budgets', { id: Number(id), category, limitAmount });
      showToast(`Anggaran ${category} diperbarui!`, '📊');
    } else {
      await window.infokanDB.add('budgets', { category, limitAmount });
      showToast(`Anggaran ${category} berhasil dibuat!`, '📊');
    }

    window.soundEngine.playSuccess();
    modalBudget?.classList.remove('open');
    refreshBudgetView();
    refreshDashboard();
  });

  async function calculateBudgetProgress() {
    const budgets = await window.infokanDB.getAll('budgets');
    const transactions = await window.infokanDB.getAll('transactions');

    // Filter expenses in current month
    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthlyExpenses = transactions.filter(t => t.type === 'expense' && t.date.startsWith(currentYearMonth));

    let totalLimit = 0;
    let totalSpent = 0;

    const categoryStats = budgets.map(b => {
      const spent = monthlyExpenses
        .filter(t => t.category === b.category)
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

      totalLimit += b.limitAmount;
      totalSpent += spent;

      // Safe percentage calculation (divide-by-zero protected)
      const percent = b.limitAmount > 0 ? (spent / b.limitAmount) * 100 : 0;
      const clampedPercent = Math.min(Math.max(percent, 0), 100);

      return {
        ...b,
        spent,
        percent,
        clampedPercent,
        remaining: Math.max(0, b.limitAmount - spent),
        isOver: spent > b.limitAmount,
        isWarning: percent >= 80 && percent <= 100
      };
    });

    const overallPercent = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0;
    const overallClampedPercent = Math.min(Math.max(overallPercent, 0), 100);

    return {
      totalLimit,
      totalSpent,
      overallPercent,
      overallClampedPercent,
      categoryStats
    };
  }

  async function refreshBudgetView() {
    const stats = await calculateBudgetProgress();
    const listEl = document.getElementById('budgetCategoryList');
    const countEl = document.getElementById('budgetListCount');
    const alertBannerList = document.getElementById('budgetAlertBannerList');

    // Update Overall Stats
    document.getElementById('budgetUsedText').textContent = `Rp ${formatRupiah(stats.totalSpent)}`;
    document.getElementById('budgetTotalLimitText').textContent = `dari batas Rp ${formatRupiah(stats.totalLimit)}`;
    document.getElementById('budgetPercentageText').textContent = `${Math.round(stats.overallPercent)}%`;

    // Circular Progress Ring calculation
    const circle = document.getElementById('budgetCircleProgress');
    if (circle) {
      const radius = 34;
      const circumference = 2 * Math.PI * radius; // 213.6
      const offset = circumference - (stats.overallClampedPercent / 100) * circumference;
      circle.style.strokeDashoffset = offset;

      // Color coding (<70% green, 70-90% amber, >100% red)
      if (stats.overallPercent > 100) {
        circle.style.stroke = 'var(--rose-500)';
      } else if (stats.overallPercent >= 70) {
        circle.style.stroke = 'var(--amber-500)';
      } else {
        circle.style.stroke = 'var(--emerald-500)';
      }
    }

    // Warnings Banner
    if (alertBannerList) {
      alertBannerList.innerHTML = '';
      const overBudgetItems = stats.categoryStats.filter(c => c.isOver);
      const warningBudgetItems = stats.categoryStats.filter(c => c.isWarning);

      if (overBudgetItems.length > 0) {
        const div = document.createElement('div');
        div.className = 'alert-banner alert-rose';
        div.innerHTML = `⚠️ <b>Peringatan:</b> ${overBudgetItems.map(i => i.category).join(', ')} telah melampaui batas anggaran 100%!`;
        alertBannerList.appendChild(div);
      } else if (warningBudgetItems.length > 0) {
        const div = document.createElement('div');
        div.className = 'alert-banner alert-amber';
        div.innerHTML = `⚡ <b>Waspada:</b> ${warningBudgetItems.map(i => i.category).join(', ')} sudah terpakai di atas 80%. Rem pengeluaran!`;
        alertBannerList.appendChild(div);
      }
    }

    // Category List
    if (countEl) countEl.textContent = `${stats.categoryStats.length} Kategori`;

    if (stats.categoryStats.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon-wrap">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>
          </div>
          <div class="empty-title">Belum Ada Anggaran</div>
          <div class="empty-desc">Tentukan batas pengeluaran untuk makan, kost, nongkrong, dll agar pengeluaran terkendali.</div>
        </div>
      `;
      return;
    }

    listEl.innerHTML = '';
    stats.categoryStats.forEach(b => {
      const card = document.createElement('div');
      card.style.background = 'rgba(255, 255, 255, 0.02)';
      card.style.border = '1px solid var(--border-subtle)';
      card.style.borderRadius = '16px';
      card.style.padding = '14px';
      card.style.display = 'flex';
      card.style.flexDirection = 'column';
      card.style.gap = '8px';

      let progressColor = 'progress-emerald';
      let badgeColor = 'var(--emerald-400)';
      if (b.isOver) {
        progressColor = 'progress-rose';
        badgeColor = 'var(--rose-400)';
      } else if (b.percent >= 70) {
        progressColor = 'progress-amber';
        badgeColor = 'var(--amber-400)';
      }

      card.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div style="font-weight: 700; font-size: 0.95rem;">${b.category}</div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 0.8rem; font-weight: 800; color: ${badgeColor};">${Math.round(b.percent)}%</span>
            <button class="sheet-close-btn" style="width: 26px; height: 26px; font-size: 0.72rem;" data-del-budget="${b.id}" title="Hapus Anggaran">&times;</button>
          </div>
        </div>

        <div class="progress-bar-container">
          <div class="progress-bar-fill ${progressColor}" style="width: ${b.clampedPercent}%;"></div>
        </div>

        <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.75rem; color: var(--text-dim);">
          <span>Terpakai: Rp ${formatRupiah(b.spent)}</span>
          <span>Batas: Rp ${formatRupiah(b.limitAmount)}</span>
        </div>
      `;

      card.querySelector('[data-del-budget]')?.addEventListener('click', async () => {
        window.soundEngine.playClick();
        await window.infokanDB.delete('budgets', b.id);
        showToast(`Anggaran ${b.category} dihapus`, '🗑️');
        refreshBudgetView();
        refreshDashboard();
      });

      listEl.appendChild(card);
    });
  }

  // Dashboard Budget Mini-Widget
  async function renderDashboardBudgetWidget() {
    const container = document.getElementById('dashBudgetWidgetContent');
    const alertsContainer = document.getElementById('dashBudgetAlerts');
    if (!container) return;

    const stats = await calculateBudgetProgress();

    // Render alert on dashboard top if over budget
    if (alertsContainer) {
      alertsContainer.innerHTML = '';
      const over = stats.categoryStats.filter(c => c.isOver);
      if (over.length > 0) {
        alertsContainer.innerHTML = `
          <div class="alert-banner alert-rose" style="margin-bottom: 8px;">
            ⚠️ <b>Overbudget:</b> Pengeluaran ${over.map(i => i.category).join(', ')} telah melebihi batas yang ditentukan!
          </div>
        `;
      }
    }

    if (stats.categoryStats.length === 0) {
      container.innerHTML = `
        <div style="font-size: 0.8rem; color: var(--text-dim); text-align: center; padding: 12px 0;">
          Belum ada batas anggaran yang diatur. Klik "Kelola" untuk membuat target hemat.
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
        <span style="font-size: 0.8rem; color: var(--text-dim);">Pengeluaran Bulan Ini</span>
        <span style="font-size: 0.82rem; font-weight: 700; color: ${stats.overallPercent > 100 ? 'var(--rose-400)' : 'var(--emerald-400)'};">
          ${Math.round(stats.overallPercent)}% (${formatRupiah(stats.totalSpent)} / ${formatRupiah(stats.totalLimit)})
        </span>
      </div>
      <div class="progress-bar-container">
        <div class="progress-bar-fill ${stats.overallPercent > 100 ? 'progress-rose' : (stats.overallPercent >= 70 ? 'progress-amber' : 'progress-emerald')}" style="width: ${stats.overallClampedPercent}%;"></div>
      </div>
    `;
  }

  // ===================== SCHEDULE & ALARMS =====================
  const modalSchedule = document.getElementById('modalSchedule');
  const btnOpenAddSchedule = document.getElementById('btnOpenAddSchedule');
  const btnCloseScheduleModal = document.getElementById('btnCloseScheduleModal');
  const formScheduleModal = document.getElementById('formScheduleModal');

  const modalAlarm = document.getElementById('modalAlarm');
  const btnOpenAddAlarm = document.getElementById('btnOpenAddAlarm');
  const btnCloseAlarmModal = document.getElementById('btnCloseAlarmModal');
  const formAlarmModal = document.getElementById('formAlarmModal');

  btnOpenAddSchedule?.addEventListener('click', () => {
    window.soundEngine.playClick();
    modalSchedule?.classList.add('open');
  });

  btnCloseScheduleModal?.addEventListener('click', () => {
    modalSchedule?.classList.remove('open');
  });

  btnOpenAddAlarm?.addEventListener('click', () => {
    window.soundEngine.playClick();
    modalAlarm?.classList.add('open');
  });

  btnCloseAlarmModal?.addEventListener('click', () => {
    modalAlarm?.classList.remove('open');
  });

  formScheduleModal?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('schedTitleInput').value.trim();
    const dayOfWeek = document.getElementById('schedDaySelect').value;
    const startTime = document.getElementById('schedStartInput').value;
    const endTime = document.getElementById('schedEndInput').value;
    const location = document.getElementById('schedLocationInput').value.trim();

    await window.infokanDB.add('schedules', {
      title,
      dayOfWeek,
      startTime,
      endTime,
      location
    });

    window.soundEngine.playSuccess();
    showToast(`Jadwal "${title}" disimpan!`, '📅');
    formScheduleModal.reset();
    modalSchedule?.classList.remove('open');
    refreshScheduleView();
    refreshDashboard();
  });

  formAlarmModal?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('alarmTitleInput').value.trim();
    const time = document.getElementById('alarmTimeInput').value;

    await window.infokanDB.add('alarms', {
      title,
      time,
      enabled: 1
    });

    window.soundEngine.playSuccess();
    showToast(`Alarm "${title}" (${time}) aktif!`, '⏰');
    formAlarmModal.reset();
    modalAlarm?.classList.remove('open');
    refreshScheduleView();
  });

  // Day Filter for Schedules
  const dayFilterChips = document.querySelectorAll('#dayFilterChips .chip-btn');
  dayFilterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      window.soundEngine.playClick();
      dayFilterChips.forEach(c => c.classList.remove('selected-cyan'));
      chip.classList.add('selected-cyan');
      state.dayFilter = chip.dataset.day;
      refreshScheduleView();
    });
  });

  // Real-time Clock & Alarm Polling Loop
  function getIndonesianDayName(dayIndex) {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return days[dayIndex];
  }

  function startRealtimeSchedulerLoop() {
    setInterval(async () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const timeStr = `${hours}:${minutes}`;
      const dayName = getIndonesianDayName(now.getDay());

      const clockEl = document.getElementById('currentLiveTime');
      if (clockEl) {
        clockEl.textContent = `${dayName}, ${timeStr}:${seconds} WIB`;
      }

      // Check Alarms (Trigger only at :00 second)
      if (now.getSeconds() === 0 && !window.soundEngine.isAlarmRunning) {
        const alarms = await window.infokanDB.getAll('alarms');
        const activeAlarm = alarms.find(a => a.enabled && a.time === timeStr);
        if (activeAlarm) {
          triggerAlarmScreen(activeAlarm);
        }
      }
    }, 1000);
  }
  startRealtimeSchedulerLoop();

  function triggerAlarmScreen(alarm) {
    const overlay = document.getElementById('alarmActiveOverlay');
    const titleEl = document.getElementById('activeAlarmTitle');
    const timeEl = document.getElementById('activeAlarmTime');
    if (!overlay) return;

    state.activeAlarmId = alarm.id;
    if (titleEl) titleEl.textContent = alarm.title.toUpperCase();
    if (timeEl) timeEl.textContent = alarm.time;

    overlay.style.display = 'flex';
    window.soundEngine.startLoudAlarm();
  }

  document.getElementById('btnDismissAlarm')?.addEventListener('click', () => {
    window.soundEngine.stopAlarm();
    const overlay = document.getElementById('alarmActiveOverlay');
    if (overlay) overlay.style.display = 'none';
    showToast('Alarm dimatikan', '🔕');
  });

  async function refreshScheduleView() {
    const schedListEl = document.getElementById('scheduleTimelineList');
    const alarmListEl = document.getElementById('alarmItemsList');
    const alarmCountBadge = document.getElementById('alarmCountBadge');
    if (!schedListEl) return;

    const schedules = await window.infokanDB.getAll('schedules');
    const alarms = await window.infokanDB.getAll('alarms');

    // 1. Render Alarms
    if (alarmCountBadge) alarmCountBadge.textContent = `${alarms.length} Alarm`;
    if (alarmListEl) {
      if (alarms.length === 0) {
        alarmListEl.innerHTML = `
          <div style="font-size: 0.78rem; color: var(--text-dim); text-align: center; padding: 8px 0;">
            Belum ada alarm offline. Pasang alarm agar tidak telat kuliah.
          </div>
        `;
      } else {
        alarmListEl.innerHTML = '';
        alarms.forEach(a => {
          const row = document.createElement('div');
          row.style.display = 'flex';
          row.style.alignItems = 'center';
          row.style.justifyContent = 'space-between';
          row.style.padding = '8px 12px';
          row.style.background = 'rgba(255, 255, 255, 0.02)';
          row.style.borderRadius = '12px';
          row.style.border = '1px solid var(--border-subtle)';

          row.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 1.15rem; font-weight: 800; font-family: monospace; color: var(--amber-400);">${a.time}</span>
              <span style="font-size: 0.85rem; font-weight: 600;">${a.title}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <button class="chip-btn ${a.enabled ? 'selected-emerald' : ''}" style="padding: 4px 10px; font-size: 0.72rem;" data-toggle-alarm="${a.id}">
                ${a.enabled ? 'Aktif' : 'Mati'}
              </button>
              <button class="sheet-close-btn" style="width: 24px; height: 24px; font-size: 0.7rem;" data-del-alarm="${a.id}">&times;</button>
            </div>
          `;

          row.querySelector('[data-toggle-alarm]')?.addEventListener('click', async () => {
            window.soundEngine.playClick();
            a.enabled = a.enabled ? 0 : 1;
            await window.infokanDB.update('alarms', a);
            refreshScheduleView();
          });

          row.querySelector('[data-del-alarm]')?.addEventListener('click', async () => {
            window.soundEngine.playClick();
            await window.infokanDB.delete('alarms', a.id);
            showToast('Alarm dihapus', '🗑️');
            refreshScheduleView();
          });

          alarmListEl.appendChild(row);
        });
      }
    }

    // 2. Render Timeline Schedules (With real-time line-through & opacity)
    const now = new Date();
    const currentDayName = getIndonesianDayName(now.getDay());
    const currentHourMin = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    let filtered = schedules;
    if (state.dayFilter !== 'all') {
      filtered = schedules.filter(s => s.dayOfWeek === state.dayFilter);
    }
    // Sort by startTime
    filtered.sort((a, b) => a.startTime.localeCompare(b.startTime));

    if (filtered.length === 0) {
      schedListEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon-wrap">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div class="empty-title">Belum Ada Jadwal</div>
          <div class="empty-desc">Tambahkan jadwal mata kuliah, rapat, atau jadwal shift kerja Anda.</div>
        </div>
      `;
      return;
    }

    schedListEl.innerHTML = '';
    filtered.forEach(s => {
      const isToday = s.dayOfWeek === currentDayName;
      const isPast = isToday && s.endTime && (s.endTime < currentHourMin);

      const item = document.createElement('div');
      item.className = `timeline-item ${isPast ? 'timeline-past' : ''}`;

      item.innerHTML = `
        <div class="timeline-dot">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--cyan-400)" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
        <div class="timeline-content">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <span style="font-size: 0.72rem; color: var(--cyan-400); font-weight: 700; text-transform: uppercase;">${s.dayOfWeek} • ${s.startTime} - ${s.endTime}</span>
            <button class="sheet-close-btn" style="width: 22px; height: 22px; font-size: 0.68rem;" data-del-sched="${s.id}">&times;</button>
          </div>
          <div class="timeline-title" style="font-size: 0.95rem; font-weight: 700; color: var(--text-main); margin-top: 2px;">${s.title}</div>
          ${s.location ? `<div style="font-size: 0.75rem; color: var(--text-dim); margin-top: 2px;">📍 ${s.location}</div>` : ''}
          ${isPast ? `<div style="font-size: 0.7rem; color: var(--text-dim); margin-top: 4px; font-style: italic;">✓ Selesai</div>` : ''}
        </div>
      `;

      item.querySelector('[data-del-sched]')?.addEventListener('click', async () => {
        window.soundEngine.playClick();
        await window.infokanDB.delete('schedules', s.id);
        showToast('Jadwal dihapus', '🗑️');
        refreshScheduleView();
        refreshDashboard();
      });

      schedListEl.appendChild(item);
    });
  }

  // Dashboard Schedule Mini-Widget
  async function renderDashboardScheduleWidget() {
    const container = document.getElementById('dashScheduleWidgetContent');
    if (!container) return;

    const schedules = await window.infokanDB.getAll('schedules');
    const now = new Date();
    const currentDayName = getIndonesianDayName(now.getDay());
    const currentHourMin = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const todaySchedules = schedules
      .filter(s => s.dayOfWeek === currentDayName)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    if (todaySchedules.length === 0) {
      container.innerHTML = `
        <div style="font-size: 0.8rem; color: var(--text-dim); text-align: center; padding: 10px 0;">
          Tidak ada jadwal untuk hari ini (${currentDayName}). Waktu luang! 🎉
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    todaySchedules.slice(0, 3).forEach(s => {
      const isPast = s.endTime && (s.endTime < currentHourMin);
      const div = document.createElement('div');
      div.style.display = 'flex';
      div.style.alignItems = 'center';
      div.style.justifyContent = 'space-between';
      div.style.padding = '6px 0';
      div.style.borderBottom = '1px solid rgba(255, 255, 255, 0.04)';
      div.style.opacity = isPast ? '0.45' : '1';

      div.innerHTML = `
        <span style="font-size: 0.82rem; font-weight: 600; ${isPast ? 'text-decoration: line-through;' : ''}">${s.title}</span>
        <span style="font-size: 0.75rem; color: var(--cyan-400); font-family: monospace;">${s.startTime}</span>
      `;
      container.appendChild(div);
    });
  }

  // ===================== TASK MANAGEMENT =====================
  const modalTask = document.getElementById('modalTask');
  const btnOpenAddTask = document.getElementById('btnOpenAddTask');
  const btnCloseTaskModal = document.getElementById('btnCloseTaskModal');
  const formTaskModal = document.getElementById('formTaskModal');

  btnOpenAddTask?.addEventListener('click', () => {
    window.soundEngine.playClick();
    modalTask?.classList.add('open');
  });

  btnCloseTaskModal?.addEventListener('click', () => {
    modalTask?.classList.remove('open');
  });

  formTaskModal?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('taskTitleInput').value.trim();
    const deadlineDate = document.getElementById('taskDeadlineDateInput').value;
    const deadlineTime = document.getElementById('taskDeadlineTimeInput').value;
    const priority = document.getElementById('taskPrioritySelect').value;

    await window.infokanDB.add('tasks', {
      title,
      deadline: `${deadlineDate} ${deadlineTime}`,
      deadlineDate,
      priority,
      completed: 0
    });

    window.soundEngine.playSuccess();
    showToast(`Tugas "${title}" disimpan!`, '✅');
    formTaskModal.reset();
    modalTask?.classList.remove('open');
    refreshTasksView();
    refreshDashboard();
  });

  // Task Priority Filter Chips
  const taskPrioChips = document.querySelectorAll('#taskPriorityFilterChips .chip-btn');
  taskPrioChips.forEach(chip => {
    chip.addEventListener('click', () => {
      window.soundEngine.playClick();
      taskPrioChips.forEach(c => c.classList.remove('selected-rose'));
      chip.classList.add('selected-rose');
      state.taskPriorityFilter = chip.dataset.prio;
      refreshTasksView();
    });
  });

  async function refreshTasksView() {
    const listEl = document.getElementById('tasksListContainer');
    const counterEl = document.getElementById('taskCounterSubtitle');
    if (!listEl) return;

    const tasks = await window.infokanDB.getAll('tasks');
    const pendingCount = tasks.filter(t => !t.completed).length;
    if (counterEl) counterEl.textContent = `${pendingCount} tugas tersisa`;

    let filtered = tasks;
    if (state.taskPriorityFilter !== 'all') {
      filtered = tasks.filter(t => t.priority === state.taskPriorityFilter);
    }
    // Sort: uncompleted first, then nearest deadline
    filtered.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed - b.completed;
      return (a.deadline || '').localeCompare(b.deadline || '');
    });

    if (filtered.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon-wrap">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          </div>
          <div class="empty-title">Semua Tugas Beres!</div>
          <div class="empty-desc">Tidak ada tanggungan tugas saat ini. Santai atau tambah tugas baru.</div>
        </div>
      `;
      return;
    }

    listEl.innerHTML = '';
    filtered.forEach(t => {
      const item = document.createElement('div');
      item.className = `task-item ${t.completed ? 'completed' : ''}`;

      let prioBadge = '<span style="font-size: 0.68rem; padding: 2px 6px; border-radius: 6px; background: rgba(16, 185, 129, 0.15); color: var(--emerald-400);">Santai</span>';
      if (t.priority === 'tinggi') {
        prioBadge = '<span style="font-size: 0.68rem; padding: 2px 6px; border-radius: 6px; background: rgba(244, 63, 94, 0.15); color: var(--rose-400);">Mendesak 🔥</span>';
      } else if (t.priority === 'sedang') {
        prioBadge = '<span style="font-size: 0.68rem; padding: 2px 6px; border-radius: 6px; background: rgba(245, 158, 11, 0.15); color: var(--amber-400);">Sedang ⚡</span>';
      }

      item.innerHTML = `
        <div class="checkbox-custom ${t.completed ? 'checked' : ''}" data-toggle-task="${t.id}">
          ${t.completed ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#090d16" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
        </div>
        <div style="flex: 1; display: flex; flex-direction: column; gap: 2px;">
          <div class="task-title" style="font-size: 0.92rem; font-weight: 700; color: var(--text-main);">${t.title}</div>
          <div style="display: flex; align-items: center; gap: 8px; font-size: 0.72rem; color: var(--text-dim);">
            <span>⏰ ${t.deadline}</span>
            ${prioBadge}
          </div>
        </div>
        <button class="sheet-close-btn" style="width: 26px; height: 26px; font-size: 0.72rem;" data-del-task="${t.id}">&times;</button>
      `;

      item.querySelector('[data-toggle-task]')?.addEventListener('click', async () => {
        t.completed = t.completed ? 0 : 1;
        if (t.completed) {
          window.soundEngine.playSuccess();
          showToast(`Selesai: "${t.title}"! Kerja bagus! 🎉`, '🌟');
        } else {
          window.soundEngine.playClick();
        }
        await window.infokanDB.update('tasks', t);
        refreshTasksView();
        refreshDashboard();
      });

      item.querySelector('[data-del-task]')?.addEventListener('click', async () => {
        window.soundEngine.playClick();
        await window.infokanDB.delete('tasks', t.id);
        showToast('Tugas dihapus', '🗑️');
        refreshTasksView();
        refreshDashboard();
      });

      listEl.appendChild(item);
    });
  }

  // Dashboard Task Mini-Widget
  async function renderDashboardTaskWidget() {
    const container = document.getElementById('dashTaskWidgetContent');
    if (!container) return;

    const tasks = await window.infokanDB.getAll('tasks');
    const urgentPending = tasks
      .filter(t => !t.completed)
      .sort((a, b) => (a.deadline || '').localeCompare(b.deadline || ''))
      .slice(0, 3);

    if (urgentPending.length === 0) {
      container.innerHTML = `
        <div style="font-size: 0.8rem; color: var(--text-dim); text-align: center; padding: 10px 0;">
          Tidak ada tugas tertunda. Anda bebas tugas! ✨
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    urgentPending.forEach(t => {
      const div = document.createElement('div');
      div.style.display = 'flex';
      div.style.alignItems = 'center';
      div.style.justifyContent = 'space-between';
      div.style.padding = '6px 0';
      div.style.borderBottom = '1px solid rgba(255, 255, 255, 0.04)';

      div.innerHTML = `
        <span style="font-size: 0.82rem; font-weight: 600;">${t.title}</span>
        <span style="font-size: 0.72rem; color: ${t.priority === 'tinggi' ? 'var(--rose-400)' : 'var(--amber-400)'};">${t.deadline.split(' ')[0]}</span>
      `;
      container.appendChild(div);
    });
  }

  // ===================== OFFLINE ACTIVATION & SECRET DEV MODE =====================
  const shieldStatusBtn = document.getElementById('shieldStatusBtn');
  const shieldLabel = document.getElementById('shieldLabel');
  const modalActivation = document.getElementById('modalActivation');
  const btnCloseActivation = document.getElementById('btnCloseActivation');
  const actInstallId = document.getElementById('actInstallId');
  const btnCopyInstallId = document.getElementById('btnCopyInstallId');
  const actInputCode = document.getElementById('actInputCode');
  const btnVerifyActivation = document.getElementById('btnVerifyActivation');
  const btnWhatsAppSupport = document.getElementById('btnWhatsAppSupport');

  // Secret Dev Modal Elements
  const modalDevMode = document.getElementById('modalDevMode');
  const btnCloseDev = document.getElementById('btnCloseDev');
  const devPinSection = document.getElementById('devPinSection');
  const devUnlockedSection = document.getElementById('devUnlockedSection');
  const devPinInput = document.getElementById('devPinInput');
  const btnSubmitDevPin = document.getElementById('btnSubmitDevPin');
  const devGeneratedCode = document.getElementById('devGeneratedCode');
  const btnDevInstantActivate = document.getElementById('btnDevInstantActivate');

  async function checkAppActivation() {
    const isAct = await window.activationEngine.checkStatus();
    if (shieldStatusBtn && shieldLabel) {
      if (isAct) {
        shieldStatusBtn.classList.remove('unactivated');
        shieldLabel.textContent = 'Aktif (Pro)';
      } else {
        shieldStatusBtn.classList.add('unactivated');
        shieldLabel.textContent = 'Aktivasi';
      }
    }
  }

  shieldStatusBtn?.addEventListener('click', async () => {
    window.soundEngine.playClick();

    // Shield tap counter for secret dev mode (5 taps in < 1.5s)
    window.activationEngine.handleShieldTap(async () => {
      // 5 taps unlocked!
      window.soundEngine.playWarning();
      if (devPinInput) devPinInput.value = '';
      if (devPinSection) devPinSection.style.display = 'flex';
      if (devUnlockedSection) devUnlockedSection.style.display = 'none';
      modalDevMode?.classList.add('open');
    });

    // Also open regular activation modal if not currently opening dev mode
    const id = await window.activationEngine.getInstallationId();
    if (actInstallId) actInstallId.value = id;
    modalActivation?.classList.add('open');
  });

  btnCloseActivation?.addEventListener('click', () => {
    modalActivation?.classList.remove('open');
  });

  btnCopyInstallId?.addEventListener('click', () => {
    window.soundEngine.playClick();
    if (actInstallId) {
      navigator.clipboard?.writeText(actInstallId.value).then(() => {
        showToast('Installation ID disalin ke clipboard!', '📋');
      }).catch(() => {
        actInstallId.select();
        showToast('Teks terseleksi, silakan salin!', '📋');
      });
    }
  });

  btnWhatsAppSupport?.addEventListener('click', () => {
    window.soundEngine.playClick();
    window.activationEngine.openWhatsAppSupport();
  });

  btnVerifyActivation?.addEventListener('click', async () => {
    window.soundEngine.playClick();
    const code = actInputCode?.value || '';
    if (!code) {
      showToast('Masukkan kode aktivasi terlebih dahulu', '⚠️');
      return;
    }

    const result = await window.activationEngine.verifyCode(code);
    if (result.success) {
      window.soundEngine.playSuccess();
      showToast(result.message, '🎉');
      modalActivation?.classList.remove('open');
      checkAppActivation();
    } else {
      window.soundEngine.playWarning();
      showToast(result.message, '❌');
    }
  });

  // Secret Dev Mode: PIN Verification (PIN: 2026 - not written on UI)
  btnCloseDev?.addEventListener('click', () => {
    modalDevMode?.classList.remove('open');
  });

  btnSubmitDevPin?.addEventListener('click', async () => {
    window.soundEngine.playClick();
    const enteredPin = (devPinInput?.value || '').trim();
    if (enteredPin === '2026') {
      const id = await window.activationEngine.getInstallationId();
      const code = await window.activationEngine.calculateValidCode(id);

      if (devGeneratedCode) devGeneratedCode.value = code;
      if (devPinSection) devPinSection.style.display = 'none';
      if (devUnlockedSection) devUnlockedSection.style.display = 'flex';
      window.soundEngine.playSuccess();
    } else {
      window.soundEngine.playWarning();
      showToast('PIN Otorisasi Salah!', '⛔');
      if (devPinInput) devPinInput.value = '';
    }
  });

  btnDevInstantActivate?.addEventListener('click', async () => {
    window.soundEngine.playClick();
    const code = devGeneratedCode?.value;
    if (code) {
      await window.activationEngine.verifyCode(code);
      window.soundEngine.playSuccess();
      showToast('Perangkat Berhasil Diaktifkan Instan!', '🚀');
      modalDevMode?.classList.remove('open');
      modalActivation?.classList.remove('open');
      checkAppActivation();
    }
  });

  // ===================== SHORTCUTS & DEEP LINKING =====================
  function handleUrlShortcuts() {
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action') || (window.location.hash ? window.location.hash.replace('#', '') : null);

    if (action === 'new-expense') {
      switchTab('transactions');
      switchTransactionSubTab('expense');
    } else if (action === 'budget') {
      switchTab('budget');
    } else if (action === 'schedule') {
      switchTab('schedule');
    }
  }

  // ===================== INITIALIZATION =====================
  await window.infokanDB.init();
  resetDateTimePickers();
  await checkAppActivation();
  await refreshDashboard();
  handleUrlShortcuts();
});
