import React, { useState } from 'react';
import { Member } from '../types';
import { Button } from './UI';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  currentUser: Member | null;
  members: Member[];
  onSwitchUser: (member: Member) => void;
}

const TABS = [
  { id: 'schedule', icon: 'fa-calendar-alt', label: 'Plan' },
  { id: 'bookings', icon: 'fa-ticket-alt', label: 'Book' },
  { id: 'expense', icon: 'fa-wallet', label: 'Cost' },
  { id: 'journal', icon: 'fa-book-open', label: 'Log' },
  { id: 'planning', icon: 'fa-list-check', label: 'List' },
  { id: 'members', icon: 'fa-users', label: 'Team' },
];

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, currentUser, members, onSwitchUser }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // PIN Verification State
  const [pendingMember, setPendingMember] = useState<Member | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  const handleMemberClick = (member: Member) => {
    // If clicking self, do nothing (or close menu)
    if (currentUser?.id === member.id) {
        setShowUserMenu(false);
        return;
    }
    // Set pending member to trigger modal
    setPendingMember(member);
    setPinInput('');
    setPinError(false);
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.length > 4) return;
    
    setPinInput(val);
    setPinError(false);

    if (val.length === 4 && pendingMember) {
        const validPin = pendingMember.pin || '1234';
        
        if (val === validPin) {
            // Success
            setTimeout(() => {
                onSwitchUser(pendingMember);
                setPendingMember(null);
                setShowUserMenu(false);
                setPinInput('');
            }, 100);
        } else {
            // Error
            setPinError(true);
            setTimeout(() => {
                setPinInput('');
                setPinError(false);
            }, 800);
        }
    }
  };

  return (
    <div className="min-h-screen bg-paper pattern-bg flex justify-center">
      <div className="w-full max-w-md bg-paper min-h-screen relative shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <header className="px-6 py-6 flex justify-between items-center bg-paper sticky top-0 z-20">
            <div>
                <h1 className="text-2xl font-black text-dark tracking-tight">Kiwi<span className="text-primary">Travel</span></h1>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">New Zealand Road Trip</p>
            </div>
            
            {/* User Avatar / Switcher */}
            <div className="relative">
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="w-10 h-10 rounded-full bg-white border-2 border-card-border overflow-hidden active:scale-95 transition-transform shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                    {currentUser ? (
                      <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-200 animate-pulse"></div>
                    )}
                </button>
                {/* Online Status Dot */}
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
            </div>
        </header>

        {/* User Switcher Dropdown */}
        {showUserMenu && (
          <div 
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]" 
            onClick={() => setShowUserMenu(false)}
          >
            <div className="absolute top-20 right-4 w-64 bg-white rounded-2xl shadow-xl border-2 border-card-border p-2 animate-slide-up-fade" onClick={e => e.stopPropagation()}>
               <div className="px-3 py-2 border-b border-gray-100 mb-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Switch Profile</span>
               </div>
               <div className="flex flex-col gap-1 max-h-[300px] overflow-y-auto">
                 {members.map(member => (
                   <button
                     key={member.id}
                     onClick={() => handleMemberClick(member)}
                     className={`flex items-center gap-3 p-2 rounded-xl transition-colors ${currentUser?.id === member.id ? 'bg-primary/10 text-primary' : 'hover:bg-gray-50 text-dark'}`}
                   >
                     <img src={member.avatar} className="w-8 h-8 rounded-full border border-white shadow-sm object-cover" />
                     <span className="font-bold text-sm">{member.name}</span>
                     {currentUser?.id === member.id ? (
                        <i className="fas fa-check ml-auto text-xs"></i>
                     ) : (
                        <i className="fas fa-lock ml-auto text-xs text-gray-300"></i>
                     )}
                   </button>
                 ))}
               </div>
            </div>
          </div>
        )}

        {/* PIN Verification Modal */}
        {pendingMember && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setPendingMember(null)}>
                <div className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl flex flex-col items-center gap-4 relative overflow-hidden" onClick={e => e.stopPropagation()}>
                    <div className="w-16 h-16 rounded-full border-4 border-white shadow-md overflow-hidden -mt-10">
                        <img src={pendingMember.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                    <div className="text-center">
                        <h3 className="font-bold text-dark text-lg">Hello, {pendingMember.name}</h3>
                        <p className="text-xs text-gray-400">Enter your 4-digit PIN to switch.</p>
                    </div>

                    <div className={`flex justify-center gap-2 my-2 ${pinError ? 'animate-shake' : ''}`}>
                         {[0, 1, 2, 3].map(i => (
                             <div key={i} className={`w-4 h-4 rounded-full border-2 transition-colors ${pinInput.length > i ? 'bg-primary border-primary' : 'border-gray-300'}`}></div>
                         ))}
                    </div>

                    <div className="h-4">
                        {pinError && (
                            <span className="text-xs font-bold text-red-500 animate-fade-in">
                                <i className="fas fa-exclamation-circle mr-1"></i> Incorrect PIN
                            </span>
                        )}
                    </div>

                    {/* Hidden input overlay covering the whole modal for easier tapping */}
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
                    
                    <div className="flex gap-2 w-full mt-2 relative z-10">
                        <Button variant="ghost" className="flex-1" onClick={() => setPendingMember(null)}>Cancel</Button>
                    </div>
                </div>
            </div>
        )}

        {/* Content */}
        <main className="flex-1 px-6 pb-32 overflow-y-auto no-scrollbar scroll-smooth">
          {children}
        </main>

        {/* Bottom Nav */}
        <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/90 backdrop-blur-md border-t border-card-border px-2 py-2 pb-6 z-40 rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <div className="flex justify-around items-center">
            {TABS.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all duration-300 ${isActive ? 'text-primary -translate-y-2' : 'text-gray-300 hover:text-gray-400'}`}
                >
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${isActive ? 'bg-primary text-white shadow-soft' : 'bg-transparent text-xl'}`}>
                     <i className={`fas ${tab.icon} ${isActive ? 'text-sm' : ''}`}></i>
                  </div>
                  {isActive && <span className="text-[10px] font-bold animate-fade-in">{tab.label}</span>}
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
};