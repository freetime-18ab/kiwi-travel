import React, { useState, useEffect } from 'react';
import { Card, Button, Input } from '../components/UI';
import { JournalEntry, Member } from '../types';
import { db } from '../firebase';
import { mockJournals } from '../mockData';
import { collection, onSnapshot, query, orderBy, addDoc } from "firebase/firestore";

interface JournalViewProps {
    currentUser: Member;
}

export const JournalView: React.FC<JournalViewProps> = ({ currentUser }) => {
  const [logs, setLogs] = useState<JournalEntry[]>([]);
  const [isWriting, setIsWriting] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newImage, setNewImage] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'me'>('all');

  // Fetch Logic
  useEffect(() => {
    if (db) {
        const q = query(collection(db, "journals"), orderBy("date", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
          setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JournalEntry)));
        });
        return () => unsubscribe();
    } else {
        // Offline Mode: Sort mock data
        setLogs([...mockJournals].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }
  }, []);

  const handleSave = async () => {
    if (!newContent) return;

    const newLog: Partial<JournalEntry> = {
        date: new Date().toISOString().split('T')[0],
        content: newContent,
        images: newImage ? [newImage] : [],
        authorId: currentUser.id
    };

    if (db) {
        await addDoc(collection(db, "journals"), newLog);
    } else {
        // Mock Add
        const mockLog = { ...newLog, id: Math.random().toString(36).substr(2, 9) } as JournalEntry;
        setLogs([mockLog, ...logs]);
    }

    // Reset
    setIsWriting(false);
    setNewContent('');
    setNewImage('');
  };

  const addRandomPhoto = () => {
      const randomId = Math.floor(Math.random() * 100);
      setNewImage(`https://picsum.photos/400/300?random=${randomId}`);
  };

  const displayedLogs = filterMode === 'all' 
    ? logs 
    : logs.filter(log => log.authorId === currentUser.id || log.authorId === 'Me'); // 'Me' for legacy mock data support

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 pl-1">
          <h2 className="text-2xl font-extrabold text-dark">Travel Log</h2>
          
          {/* Toggle */}
          <div className="bg-white/50 p-1 rounded-xl flex text-xs font-bold border border-white">
                <button 
                    onClick={() => setFilterMode('all')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${filterMode === 'all' ? 'bg-white text-dark shadow-sm' : 'text-gray-400'}`}
                >
                    All
                </button>
                <button 
                    onClick={() => setFilterMode('me')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${filterMode === 'me' ? 'bg-white text-dark shadow-sm' : 'text-gray-400'}`}
                >
                    Mine
                </button>
          </div>
      </div>

      {/* List View (Masonry-ish) */}
      <div className="columns-2 gap-4 space-y-4 pb-24">
        {displayedLogs.length === 0 && (
            <div className="col-span-2 text-center text-gray-400 py-10 italic bg-white/50 rounded-3xl border-2 border-dashed border-gray-200">
                {filterMode === 'me' ? "You haven't written anything yet." : "No stories yet."}
            </div>
        )}
        {displayedLogs.map((log) => (
            <div key={log.id} className="break-inside-avoid animate-fade-in">
                <Card noPadding className="overflow-hidden group cursor-pointer hover:-translate-y-1 transition-transform duration-300">
                    {log.images && log.images.length > 0 && (
                        <div className="relative overflow-hidden">
                             <img src={log.images[0]} alt="Journal" className="w-full h-auto object-cover" />
                             <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                    )}
                    <div className="p-4">
                        <div className="flex justify-between items-center mb-2">
                            <div className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-md">{log.date}</div>
                            {/* Simple avatar bubble if author is not 'Me' in mock, or based on ID matching in real app. For now just a dot if it's the current user */}
                            {log.authorId === currentUser.id && (
                                <div className="w-2 h-2 rounded-full bg-primary"></div>
                            )}
                        </div>
                        <p className="text-sm font-bold text-dark leading-snug whitespace-pre-line">
                            {log.content}
                        </p>
                    </div>
                </Card>
            </div>
        ))}
      </div>

      {/* Floating Add Button */}
      <button 
        onClick={() => setIsWriting(true)}
        className="fixed bottom-32 right-6 w-14 h-14 bg-dark text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:bg-gray-700 active:scale-90 transition-all z-40"
      >
        <i className="fas fa-pen"></i>
      </button>

      {/* Write Modal */}
      {isWriting && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsWriting(false)}>
              <div 
                  className="bg-paper rounded-t-3xl sm:rounded-3xl w-full max-w-sm shadow-2xl animate-slide-up-fade p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
                  onClick={e => e.stopPropagation()}
              >
                  <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-3">
                          <img src={currentUser.avatar} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                          <div>
                              <h3 className="text-xl font-black text-dark">Dear Diary...</h3>
                              <p className="text-[10px] font-bold text-gray-400 uppercase">Writing as {currentUser.name}</p>
                          </div>
                      </div>
                      <button onClick={() => setIsWriting(false)} className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center"><i className="fas fa-times"></i></button>
                  </div>
                  
                  <textarea 
                    className="w-full bg-white border-2 border-card-border rounded-xl p-4 text-dark focus:outline-none focus:border-primary min-h-[150px] text-lg font-medium leading-relaxed"
                    placeholder="What happened today?"
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    autoFocus
                  />
                  
                  {newImage && (
                      <div className="relative rounded-xl overflow-hidden border-2 border-card-border">
                          <img src={newImage} alt="Preview" className="w-full h-40 object-cover" />
                          <button 
                            onClick={() => setNewImage('')}
                            className="absolute top-2 right-2 bg-white/80 p-2 rounded-full text-red-500 shadow-sm"
                          >
                              <i className="fas fa-trash"></i>
                          </button>
                      </div>
                  )}

                  <div className="flex items-center gap-2">
                      <Input 
                        placeholder="Image URL (optional)" 
                        value={newImage}
                        onChange={(e) => setNewImage(e.target.value)}
                        className="flex-1"
                      />
                      <button 
                        onClick={addRandomPhoto}
                        className="w-12 h-12 flex-shrink-0 bg-secondary text-white rounded-xl shadow-soft active:scale-95 flex items-center justify-center"
                        title="Add Random Photo"
                      >
                          <i className="fas fa-magic"></i>
                      </button>
                  </div>

                  <Button className="mt-2" onClick={handleSave} fullWidth>Save Entry</Button>
              </div>
          </div>
      )}
    </div>
  );
};