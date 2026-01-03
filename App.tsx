import React, { useState, useEffect, useRef } from 'react';
import { Layout } from './components/Layout';
import { ScheduleView } from './views/Schedule';
import { BookingsView } from './views/Bookings';
import { ExpenseView } from './views/Expense';
import { JournalView } from './views/Journal';
import { PlanningView } from './views/Planning';
import { MembersView } from './views/Members';
import { Member } from './types';
import { db, storage } from './firebase';
import { mockMembers } from './mockData';
import { collection, onSnapshot, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Button, Input } from './components/UI';

// Initialize firebase and database seeding
import { seedDatabase } from './firebase';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('schedule');
  const [members, setMembers] = useState<Member[]>([]);
  const [currentUser, setCurrentUser] = useState<Member | null>(null);
  
  // Login State
  const [loginStep, setLoginStep] = useState<'select' | 'pin'>('select');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Creation State (Login Screen)
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPin, setNewPin] = useState('');
  const [avatarSeed, setAvatarSeed] = useState(Math.floor(Math.random() * 1000));
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Attempt to seed database with initial New Zealand itinerary if empty
  useEffect(() => {
    seedDatabase().catch(console.error);
  }, []);

  // Fetch Members
  useEffect(() => {
    if (db) {
        const unsubscribe = onSnapshot(collection(db, "members"), (snapshot) => {
          const fetchedMembers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member));
          setMembers(fetchedMembers);
        });
        return () => unsubscribe();
    } else {
        setMembers(mockMembers);
    }
  }, []);

  // Persistent Login: Check local storage once members are loaded
  useEffect(() => {
    const savedUserId = localStorage.getItem('kiwi_user_id');
    if (savedUserId && members.length > 0 && !currentUser) {
        const foundUser = members.find(m => m.id === savedUserId);
        if (foundUser) {
            setCurrentUser(foundUser);
        }
    }
  }, [members, currentUser]);

  const handleUserSwitch = (member: Member) => {
    localStorage.setItem('kiwi_user_id', member.id); // Save to local storage
    setCurrentUser(member);
    setActiveTab('schedule'); // Reset tab on switch
  };

  const handleLoginSelect = (member: Member) => {
      setSelectedMember(member);
      setLoginStep('pin');
      setPinInput('');
      setPinError(false);
  };

  // Auto-login logic handled within onChange now
  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (val.length > 4) return;
      
      setPinInput(val);
      setPinError(false); // Clear error while typing

      // Check immediately when length is 4
      if (val.length === 4 && selectedMember) {
          const validPin = selectedMember.pin || '1234';
          
          if (val === validPin) {
              // Success: Small delay to let user see the 4th dot filled
              setTimeout(() => {
                  localStorage.setItem('kiwi_user_id', selectedMember.id); // Save to local storage
                  setCurrentUser(selectedMember);
                  setLoginStep('select');
                  setPinInput('');
              }, 100);
          } else {
              // Error
              setPinError(true);
              // Clear input after animation so they can try again
              setTimeout(() => {
                  setPinInput('');
                  setPinError(false);
              }, 800);
          }
      }
  };

  // --- CREATION LOGIC ---
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsUploading(true);
      try {
          if (storage) {
              const storageRef = ref(storage, `avatars/${Date.now()}_${file.name}`);
              const snapshot = await uploadBytes(storageRef, file);
              const downloadURL = await getDownloadURL(snapshot.ref);
              setCustomAvatarUrl(downloadURL);
          } else {
              // Offline Mock
              const reader = new FileReader();
              reader.onloadend = () => setCustomAvatarUrl(reader.result as string);
              reader.readAsDataURL(file);
          }
      } catch (error) {
          console.error("Upload failed", error);
          alert("Failed to upload image.");
      } finally {
          setIsUploading(false);
      }
  };

  const handleCreateProfile = async () => {
      if (!newName.trim()) return;
      
      const finalAvatar = customAvatarUrl || `https://picsum.photos/200/200?random=${avatarSeed}`;
      
      const newMember: Partial<Member> = {
          name: newName,
          avatar: finalAvatar,
          pin: newPin || '1234'
      };

      let createdMember: Member;

      if (db) {
          const docRef = await addDoc(collection(db, "members"), newMember);
          createdMember = { id: docRef.id, ...newMember } as Member;
      } else {
          createdMember = { ...newMember, id: Math.random().toString() } as Member;
          setMembers([...members, createdMember]);
      }

      // Automatically log in the new user and persist
      localStorage.setItem('kiwi_user_id', createdMember.id);
      setCurrentUser(createdMember);
      setIsCreating(false);
      setNewName('');
      setNewPin('');
      setCustomAvatarUrl('');
  };

  const renderContent = () => {
    if (!currentUser) return null;

    switch (activeTab) {
      case 'schedule': return <ScheduleView />;
      case 'bookings': return <BookingsView />;
      case 'expense': return <ExpenseView currentUser={currentUser} />;
      case 'journal': return <JournalView currentUser={currentUser} />;
      case 'planning': return <PlanningView currentUser={currentUser} />;
      case 'members': return <MembersView />;
      default: return <ScheduleView />;
    }
  };

  // --- Login Screen ---
  if (!currentUser) {
      return (
        <div className="min-h-screen bg-paper pattern-bg flex justify-center items-center p-4">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-black text-dark tracking-tight mb-2">Kiwi<span className="text-primary">Travel</span></h1>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Select your profile</p>
                </div>

                {loginStep === 'select' ? (
                    <div className="grid grid-cols-2 gap-4 animate-fade-in pb-10">
                        {members.map(member => (
                            <button 
                                key={member.id}
                                onClick={() => handleLoginSelect(member)}
                                className="bg-white p-4 rounded-3xl shadow-soft border-2 border-card-border flex flex-col items-center gap-3 hover:scale-105 active:scale-95 transition-all duration-200"
                            >
                                <div className="w-20 h-20 rounded-full border-4 border-white shadow-sm overflow-hidden">
                                    <img src={member.avatar} className="w-full h-full object-cover" />
                                </div>
                                <span className="font-bold text-dark">{member.name}</span>
                            </button>
                        ))}
                        
                        {/* New Profile Button */}
                        <button 
                            onClick={() => setIsCreating(true)}
                            className="bg-gray-50 border-2 border-dashed border-gray-300 p-4 rounded-3xl flex flex-col items-center justify-center gap-3 text-gray-400 hover:text-primary hover:border-primary hover:bg-white transition-all duration-200 min-h-[160px]"
                        >
                            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-2xl shadow-inner">
                                <i className="fas fa-plus"></i>
                            </div>
                            <span className="font-bold text-sm">New Profile</span>
                        </button>
                    </div>
                ) : (
                    // REMOVED 'overflow-hidden' from the div below to fix avatar clipping
                    <div className="bg-white p-8 rounded-3xl shadow-soft-deep border-2 border-card-border animate-slide-up-fade text-center relative">
                        <div className="w-20 h-20 rounded-full border-4 border-white shadow-md overflow-hidden mx-auto -mt-16 mb-4 bg-gray-200">
                             <img src={selectedMember?.avatar} className="w-full h-full object-cover" />
                        </div>
                        <h2 className="text-2xl font-bold text-dark mb-1">{selectedMember?.name}</h2>
                        <p className="text-xs text-gray-400 font-bold uppercase mb-6">Enter PIN to Login</p>

                        <div className={`flex justify-center gap-3 mb-4 ${pinError ? 'animate-shake' : ''}`}>
                             {[0, 1, 2, 3].map(i => (
                                 <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${pinInput.length > i ? 'bg-primary border-primary scale-110' : 'border-gray-200'}`}></div>
                             ))}
                        </div>

                        {/* Error Message */}
                        <div className="h-6 mb-2">
                            {pinError && (
                                <span className="text-xs font-bold text-red-500 animate-fade-in">
                                    <i className="fas fa-exclamation-circle mr-1"></i> Incorrect PIN
                                </span>
                            )}
                        </div>

                        <input 
                            type="password" 
                            inputMode="numeric" 
                            pattern="[0-9]*" 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            maxLength={4}
                            value={pinInput}
                            onChange={handlePinChange}
                            autoFocus
                        />
                        
                        <div className="flex gap-3 mt-4">
                            <Button variant="ghost" fullWidth onClick={() => { setLoginStep('select'); setPinInput(''); setPinError(false); }}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Profile Modal */}
            {isCreating && (
                <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsCreating(false)}>
                    <div 
                        className="bg-paper rounded-t-3xl sm:rounded-3xl w-full max-w-sm shadow-2xl animate-slide-up-fade p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-xl font-black text-dark">Create Profile</h3>
                            <button onClick={() => setIsCreating(false)} className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center"><i className="fas fa-times"></i></button>
                        </div>

                        {/* Hidden File Input */}
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            className="hidden" 
                            accept="image/*"
                        />
                        
                        {/* Avatar Upload */}
                        <div className="flex flex-col items-center gap-3 py-2">
                            <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                                <div className="w-24 h-24 rounded-full border-4 border-white shadow-soft overflow-hidden bg-gray-200 relative">
                                    <img src={customAvatarUrl || `https://picsum.photos/200/200?random=${avatarSeed}`} alt="Preview" className="w-full h-full object-cover" />
                                    <div className={`absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity ${isUploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                        {isUploading ? <i className="fas fa-spinner fa-spin text-white"></i> : <i className="fas fa-camera text-white"></i>}
                                    </div>
                                </div>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setAvatarSeed(Math.random()); setCustomAvatarUrl(''); }}
                                    className="absolute bottom-0 right-0 w-8 h-8 bg-secondary text-white rounded-full flex items-center justify-center shadow-md active:scale-90 transition-transform z-10"
                                >
                                    <i className="fas fa-dice"></i>
                                </button>
                            </div>
                            <p className="text-xs text-gray-400 font-bold uppercase">Tap to upload</p>
                        </div>

                        <div className="flex flex-col gap-3">
                            <Input 
                                label="Name"
                                placeholder="Your Name" 
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                autoFocus
                            />
                            <Input 
                                label="Create PIN (4 digits)"
                                placeholder="e.g. 1234" 
                                type="tel"
                                maxLength={4}
                                value={newPin}
                                onChange={(e) => setNewPin(e.target.value)}
                                className="tracking-widest font-mono"
                            />
                            <Button className="mt-4" onClick={handleCreateProfile} fullWidth>
                                Create & Login
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
      );
  }

  return (
    <Layout 
      activeTab={activeTab} 
      onTabChange={setActiveTab}
      currentUser={currentUser}
      members={members}
      onSwitchUser={handleUserSwitch}
    >
      <div className="animate-fade-in">
        {renderContent()}
      </div>
    </Layout>
  );
};

export default App;