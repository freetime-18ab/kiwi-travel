import { ScheduleEvent, Booking, Expense, JournalEntry, Member, TodoItem } from "./types";

// 1. Schedules
export const mockSchedules: ScheduleEvent[] = [
  { id: 'p1', date: '2024-11-30', time: '18:00', title: 'Flight: TPE to CHC', category: 'transport', location: 'Taoyuan Airport', completed: true, notes: 'Air NZ' },
  { id: 'd1-1', date: '2024-12-01', time: '10:00', title: 'Pick up SUV Rental', category: 'transport', location: 'CHC Airport', completed: false, notes: 'Zero Excess Insurance' },
  { id: 'd1-2', date: '2024-12-01', time: '13:00', title: 'Supermarket & Sim Card', category: 'other', location: 'Christchurch', completed: false },
  { id: 'd1-3', date: '2024-12-01', time: '15:00', title: 'Check-in: Sudima Hotel', category: 'stay', location: 'Airport Hotel', completed: false },
  { id: 'd2-1', date: '2024-12-02', time: '09:00', title: 'Drive to West Coast', category: 'transport', location: 'Arthur\'s Pass', completed: false },
  { id: 'd2-2', date: '2024-12-02', time: '13:00', title: 'Hokitika Pizza & Lunch', category: 'food', location: 'Hokitika', completed: false },
  { id: 'd2-3', date: '2024-12-02', time: '16:00', title: 'Check-in: Rainforest Retreat', category: 'stay', location: 'Franz Josef', completed: false },
  { id: 'd3-1', date: '2024-12-03', time: '08:30', title: 'Heli-Hike Glacier Walk', category: 'sightseeing', location: 'Franz Josef Glacier', completed: false, notes: 'Weather dependent' },
  { id: 'd3-2', date: '2024-12-03', time: '15:00', title: 'Hot Pools Relax', category: 'sightseeing', location: 'Glacier Hot Pools', completed: false },
  { id: 'd3-3', date: '2024-12-03', time: '18:00', title: 'Stay: Rainforest Retreat', category: 'stay', location: 'Franz Josef', completed: false },
  { id: 'd4-1', date: '2024-12-04', time: '10:00', title: 'Drive to Wanaka', category: 'transport', location: 'Haast Pass', completed: false },
  { id: 'd4-2', date: '2024-12-04', time: '13:00', title: 'Roadside Cafe Lunch', category: 'food', location: 'Makarora', completed: false },
  { id: 'd4-3', date: '2024-12-04', time: '16:00', title: 'Check-in: Edgewater Resort', category: 'stay', location: 'Lake Wanaka', completed: false, notes: 'Lake View Room' },
  { id: 'd5-1', date: '2024-12-05', time: '10:00', title: 'Drive to Queenstown', category: 'transport', location: 'Crown Range Rd', completed: false },
  { id: 'd5-2', date: '2024-12-05', time: '14:00', title: 'Skyline Gondola + Luge', category: 'sightseeing', location: 'Bob\'s Peak', completed: false },
  { id: 'd5-3', date: '2024-12-05', time: '17:00', title: 'Check-in: Blue Peaks Apts', category: 'stay', location: 'Queenstown', completed: false, notes: '2 Bedroom Apt' },
  { id: 'd6-1', date: '2024-12-06', time: '11:00', title: 'TSS Earnslaw + Farm BBQ', category: 'sightseeing', location: 'Lake Wakatipu', completed: false, notes: 'All you can eat!' },
  { id: 'd6-2', date: '2024-12-06', time: '18:00', title: 'Stay: Blue Peaks Apts', category: 'stay', location: 'Queenstown', completed: false },
  { id: 'd7-1', date: '2024-12-07', time: '07:00', title: 'Milford Sound Day Tour', category: 'sightseeing', location: 'Fiordland', completed: false, notes: 'Bus Tour' },
  { id: 'd7-2', date: '2024-12-07', time: '20:00', title: 'Stay: Blue Peaks Apts', category: 'stay', location: 'Queenstown', completed: false },
  { id: 'd8-1', date: '2024-12-08', time: '10:00', title: 'Drive to Tekapo', category: 'transport', location: 'Lindis Pass', completed: false },
  { id: 'd8-2', date: '2024-12-08', time: '16:00', title: 'Check-in: Peppers Bluewater', category: 'stay', location: 'Lake Tekapo', completed: false },
  { id: 'd8-3', date: '2024-12-08', time: '18:00', title: 'Japanese Dinner', category: 'food', location: 'Kohan Restaurant', completed: false },
  { id: 'd9-1', date: '2024-12-09', time: '09:00', title: 'Drive to Christchurch', category: 'transport', location: 'Canterbury Plains', completed: false },
  { id: 'd9-2', date: '2024-12-09', time: '17:00', title: 'Check-in: Arcadia Motel', category: 'stay', location: 'Christchurch', completed: false },
  { id: 'd9-3', date: '2024-12-09', time: '19:00', title: 'Celebration Dinner', category: 'food', location: 'Christchurch CBD', completed: false },
];

