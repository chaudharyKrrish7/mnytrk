import { useState, useEffect } from 'react';

// --- TypeScript Interfaces ---
interface Transaction {
  id: number;
  date: string;
  description: string;
  category: string;
  type: string;
  amount: number;
  runningBalance?: number;
}

interface FormData {
  date: string;
  description: string;
  category: string;
  type: string;
  amount: string;
}

interface Budgets {
  [key: string]: number;
}

// Default data for the very first time the app is opened
const defaultTransactions: Transaction[] = [
  { id: 1, date: '2026-05-01', description: 'Allowance', category: 'Income', type: 'in', amount: 13000 },
  { id: 2, date: '2026-05-02', description: 'Conditioner, Sunscreen', category: 'Personal', type: 'out', amount: 492 },
  { id: 3, date: '2026-05-03', description: 'Thali', category: 'Food', type: 'out', amount: 290 },
  { id: 4, date: '2026-05-04', description: 'Rapido', category: 'Travel', type: 'out', amount: 62 },
  { id: 5, date: '2026-05-05', description: 'Emergency Fund', category: 'Savings', type: 'out', amount: 2000 },
];

const defaultBudgets: Budgets = {
  Food: 3000,
  Travel: 1500,
  Personal: 2000,
  Savings: 5000,
};

