import React, { useState, useEffect } from 'react';
import { Card, Button, Input } from '../components/UI';
import { Expense, Member } from '../types';
import { db } from '../firebase';
import { mockExpenses } from '../mockData';
import { collection, onSnapshot, addDoc, query, orderBy, deleteDoc, doc } from "firebase/firestore";

interface ExpenseViewProps {
    currentUser: Member;
}

export const ExpenseView: React.FC<ExpenseViewProps> = ({ currentUser }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newAmount, setNewAmount] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [currency, setCurrency] = useState<'NZD'|'TWD'>('NZD');
  
  // View Filter: 'all' or 'me'
  const [filterMode, setFilterMode] = useState<'all' | 'me'>('all');

  // Exchange rate assumption: 1 NZD = 20 TWD
  const RATE = 20;

  useEffect(() => {
    if (db) {
        const q = query(collection(db, "expenses"), orderBy("date", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
          setExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense)));
        });
        return () => unsubscribe();
    } else {
        setExpenses(mockExpenses);
    }
  }, []);

  const handleSave = async () => {
    if (!newAmount || !newDesc) return;
    
    const newExpenseObj = {
        amount: parseFloat(newAmount),
        currency,
        category: 'Other', // Simplified for demo
        payerId: currentUser.id, // Assign to current user
        date: new Date().toISOString().split('T')[0],
        description: newDesc
    };

    if (db) {
        await addDoc(collection(db, "expenses"), newExpenseObj);
    } else {
        // Offline Mock Add
        const mockId = Math.random().toString(36).substr(2, 9);
        setExpenses([{ ...newExpenseObj, id: mockId } as Expense, ...expenses]);
    }

    setIsAdding(false);
    setNewAmount('');
    setNewDesc('');
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!window.confirm("Delete this expense record?")) return;

      if (db) {
          await deleteDoc(doc(db, "expenses", id));
      } else {
          setExpenses(expenses.filter(ex => ex.id !== id));
      }
  };

  const displayedExpenses = filterMode === 'all' 
    ? expenses 
    // Filter for current user. Note: Mock data might use 'Me', real data uses IDs. We handle both loosely.
    : expenses.filter(e => e.payerId === currentUser.id || e.payerId === 'Me');

  const totalNZD = displayedExpenses.reduce((acc, curr) => {
      const amount = curr.currency === 'NZD' ? curr.amount : curr.amount / RATE;
      return acc + amount;
  }, 0);
  
  const totalTWD = totalNZD * RATE;

  return (
    <div className="flex flex-col gap-6 relative">
      
      {/* Dashboard */}
      <Card className="bg-dark text-white border-none shadow-soft-deep" noPadding>
        <div className="p-6">
            <div className="flex justify-between items-start mb-2">
                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest">
                    {filterMode === 'all' ? 'Group Total' : 'My Spending'}
                </h3>
                {/* Toggle */}
                <div className="bg-white/10 p-1 rounded-lg flex text-[10px] font-bold">
                    <button 
                        onClick={() => setFilterMode('all')}
                        className={`px-3 py-1 rounded-md transition-all ${filterMode === 'all' ? 'bg-white text-dark shadow-sm' : 'text-gray-400 hover:text-white'}`}
                    >
                        Group
                    </button>
                    <button 
                        onClick={() => setFilterMode('me')}
                        className={`px-3 py-1 rounded-md transition-all ${filterMode === 'me' ? 'bg-white text-dark shadow-sm' : 'text-gray-400 hover:text-white'}`}
                    >
                        Me
                    </button>
                </div>
            </div>
            
            <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-white">NT$ {totalTWD.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
            </div>
             <p className="text-xs text-gray-400 mt-1">
                 {filterMode === 'all' ? `Per Person (approx. NZD $${(totalNZD/3).toLocaleString(undefined, {maximumFractionDigits: 0})})` : `(NZD $${totalNZD.toLocaleString(undefined, {maximumFractionDigits: 0})})`}
             </p>

            <div className="mt-4 flex gap-4">
                <div className="bg-white/10 px-3 py-2 rounded-xl flex-1">
                    <div className="text-[10px] text-gray-300 uppercase">Paid</div>
                    <div className="font-bold">NT$ {(totalTWD).toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
                </div>
                {filterMode === 'all' && (
                    <div className="bg-white/10 px-3 py-2 rounded-xl flex-1">
                        <div className="text-[10px] text-gray-300 uppercase">Share</div>
                        <div className="font-bold text-accent">NT$ {(totalTWD / 3).toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
                    </div>
                )}
            </div>
        </div>
      </Card>

      {/* List */}
      <div className="flex flex-col gap-3">
        <h3 className="font-bold text-dark text-lg ml-1">History</h3>
        {displayedExpenses.length === 0 && (
            <div className="text-center text-gray-400 py-4 italic bg-white/50 rounded-2xl border-2 border-dashed border-gray-200">
                {filterMode === 'me' ? "You haven't paid for anything yet." : "No expenses recorded."}
            </div>
        )}
        {displayedExpenses.map(ex => (
            <div key={ex.id} className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm group">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-500">
                        {ex.category === 'Food' ? <i className="fas fa-utensils"></i> : 
                         ex.category === 'Transport' ? <i className="fas fa-plane"></i> :
                         <i className="fas fa-receipt"></i>}
                    </div>
                    <div>
                        <div className="font-bold text-dark">{ex.description}</div>
                        <div className="text-xs text-gray-400">
                            {ex.date} • <span className={`font-bold ${ex.payerId === currentUser.id ? 'text-primary' : ''}`}>
                                {ex.payerId === currentUser.id ? 'Me' : ex.payerId}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <div className="font-bold text-dark">{ex.currency} {ex.amount.toLocaleString()}</div>
                        {ex.currency !== 'TWD' && <div className="text-xs text-gray-400">≈ NT$ {(ex.amount * RATE).toLocaleString()}</div>}
                    </div>
                    {/* Delete Button */}
                    <button 
                        onClick={(e) => handleDelete(ex.id, e)}
                        className="w-8 h-8 rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 active:opacity-100 focus:opacity-100"
                        title="Delete"
                    >
                        <i className="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        ))}
      </div>

      {/* Spacer for bottom safe area */}
      <div className="h-24"></div>

      {/* Floating Add Button */}
      <button 
        onClick={() => setIsAdding(true)}
        className="fixed bottom-32 right-6 w-14 h-14 bg-dark text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:bg-gray-700 active:scale-90 transition-all z-40"
      >
        <i className="fas fa-plus"></i>
      </button>

      {/* Add Modal */}
      {isAdding && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsAdding(false)}>
              <div 
                  className="bg-paper rounded-t-3xl sm:rounded-3xl w-full max-w-sm shadow-2xl animate-slide-up-fade p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
                  onClick={e => e.stopPropagation()}
              >
                  <div className="flex justify-between items-center mb-2">
                      <h3 className="text-xl font-black text-dark">Record Expense</h3>
                      <button onClick={() => setIsAdding(false)} className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center"><i className="fas fa-times"></i></button>
                  </div>
                  
                  <div className="flex flex-col gap-4">
                      <div className="text-center py-2">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Amount</label>
                          <input 
                            type="number" 
                            placeholder="0" 
                            className="w-full bg-transparent text-center text-4xl font-extrabold text-dark focus:outline-none placeholder-gray-300" 
                            value={newAmount}
                            onChange={(e) => setNewAmount(e.target.value)}
                            autoFocus
                          />
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant={currency === 'NZD' ? 'primary' : 'ghost'} className="flex-1" onClick={() => setCurrency('NZD')}>NZD</Button>
                        <Button variant={currency === 'TWD' ? 'primary' : 'ghost'} className="flex-1" onClick={() => setCurrency('TWD')}>TWD</Button>
                      </div>
                      
                      <Input 
                        label="Description"
                        placeholder="e.g. Lunch at Burger Queen" 
                        value={newDesc}
                        onChange={(e) => setNewDesc(e.target.value)}
                      />
                      
                      <div className="bg-gray-50 p-3 rounded-xl flex items-center gap-3">
                         <img src={currentUser.avatar} className="w-8 h-8 rounded-full border border-white" />
                         <div className="text-xs text-gray-500">
                             Paid by <span className="font-bold text-dark">You ({currentUser.name})</span>
                         </div>
                      </div>

                      <Button className="mt-2" onClick={handleSave} fullWidth>Save Record</Button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};