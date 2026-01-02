import React, { useState, useEffect } from 'react';
import { Card, Input, Button } from '../components/UI';
import { TodoItem, Member } from '../types';
import { db } from '../firebase';
import { mockTodos, mockPackingList } from '../mockData';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, where } from "firebase/firestore";

interface PlanningViewProps {
    currentUser: Member;
}

export const PlanningView: React.FC<PlanningViewProps> = ({ currentUser }) => {
  // General Todos State (Shared)
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTask, setNewTask] = useState('');

  // Packing List State (Personal)
  const [packingList, setPackingList] = useState<TodoItem[]>([]);
  const [newPackingItem, setNewPackingItem] = useState('');

  // Fetch Data
  useEffect(() => {
    if (db) {
        // Fetch Shared Todos
        const unsubTodos = onSnapshot(collection(db, "todos"), (snapshot) => {
          setTodos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TodoItem)));
        });

        // Fetch Personal Packing List
        // Note: For simplicity in this demo, we fetch all and filter client side or query by assignedTo
        // Here we use a query to only get items for currentUser
        const q = query(collection(db, "packing"), where("assignedTo", "==", currentUser.id));
        const unsubPacking = onSnapshot(q, (snapshot) => {
            setPackingList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TodoItem)));
        });

        return () => {
            unsubTodos();
            unsubPacking();
        };
    } else {
        setTodos(mockTodos);
        // Mock Filter: Show items assigned to me OR items with no assignment (legacy mock data)
        // In a real app, you'd migrate legacy data.
        setPackingList(mockPackingList.filter(item => 
            !item.assignedTo || item.assignedTo === currentUser.id
        ));
    }
  }, [currentUser.id]);

  // --- General Todo Logic (Shared) ---
  const toggleTodo = async (id: string, currentStatus: boolean) => {
    if (db) {
        await updateDoc(doc(db, "todos", id), { completed: !currentStatus });
    } else {
        setTodos(todos.map(t => t.id === id ? { ...t, completed: !currentStatus } : t));
    }
  };

  const addTask = async () => {
      if (!newTask.trim()) return;
      
      const newItem: Partial<TodoItem> = {
          text: newTask,
          completed: false,
          // Shared tasks don't strictly need assignedTo in this simple version
      };

      if (db) {
          await addDoc(collection(db, "todos"), newItem);
      } else {
          const mockItem = { ...newItem, id: Math.random().toString(36).substr(2, 9) } as TodoItem;
          setTodos([...todos, mockItem]);
      }
      setNewTask('');
  };

  // --- Packing List Logic (Personal) ---
  const togglePacking = async (id: string, currentStatus: boolean) => {
      if (db) {
          await updateDoc(doc(db, "packing", id), { completed: !currentStatus });
      } else {
          setPackingList(packingList.map(t => t.id === id ? { ...t, completed: !currentStatus } : t));
      }
  };

  const addPackingItem = async () => {
      if (!newPackingItem.trim()) return;
      
      const newItem: Partial<TodoItem> = {
          text: newPackingItem,
          completed: false,
          assignedTo: currentUser.id // Crucial: Assign to current user
      };

      if (db) {
          await addDoc(collection(db, "packing"), newItem);
      } else {
          const mockItem = { ...newItem, id: Math.random().toString(36).substr(2, 9) } as TodoItem;
          setPackingList([...packingList, mockItem]);
      }
      setNewPackingItem('');
  };

  const deletePacking = async (id: string) => {
      if (db) {
          await deleteDoc(doc(db, "packing", id));
      } else {
          setPackingList(packingList.filter(t => t.id !== id));
      }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-baseline justify-between pl-1">
        <h2 className="text-2xl font-extrabold text-dark">Checklist</h2>
      </div>
      
      {/* General Checklist (Shared) */}
      <Card>
        <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-400 text-xs uppercase tracking-wider">Group Tasks</h3>
        </div>
        <div className="flex items-center gap-2 mb-6">
            <div className="flex-1">
                <input 
                    placeholder="Add shared task..." 
                    className="w-full bg-gray-50 border-2 border-gray-200 rounded-2xl px-4 py-3 focus:outline-none focus:border-primary transition-colors text-dark placeholder-gray-400 font-bold text-sm"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addTask()}
                />
            </div>
            <button 
                onClick={addTask} 
                className="w-12 h-12 rounded-2xl bg-primary text-white shadow-soft active:scale-95 flex items-center justify-center transition-transform"
            >
                <i className="fas fa-plus"></i>
            </button>
        </div>
        
        <div className="flex flex-col gap-3">
            {todos.map(todo => (
                <div key={todo.id} className="flex items-center gap-3 p-2 rounded-xl transition-colors group">
                    <div 
                        onClick={() => toggleTodo(todo.id, todo.completed)}
                        className={`w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-90 ${
                            todo.completed 
                            ? 'bg-primary border-primary text-white' 
                            : 'bg-white border-gray-300 text-transparent hover:border-primary'
                        }`}
                    >
                        <i className="fas fa-check text-xs"></i>
                    </div>
                    <span className={`font-bold flex-1 text-lg select-text ${todo.completed ? 'text-gray-300 line-through' : 'text-dark'}`}>
                        {todo.text}
                    </span>
                </div>
            ))}
        </div>
      </Card>

      {/* Packing List (Personal) */}
      <Card className="bg-[#FEF9C3] border-[#FEF08A] shadow-none">
        <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-3">
                <div className="text-2xl text-[#854D0E]">
                    <i className="fas fa-suitcase"></i>
                </div>
                <div>
                    <h3 className="font-extrabold text-[#854D0E] text-lg">My Packing List</h3>
                    <p className="text-[10px] text-[#A16207] font-bold uppercase">For {currentUser.name}</p>
                </div>
             </div>
        </div>

        {/* Packing Input */}
        <div className="flex gap-2 mb-4">
            <input 
                className="flex-1 bg-white/60 border-2 border-transparent focus:border-[#CA8A04] focus:bg-white rounded-xl px-3 py-2 text-sm font-bold text-[#854D0E] placeholder-[#CA8A04]/50 focus:outline-none transition-all"
                placeholder="Add item..."
                value={newPackingItem}
                onChange={e => setNewPackingItem(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addPackingItem()}
            />
            <button 
                onClick={addPackingItem} 
                className="w-10 h-10 rounded-xl bg-[#854D0E] text-[#FEF9C3] flex items-center justify-center shadow-sm active:scale-95 transition-transform"
            >
                 <i className="fas fa-plus"></i>
            </button>
        </div>

        <div className="flex flex-col gap-2">
            {packingList.map(item => (
                <div key={item.id} className="flex items-center gap-3 group">
                     <div 
                        onClick={() => togglePacking(item.id, item.completed)}
                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all active:scale-90 ${
                            item.completed 
                            ? 'bg-[#854D0E] border-[#854D0E] text-[#FEF9C3]' 
                            : 'border-[#CA8A04] text-transparent hover:bg-[#CA8A04]/10'
                        }`}
                     >
                         <i className="fas fa-check text-[10px]"></i>
                     </div>
                     
                     <span className={`font-bold text-[#854D0E] flex-1 select-text ${item.completed ? 'line-through opacity-50' : ''}`}>
                         {item.text}
                     </span>
                     
                     <button 
                        onClick={() => deletePacking(item.id)} 
                        className="text-[#854D0E]/30 hover:text-[#854D0E] px-2 py-1 rounded-md hover:bg-[#854D0E]/10 transition-colors"
                     >
                         <i className="fas fa-times"></i>
                     </button>
                </div>
            ))}
            {packingList.length === 0 && (
                <div className="text-center text-[#854D0E]/50 text-sm italic py-2">
                    Empty list. Don't forget your passport!
                </div>
            )}
        </div>
      </Card>
      
      {/* Bottom spacer */}
      <div className="h-24"></div>
    </div>
  );
};