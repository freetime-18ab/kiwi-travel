import React, { useState, useEffect, useRef } from 'react';
import { Card, Input, Button } from '../components/UI';
import { Member } from '../types';
import { db, storage } from '../firebase';
import { mockMembers } from '../mockData';
import { collection, onSnapshot, addDoc, updateDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export const MembersView: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  
  // Create State
  const [isInviting, setIsInviting] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPin, setNewPin] = useState('');
  const [avatarSeed, setAvatarSeed] = useState(Math.floor(Math.random() * 1000));
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  
  // File Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Edit State
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editName, setEditName] = useState('');
  const [editPin, setEditPin] = useState('');

  useEffect(() => {
    if (db) {
        const unsubscribe = onSnapshot(collection(db, "members"), (snapshot) => {
          setMembers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member)));
        });
        return () => unsubscribe();
    } else {
        setMembers(mockMembers);
    }
  }, []);

  // --- IMAGE UPLOAD ---
  const handleAvatarClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsUploading(true);

      try {
          if (storage) {
              // Upload to Firebase Storage
              const storageRef = ref(storage, `avatars/${Date.now()}_${file.name}`);
              const snapshot = await uploadBytes(storageRef, file);
              const downloadURL = await getDownloadURL(snapshot.ref);
              setCustomAvatarUrl(downloadURL);
          } else {
              // Offline/Mock: Convert to Base64
              const reader = new FileReader();
              reader.onloadend = () => {
                  setCustomAvatarUrl(reader.result as string);
              };
              reader.readAsDataURL(file);
          }
      } catch (error) {
          console.error("Upload failed", error);
          alert("Failed to upload image. Please try again.");
      } finally {
          setIsUploading(false);
      }
  };

  // --- CREATE ---
  const handleInvite = async () => {
      if (!newName.trim()) return;

      const finalAvatar = customAvatarUrl.trim() 
        ? customAvatarUrl 
        : `https://picsum.photos/200/200?random=${avatarSeed}`;

      const newMember: Partial<Member> = {
          name: newName,
          avatar: finalAvatar,
          pin: newPin || '0000'
      };

      if (db) {
          await addDoc(collection(db, "members"), newMember);
      } else {
          const mockMember = { ...newMember, id: Math.random().toString() } as Member;
          setMembers([...members, mockMember]);
      }

      setNewName('');
      setNewPin('');
      setCustomAvatarUrl('');
      setAvatarSeed(Math.floor(Math.random() * 1000));
      setIsInviting(false);
  };

  // --- EDIT ---
  const openEditModal = (member: Member) => {
      setEditingMember(member);
      setEditName(member.name);
      setEditPin(member.pin || '');
  };

  const handleUpdate = async () => {
      if (!editingMember || !editName.trim()) return;

      if (db) {
          await updateDoc(doc(db, "members", editingMember.id), {
              name: editName,
              pin: editPin || '0000' // Ensure there is always a PIN
          });
      } else {
          // Mock Update
          setMembers(members.map(m => m.id === editingMember.id ? { ...m, name: editName, pin: editPin } : m));
      }

      setEditingMember(null);
  };

  const handleShare = () => {
      const url = window.location.href;
      // TS Fix: navigator.share is not standard property in all environments
      if ((navigator as any).share) {
          (navigator as any).share({
              title: 'Join my KiwiTravel Trip!',
              text: 'Help me plan our New Zealand adventure.',
              url: url,
          }).catch(console.error);
      } else {
          navigator.clipboard.writeText(url);
          alert('Link copied to clipboard! Send it to your friends.');
      }
  };

  const shuffleAvatar = () => {
      setAvatarSeed(Math.floor(Math.random() * 1000));
      setCustomAvatarUrl('');
  };

  const previewImage = customAvatarUrl.trim() 
    ? customAvatarUrl 
    : `https://picsum.photos/200/200?random=${avatarSeed}`;

  return (
    <div className="relative">
        <div className="flex justify-between items-center mb-6 pl-1">
            <h2 className="text-2xl font-extrabold text-dark">Travel Team</h2>
            <button 
                onClick={handleShare}
                className="w-10 h-10 rounded-full bg-white border-2 border-card-border text-primary shadow-sm active:scale-95 flex items-center justify-center transition-all"
            >
                <i className="fas fa-share-alt"></i>
            </button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
            {members.map(member => (
                <Card key={member.id} className="flex flex-col items-center py-6 gap-3 animate-fade-in relative group">
                    {/* Edit Button */}
                    <button 
                        onClick={(e) => { e.stopPropagation(); openEditModal(member); }}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full text-gray-300 hover:text-primary hover:bg-gray-100 flex items-center justify-center transition-all"
                    >
                        <i className="fas fa-cog"></i>
                    </button>

                    <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden border-4 border-white shadow-md">
                        <img src={member.avatar} alt="Avatar" className="w-full h-full object-cover"/>
                    </div>
                    <div className="text-center">
                        <h3 className="font-bold text-dark text-lg leading-tight">{member.name}</h3>
                        <p className="text-xs text-gray-500 font-bold uppercase mt-1">Traveler</p>
                    </div>
                </Card>
            ))}

            {/* Add Button Card */}
            <Card 
                onClick={() => setIsInviting(true)}
                className="flex flex-col items-center justify-center gap-2 border-dashed border-gray-300 text-gray-400 cursor-pointer hover:bg-gray-50 min-h-[180px] hover:border-primary/50 hover:text-primary transition-colors"
            >
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-1">
                    <i className="fas fa-plus text-xl"></i>
                </div>
                <span className="font-bold text-sm">Add Traveler</span>
            </Card>
        </div>

        {/* Add Traveler Modal */}
        {isInviting && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsInviting(false)}>
              <div 
                  className="bg-paper rounded-t-3xl sm:rounded-3xl w-full max-w-sm shadow-2xl animate-slide-up-fade p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto"
                  onClick={e => e.stopPropagation()}
              >
                  <div className="flex justify-between items-center">
                      <h3 className="text-xl font-black text-dark">New Traveler</h3>
                      <button onClick={() => setIsInviting(false)} className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center"><i className="fas fa-times"></i></button>
                  </div>
                  
                  {/* Hidden File Input */}
                  <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      className="hidden" 
                      accept="image/*"
                  />

                  {/* Avatar Section */}
                  <div className="flex flex-col items-center gap-4 py-2">
                      <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                          <div className="w-24 h-24 rounded-full border-4 border-white shadow-soft overflow-hidden bg-gray-200 relative">
                              <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                              
                              {/* Upload Overlay */}
                              <div className={`absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity ${isUploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                  {isUploading ? (
                                      <i className="fas fa-spinner fa-spin text-white text-xl"></i>
                                  ) : (
                                      <i className="fas fa-camera text-white text-xl"></i>
                                  )}
                              </div>
                          </div>
                          
                          {/* Shuffle Button */}
                          <button 
                            onClick={(e) => { e.stopPropagation(); shuffleAvatar(); }}
                            className="absolute bottom-0 right-0 w-8 h-8 bg-secondary text-white rounded-full flex items-center justify-center shadow-md active:scale-90 transition-transform z-10"
                            title="Shuffle Random Avatar"
                          >
                              <i className="fas fa-dice"></i>
                          </button>
                      </div>
                      <p className="text-xs text-gray-400 font-bold uppercase">Tap avatar to upload</p>
                  </div>

                  <div className="flex flex-col gap-3">
                      <Input 
                        label="Name"
                        placeholder="e.g. Grandma" 
                        value={newName} 
                        onChange={(e) => setNewName(e.target.value)}
                        autoFocus
                      />

                      <Input 
                        label="Login PIN (4 digits)"
                        placeholder="e.g. 1234" 
                        type="tel"
                        maxLength={4}
                        value={newPin} 
                        onChange={(e) => setNewPin(e.target.value)}
                        className="tracking-widest font-mono"
                      />
                      
                      {/* Removed Custom URL Input */}

                      <Button className="mt-4" onClick={handleInvite} fullWidth>
                          Add to Team
                      </Button>
                  </div>
              </div>
          </div>
        )}

        {/* Edit Traveler Modal */}
        {editingMember && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setEditingMember(null)}>
              <div 
                  className="bg-paper rounded-t-3xl sm:rounded-3xl w-full max-w-sm shadow-2xl animate-slide-up-fade p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto"
                  onClick={e => e.stopPropagation()}
              >
                  <div className="flex justify-between items-center">
                      <h3 className="text-xl font-black text-dark">Edit Profile</h3>
                      <button onClick={() => setEditingMember(null)} className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center"><i className="fas fa-times"></i></button>
                  </div>
                  
                  <div className="flex flex-col items-center gap-4 py-2">
                      <div className="w-24 h-24 rounded-full border-4 border-white shadow-soft overflow-hidden bg-gray-200">
                          <img src={editingMember.avatar} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                      <p className="text-xs text-gray-400 font-bold uppercase">Avatar cannot be changed</p>
                  </div>

                  <div className="flex flex-col gap-3">
                      <Input 
                        label="Name"
                        value={editName} 
                        onChange={(e) => setEditName(e.target.value)}
                      />
                      <Input 
                        label="Login PIN (4 digits)"
                        type="tel"
                        maxLength={4}
                        value={editPin} 
                        onChange={(e) => setEditPin(e.target.value)}
                        className="tracking-widest font-mono"
                      />
                      
                      <Button className="mt-4" onClick={handleUpdate} fullWidth>Save Changes</Button>
                  </div>
              </div>
          </div>
        )}
        
        {/* Bottom spacer */}
        <div className="h-24"></div>
    </div>
  );
};