export default function App() {
  // --- State Management with LocalStorage ---
  
  // 1. Initialize Transactions from LocalStorage
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('financeTracker_transactions');
      if (saved) {
        return JSON.parse(saved);
      }
    }
    return defaultTransactions;
  });

  // 2. Initialize Budgets from LocalStorage
  const [budgets, setBudgets] = useState<Budgets>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('financeTracker_budgets');
      if (saved) {
        return JSON.parse(saved);
      }
    }
    return defaultBudgets;
  });

  const [formData, setFormData] = useState<FormData>({
    date: new Date().toISOString().split('T')[0],
    description: '',
    category: 'Food',
    type: 'out',
    amount: ''
  });

  const expenseCategories = ['Savings', 'Food', 'Travel', 'Personal'];

  // --- Auto-Save to LocalStorage ---
  
  // Save transactions whenever they change
  useEffect(() => {
    localStorage.setItem('financeTracker_transactions', JSON.stringify(transactions));
  }, [transactions]);

  // Save budgets whenever they change
  useEffect(() => {
    localStorage.setItem('financeTracker_budgets', JSON.stringify(budgets));
  }, [budgets]);

  // --- Calculations ---
  const totalIncome = transactions.filter(t => t.type === 'in').reduce((sum, t) => sum + t.amount, 0);
  const totalSavings = transactions.filter(t => t.category === 'Savings').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'out' && t.category !== 'Savings').reduce((sum, t) => sum + t.amount, 0);
  const currentBalance = totalIncome - totalExpenses - totalSavings;

  const categorySpends = expenseCategories.reduce((acc, cat) => {
    acc[cat] = transactions.filter(t => t.category === cat && t.type === 'out').reduce((sum, t) => sum + t.amount, 0);
    return acc;
  }, {} as Record<string, number>);

  // --- Handlers ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleBudgetChange = (category: string, value: string) => {
    setBudgets({ ...budgets, [category]: Number(value) });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.description || !formData.amount) return;

    const newTx: Transaction = {
      id: Date.now(),
      date: formData.date,
      description: formData.description,
      category: formData.type === 'in' ? 'Income' : formData.category,
      type: formData.type,
      amount: parseFloat(formData.amount)
    };

    setTransactions([...transactions, newTx]);
    setFormData({ ...formData, description: '', amount: '', category: 'Food' });
  };

  const handleDelete = (id: number) => {
    setTransactions(transactions.filter(tx => tx.id !== id));
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to delete ALL transactions? This cannot be undone.")) {
      setTransactions([]); // The useEffect will automatically clear LocalStorage too!
    }
  };

  // Calculate running balances
  let runningBal = 0;
  const tableData = transactions.map(tx => {
    if (tx.type === 'in') runningBal += tx.amount;
    else runningBal -= tx.amount;
    return { ...tx, runningBalance: runningBal };
  });

  // --- UI Rendering ---
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 p-4 md:p-8">
      <div className="w-full mx-auto space-y-6">
        
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Finance Tracker</h1>
          <p className="text-slate-500 mt-1">Manage your budgets, expenses, and savings seamlessly.</p>
        </header>

        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
            <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">Main Balance</p>
            <p className="text-4xl font-bold text-slate-900 mt-2">₹{currentBalance}</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-2xl shadow-sm border border-emerald-200 flex flex-col justify-between">
            <p className="text-sm text-emerald-700 font-medium uppercase tracking-wider">Total Received</p>
            <p className="text-3xl font-bold text-emerald-900 mt-2">₹{totalIncome}</p>
          </div>
          <div className="bg-gradient-to-br from-rose-50 to-rose-100 p-6 rounded-2xl shadow-sm border border-rose-200 flex flex-col justify-between">
            <p className="text-sm text-rose-700 font-medium uppercase tracking-wider">Total Spent</p>
            <p className="text-3xl font-bold text-rose-900 mt-2">₹{totalExpenses}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl shadow-sm border border-blue-200 flex flex-col justify-between">
            <p className="text-sm text-blue-700 font-medium uppercase tracking-wider">Total Savings</p>
            <p className="text-3xl font-bold text-blue-900 mt-2">₹{totalSavings}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Main Content Area (Left 3 columns) */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Input Form */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-bold mb-5 text-slate-800">Log Transaction</h2>
              <form onSubmit={handleSubmit} className="flex flex-wrap gap-4 items-end">
                
                <div className="w-full md:w-32">
                  <label className="block text-xs text-slate-500 mb-1.5 font-medium">Type</label>
                  <select name="type" value={formData.type} onChange={handleInputChange} className="w-full p-2.5 border border-slate-300 rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all">
                    <option value="out">Money Out</option>
                    <option value="in">Money In</option>
                  </select>
                </div>
                
                <div className="w-full md:w-40">
                  <label className="block text-xs text-slate-500 mb-1.5 font-medium">Date</label>
                  <input type="date" name="date" value={formData.date} onChange={handleInputChange} className="w-full p-2.5 border border-slate-300 rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" required />
                </div>

                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs text-slate-500 mb-1.5 font-medium">Description</label>
                  <input type="text" name="description" value={formData.description} onChange={handleInputChange} placeholder="e.g. Groceries" className="w-full p-2.5 border border-slate-300 rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" required />
                </div>

                <div className="w-full md:w-40">
                  <label className="block text-xs text-slate-500 mb-1.5 font-medium">Category</label>
                  {formData.type === 'out' ? (
                    <select name="category" value={formData.category} onChange={handleInputChange} className="w-full p-2.5 border border-slate-300 rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all">
                      {expenseCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  ) : (
                    <input type="text" value="Income" disabled className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-100 text-slate-500 outline-none cursor-not-allowed" />
                  )}
                </div>

                <div className="w-full md:w-32">
                  <label className="block text-xs text-slate-500 mb-1.5 font-medium">Amount (₹)</label>
                  <input type="number" name="amount" value={formData.amount} onChange={handleInputChange} placeholder="0" min="0" className="w-full p-2.5 border border-slate-300 rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" required />
                </div>

                <div className="w-full md:w-auto">
                  <button type="submit" className="w-full md:w-auto bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-sm hover:bg-blue-700 hover:shadow transition-all">
                    Add
                  </button>
                </div>

              </form>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-800">Recent Transactions</h2>
                {transactions.length > 0 && (
                  <button 
                    onClick={handleClearAll}
                    className="text-xs font-semibold text-rose-600 border border-rose-200 bg-white hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-slate-500 text-xs uppercase tracking-wider bg-white border-b border-slate-100">
                      <th className="p-4 font-semibold">Date</th>
                      <th className="p-4 font-semibold">Description</th>
                      <th className="p-4 font-semibold">Category</th>
                      <th className="p-4 font-semibold text-right">Amount</th>
                      <th className="p-4 font-semibold text-right">Balance</th>
                      <th className="p-4 font-semibold text-center w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tableData.slice().reverse().map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="p-4 text-sm text-slate-500 whitespace-nowrap">{tx.date}</td>
                        <td className="p-4 text-sm text-slate-900 font-medium">{tx.description}</td>
                        <td className="p-4 text-sm">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold tracking-wide ${
                            tx.category === 'Savings' ? 'bg-blue-100 text-blue-700' :
                            tx.type === 'in' ? 'bg-emerald-100 text-emerald-700' : 
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {tx.category}
                          </span>
                        </td>
                        <td className={`p-4 text-sm text-right font-semibold whitespace-nowrap ${tx.type === 'in' ? 'text-emerald-600' : 'text-slate-900'}`}>
                          {tx.type === 'in' ? '+' : '-'}₹{tx.amount}
                        </td>
                        <td className="p-4 text-sm text-right text-slate-500 font-medium whitespace-nowrap">
                          ₹{tx.runningBalance}
                        </td>
                        <td className="p-4 text-center">
                          <button 
                            onClick={() => handleDelete(tx.id)}
                            className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                            title="Delete entry"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                    {tableData.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400 text-sm">No transactions logged yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Sidebar / Budget Panel (Right Column) */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 sticky top-6">
              <h2 className="text-lg font-bold mb-5 text-slate-800">Monthly Budgets</h2>
              <div className="space-y-6">
                {expenseCategories.map(cat => {
                  const spent = categorySpends[cat] || 0;
                  const limit = budgets[cat];
                  const percent = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
                  
                  let barColor = 'bg-blue-500';
                  if (cat !== 'Savings') {
                    if (percent > 90) barColor = 'bg-rose-500';
                    else if (percent > 75) barColor = 'bg-amber-400';
                  } else {
                    barColor = 'bg-emerald-500';
                  }

                  return (
                    <div key={cat} className="space-y-2">
                      <div className="flex justify-between items-end">
                        <label className="text-sm font-bold text-slate-700">{cat}</label>
                        <div className="text-xs text-slate-500 text-right">
                          <span className="font-semibold text-slate-900">₹{spent}</span>
                          <span className="mx-1">/</span>
                          <input 
                            type="number" 
                            value={budgets[cat]} 
                            onChange={(e) => handleBudgetChange(cat, e.target.value)}
                            className="w-16 text-right border-b border-slate-300 focus:border-blue-500 outline-none bg-transparent"
                            title={`Set ${cat} budget`}
                          />
                        </div>
                      </div>
                      
                      <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${barColor}`} 
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                      
                      {cat !== 'Savings' && spent > limit && limit > 0 && (
                        <p className="text-xs text-rose-500 font-medium mt-1">Over budget by ₹{spent - limit}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}