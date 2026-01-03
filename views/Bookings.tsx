import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Input } from '../components/UI';
import { Booking } from '../types';
import { db } from '../firebase';
import { mockBookings } from '../mockData';
import { collection, onSnapshot, query, orderBy, addDoc, deleteDoc, doc } from "firebase/firestore";

export const BookingsView: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  // New Booking State
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<Booking['type']>('ticket');
  const [newDate, setNewDate] = useState('');
  const [newDetails, setNewDetails] = useState('');
  const [newIsLocked, setNewIsLocked] = useState(false);
  
  // Modal State
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isRevealed, setIsRevealed] = useState(true);

  useEffect(() => {
    if (db) {
        const q = query(collection(db, "bookings"), orderBy("date"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
          setBookings(fetched);
          setLoading(false);
        });
        return () => unsubscribe();
    } else {
        setBookings(mockBookings);
        setLoading(false);
    }
  }, []);

  const handleAccess = (booking: Booking) => {
    // Open immediately, handle lock state inside modal
    setSelectedBooking(booking);
    setIsRevealed(!booking.isLocked);
  };

  const handleAdd = async () => {
      if (!newTitle || !newDate) return;

      const newBooking: Partial<Booking> = {
          title: newTitle,
          type: newType,
          date: newDate,
          details: newDetails || 'No details',
          isLocked: newIsLocked,
          image: newType === 'hotel' ? 'https://picsum.photos/400/300?random=10' : undefined
      };

      if (db) {
          await addDoc(collection(db, "bookings"), newBooking);
      } else {
          // Offline
          const mockItem = { ...newBooking, id: Math.random().toString(36).substr(2, 9) } as Booking;
          setBookings([...bookings, mockItem]);
      }

      // Reset
      setIsAdding(false);
      setNewTitle('');
      setNewDetails('');
      setNewDate('');
      setNewIsLocked(false);
  };

  const handleDelete = async () => {
      if (!selectedBooking) return;
      if (!window.confirm("Are you sure you want to delete this voucher?")) return;

      const id = selectedBooking.id;

      if (db) {
          await deleteDoc(doc(db, "bookings", id));
      } else {
          setBookings(bookings.filter(b => b.id !== id));
      }
      setSelectedBooking(null);
  };

  const handleUnlock = () => {
      // Simple unlock, could add PIN check here if desired but keeping it smooth for UX
      setIsRevealed(true);
  };

  return (
    <div className="flex flex-col gap-6 relative">
      <h2 className="text-2xl font-extrabold text-dark pl-1">Trip Vouchers</h2>
      
      {loading ? (
        <div className="text-center text-gray-400 py-10">Loading vouchers...</div>
      ) : bookings.map(booking => (
        <div key={booking.id}>
          {booking.type === 'flight' ? (
            // Flight Ticket Style
            <div 
              onClick={() => handleAccess(booking)}
              className="bg-white rounded-3xl shadow-soft border-2 border-card-border overflow-hidden relative cursor-pointer active:scale-95 transition-transform"
            >
              <div className="bg-black h-3 w-full"></div>
              <div className="p-5 flex justify-between items-stretch relative">
                 {/* Perforation circles */}
                 <div className="absolute -left-3 top-1/2 w-6 h-6 bg-paper rounded-full"></div>
                 <div className="absolute -right-3 top-1/2 w-6 h-6 bg-paper rounded-full"></div>
                 
                 <div className="flex-1 pr-4 border-r-2 border-dashed border-gray-200">
                    <div className="flex justify-between items-start mb-2">
                        <Badge color="bg-gray-100 text-gray-800">AIR NEW ZEALAND</Badge>
                        <i className="fas fa-plane text-gray-300 text-xl"></i>
                    </div>
                    <h3 className="text-2xl font-black text-dark tracking-tight">{booking.title}</h3>
                    <p className="text-sm text-gray-500 font-bold mt-1">{booking.details}</p>
                    <div className="mt-4 flex gap-4">
                        <div>
                            <span className="block text-[10px] text-gray-400 font-bold uppercase">Date</span>
                            <span className="font-bold text-dark">{booking.date}</span>
                        </div>
                        <div>
                            <span className="block text-[10px] text-gray-400 font-bold uppercase">Gate</span>
                            <span className="font-bold text-dark">--</span>
                        </div>
                    </div>
                 </div>
                 <div className="w-12 flex flex-col justify-center items-center text-gray-300">
                    <i className="fas fa-qrcode text-3xl"></i>
                 </div>
              </div>
            </div>
          ) : (
            // Standard Card Style (Hotel/Car)
            <Card 
              className="flex flex-col gap-0 overflow-hidden cursor-pointer" 
              noPadding 
              onClick={() => handleAccess(booking)}
            >
                {booking.image && (
                    <div className="h-32 bg-gray-200 bg-cover bg-center relative" style={{backgroundImage: `url(${booking.image})`}}>
                        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                        <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-dark shadow-sm">
                            <i className="fas fa-map-pin text-accent mr-1"></i> {booking.details.split('•')[0]}
                        </div>
                    </div>
                )}
                <div className="p-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <i className={`fas ${booking.type === 'hotel' ? 'fa-hotel' : 'fa-car'} text-secondary`}></i>
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{booking.type}</span>
                                {booking.isLocked && <i className="fas fa-lock text-xs text-accent"></i>}
                            </div>
                            <h3 className="text-lg font-bold text-dark">{booking.title}</h3>
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">{booking.details.split('•')[1] || booking.details}</p>
                    <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center text-sm">
                        <span className="font-bold text-primary">{booking.date}</span>
                    </div>
                </div>
            </Card>
          )}
        </div>
      ))}
      
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
                      <h3 className="text-xl font-black text-dark">Add Voucher</h3>
                      <button onClick={() => setIsAdding(false)} className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center"><i className="fas fa-times"></i></button>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                      <div className="flex gap-2">
                          {['flight', 'hotel', 'car'].map(t => (
                              <button 
                                key={t}
                                onClick={() => setNewType(t as Booking['type'])}
                                className={`flex-1 py-2 rounded-lg text-sm font-bold capitalize ${newType === t ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}
                              >
                                  {t}
                              </button>
                          ))}
                      </div>
                      <Input 
                        placeholder="Title (e.g. Flight to CHC)" 
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                      />
                      <Input 
                        placeholder="Date (e.g. 2024-12-01)" 
                        type="date"
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                      />
                      <Input 
                        placeholder="Details (e.g. Gate 5 / 2 Nights)" 
                        value={newDetails}
                        onChange={(e) => setNewDetails(e.target.value)}
                      />
                      
                      {/* Private Booking Toggle */}
                      <div 
                          onClick={() => setNewIsLocked(!newIsLocked)}
                          className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${newIsLocked ? 'border-accent bg-accent/10' : 'border-gray-100 bg-gray-50'}`}
                      >
                          <div className="flex items-center gap-2">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${newIsLocked ? 'bg-accent text-white' : 'bg-gray-200 text-gray-400'}`}>
                                  <i className={`fas ${newIsLocked ? 'fa-lock' : 'fa-lock-open'}`}></i>
                              </div>
                              <span className={`font-bold text-sm ${newIsLocked ? 'text-accent' : 'text-gray-500'}`}>Private Booking</span>
                          </div>
                          <div className={`w-10 h-6 rounded-full relative transition-colors ${newIsLocked ? 'bg-accent' : 'bg-gray-300'}`}>
                              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${newIsLocked ? 'left-5' : 'left-1'}`}></div>
                          </div>
                      </div>

                      <Button className="mt-2" onClick={handleAdd} fullWidth>Save Voucher</Button>
                  </div>
              </div>
          </div>
      )}

      {/* Booking Details Modal */}
      {selectedBooking && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setSelectedBooking(null)}>
              <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl transform transition-all scale-100 flex flex-col max-h-[85vh] relative overflow-hidden" onClick={e => e.stopPropagation()}>
                  {/* Header Image */}
                  {selectedBooking.type !== 'flight' && selectedBooking.image && (
                      <div className="h-48 bg-gray-200 bg-cover bg-center shrink-0" style={{backgroundImage: `url(${selectedBooking.image})`}}>
                           {!isRevealed && <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                                <i className="fas fa-lock text-4xl text-white/50"></i>
                           </div>}
                      </div>
                  )}
                  {selectedBooking.type === 'flight' && (
                      <div className="bg-primary h-24 flex items-center justify-center text-white text-4xl shrink-0">
                          <i className="fas fa-plane"></i>
                      </div>
                  )}
                  
                  {/* Locked Overlay for Body */}
                  {!isRevealed && (
                      <div className="absolute inset-x-0 bottom-0 top-48 z-10 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
                          <div className="bg-white p-4 rounded-full shadow-lg mb-4">
                              <i className="fas fa-lock text-2xl text-accent"></i>
                          </div>
                          <h3 className="font-bold text-dark text-lg mb-2">Private Booking</h3>
                          <p className="text-gray-500 text-sm mb-6">Enter PIN or tap to unlock details.</p>
                          <Button onClick={handleUnlock}>Unlock (007)</Button>
                      </div>
                  )}

                  <div className="p-6 overflow-y-auto">
                      <div className="flex justify-between items-start mb-2">
                        <Badge color="bg-gray-100 text-gray-500">{selectedBooking.type.toUpperCase()}</Badge>
                        <div className="flex gap-2">
                            {/* Delete Button */}
                            <button onClick={handleDelete} className="w-8 h-8 rounded-full bg-red-100 text-red-500 flex items-center justify-center hover:bg-red-200 transition-colors">
                                <i className="fas fa-trash-alt text-sm"></i>
                            </button>
                            {/* Close Button */}
                            <button onClick={() => setSelectedBooking(null)} className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition-colors">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                      </div>
                      <h3 className="text-2xl font-black text-dark leading-tight mb-4">{selectedBooking.title}</h3>
                      
                      <div className="space-y-4">
                          <div className="flex items-center gap-3 text-gray-600 bg-gray-50 p-3 rounded-xl">
                              <i className="fas fa-calendar-alt w-6 text-center text-primary text-lg"></i>
                              <div>
                                <div className="text-[10px] uppercase font-bold text-gray-400">Date</div>
                                <span className="font-bold text-dark">{selectedBooking.date}</span>
                              </div>
                          </div>
                          <div className="flex items-center gap-3 text-gray-600 bg-gray-50 p-3 rounded-xl">
                              <i className="fas fa-info-circle w-6 text-center text-primary text-lg"></i>
                              <div>
                                <div className="text-[10px] uppercase font-bold text-gray-400">Details</div>
                                <span className="font-bold text-dark">{selectedBooking.details}</span>
                              </div>
                          </div>
                          <div className="flex flex-col items-center justify-center pt-4 border-t border-dashed border-gray-200">
                               <div className="bg-white p-2 border-2 border-gray-100 rounded-xl mb-2">
                                  <i className="fas fa-qrcode text-6xl text-dark"></i>
                               </div>
                               <span className="text-xs font-mono bg-gray-100 px-3 py-1 rounded-full text-gray-500 font-bold tracking-widest">Q82-192-BB</span>
                          </div>
                      </div>
                      <Button fullWidth className="mt-6" onClick={() => setSelectedBooking(null)}>Done</Button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};