// 2. Bookings
export const mockBookings: Booking[] = [
  { id: '1', type: 'flight', title: 'Air NZ (NZ78)', date: '2024-11-30', details: 'Taipei (TPE) ⇄ Christchurch (CHC)', isLocked: false },
  { id: '2', type: 'car', title: 'Large SUV (4 Pax)', date: 'Pickup: Dec 01', details: 'Airport Rental • Full Insurance', image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=400', isLocked: true },
  { id: '3', type: 'hotel', title: 'Sudima Christchurch Airport', date: 'Dec 01 (1 Night)', details: 'Near Airport • Easy access', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=400', isLocked: false },
  { id: '4', type: 'hotel', title: 'Rainforest Retreat', date: 'Dec 02-03 (2 Nights)', details: 'Franz Josef • Treehouse', image: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&q=80&w=400', isLocked: false },
  { id: '5', type: 'hotel', title: 'Edgewater Resort', date: 'Dec 04 (1 Night)', details: 'Wanaka • Lake View Room', image: 'https://images.unsplash.com/photo-1585543805890-6051f7829f98?auto=format&fit=crop&q=80&w=400', isLocked: false },
  { id: '6', type: 'hotel', title: 'Blue Peaks Apartments', date: 'Dec 05-07 (3 Nights)', details: 'Queenstown • 2 Bedroom Apt', image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=400', isLocked: false },
  { id: '7', type: 'hotel', title: 'Peppers Bluewater', date: 'Dec 08 (1 Night)', details: 'Lake Tekapo • Stargazing', image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80&w=400', isLocked: false },
  { id: '8', type: 'hotel', title: 'Arcadia Motel', date: 'Dec 09 (1 Night)', details: 'Christchurch • Packing day', image: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&q=80&w=400', isLocked: false },
];

// 3. Expenses
export const mockExpenses: Expense[] = [
  { id: '1', amount: 2100, currency: 'NZD', category: 'Transport', payerId: 'Me', date: '2024-11-10', description: 'Air NZ Flights (Pre-paid)' },
  { id: '2', amount: 550, currency: 'NZD', category: 'Transport', payerId: 'Me', date: '2024-12-01', description: 'Car Rental Deposit' },
  { id: '3', amount: 100, currency: 'NZD', category: 'Other', payerId: 'Me', date: '2024-12-01', description: 'Sim Cards & Snacks' },
];

// 4. Journals
export const mockJournals: JournalEntry[] = [
  { 
    id: '1', 
    date: '2024-12-01', 
    content: 'Just arrived in Christchurch! The air is so fresh here. We picked up our huge SUV, ready for the adventure.', 
    images: ['https://images.unsplash.com/photo-1589871161245-81eb6c761c28?auto=format&fit=crop&q=80&w=400'], 
    authorId: 'Me' 
  },
  { 
    id: '2', 
    date: '2024-12-02', 
    content: 'The drive to Arthur\'s pass was stunning. Saw our first Kea bird! It almost stole my sandwich.', 
    images: ['https://images.unsplash.com/photo-1524275038753-157c79e658cd?auto=format&fit=crop&q=80&w=400'], 
    authorId: 'Me' 
  },
  { 
    id: '3', 
    date: '2024-12-03', 
    content: 'Glacier hike got cancelled due to clouds :( But the hot pools were amazing.', 
    images: [], 
    authorId: 'Me' 
  }
];

// 5. Members
// Note: Default PIN is '1234' for simplicity in mock mode
export const mockMembers: Member[] = [
  { id: '1', name: 'Tom N.', avatar: 'https://picsum.photos/100/100?random=1', pin: '1234' },
  { id: '2', name: 'Isabelle', avatar: 'https://picsum.photos/100/100?random=2', pin: '1234' },
  { id: '3', name: 'Timmy', avatar: 'https://picsum.photos/100/100?random=3', pin: '1234' }
];

// 6. Todos (General)
export const mockTodos: TodoItem[] = [
  { id: '1', text: 'Buy Travel Insurance', completed: true },
  { id: '2', text: 'Book Wifi Egg', completed: false },
  { id: '3', text: 'Exchange JPY/NZD', completed: false },
  { id: '4', text: 'Download Offline Maps', completed: false },
];

// 7. Packing List
export const mockPackingList: TodoItem[] = [
    { id: 'p-1', text: 'Passport', completed: false },
    { id: 'p-2', text: 'Charger & Adapter', completed: false },
    { id: 'p-3', text: 'Toothbrush', completed: true },
    { id: 'p-4', text: 'Jacket', completed: false },
];