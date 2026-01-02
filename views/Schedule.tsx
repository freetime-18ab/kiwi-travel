import React, { useState, useEffect } from 'react';
import { Card, Button, Input } from '../components/UI';
import { ScheduleEvent, CategoryType } from '../types';
import { db } from '../firebase';
import { mockSchedules } from '../mockData';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc } from "firebase/firestore";

// --- CONFIGURATION ---
// TODO: For production, replace this with your OpenWeatherMap API Key
// Get one here: https://openweathermap.org/api
const OPEN_WEATHER_API_KEY = ""; 

const CATEGORY_COLORS: Record<string, string> = {
  transport: 'bg-blue-100 text-blue-600 border-blue-200',
  stay: 'bg-yellow-100 text-yellow-600 border-yellow-200',
  food: 'bg-orange-100 text-orange-600 border-orange-200',
  sightseeing: 'bg-green-100 text-green-600 border-green-200',
  other: 'bg-gray-100 text-gray-600 border-gray-200',
};

const CATEGORY_ICONS: Record<string, string> = {
  transport: 'fa-car-side',
  stay: 'fa-bed',
  food: 'fa-utensils',
  sightseeing: 'fa-camera',
  other: 'fa-basket-shopping',
};

// --- MOCK ENGINE (Fallback) ---

// Simple string hash function for deterministic randomness
const stringHash = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; 
  }
  return Math.abs(hash);
};

// Deterministic Mock Weather Generator
const getMockWeather = (location: string = '', dateStr: string = '') => {
    const loc = location.toLowerCase();
    const dateHash = stringHash(dateStr);
    const tempVariation = (dateHash % 6) - 2; 

    const format = (baseTemp: number, condition: string, icon: string) => ({
        temp: `${baseTemp + tempVariation}°C`,
        condition,
        icon,
        isReal: false
    });
    
    if (loc.includes('franz') || loc.includes('rainforest') || loc.includes('milford') || loc.includes('hokitika') || loc.includes('glacier')) {
        const isRaining = (dateHash % 10) < 7;
        return isRaining 
            ? format(14, 'Rainy', 'fa-cloud-showers-heavy text-blue-300')
            : format(15, 'Cloudy', 'fa-cloud text-gray-300');
    }
    
    if (loc.includes('tekapo') || loc.includes('cook') || loc.includes('star') || loc.includes('pukaki')) {
        return format(10, 'Clear Sky', 'fa-star text-yellow-400');
    }
    
    if (loc.includes('queenstown') || loc.includes('wanaka') || loc.includes('arrowtown') || loc.includes('cromwell')) {
        const isSunny = (dateHash % 10) < 8; 
        return isSunny
            ? format(18, 'Sunny', 'fa-sun text-orange-400')
            : format(16, 'Partly Cloudy', 'fa-cloud-sun text-yellow-400');
    }

    if (loc.includes('arthur') || loc.includes('pass') || loc.includes('haast') || loc.includes('lindis') || loc.includes('mountain')) {
        return format(8, 'Windy', 'fa-wind text-gray-400');
    }

    if (loc.includes('airport') || loc.includes('christchurch') || loc.includes('city') || loc.includes('taoyuan')) {
         const isSunny = (dateHash % 10) < 5;
         return isSunny
            ? format(20, 'Sunny', 'fa-sun text-orange-400')
            : format(18, 'Cloudy', 'fa-cloud text-gray-400');
    }
    
    return format(19, 'Partly Cloudy', 'fa-cloud-sun text-yellow-300');
};

// --- REAL API ENGINE ---

interface WeatherData {
    temp: string;
    condition: string;
    icon: string;
    isReal: boolean;
}

const mapOpenWeatherIcon = (iconCode: string) => {
    // Map OpenWeatherMap icon codes to FontAwesome
    if (iconCode.startsWith('01')) return 'fa-sun text-orange-400'; // Clear
    if (iconCode.startsWith('02')) return 'fa-cloud-sun text-yellow-400'; // Few clouds
    if (iconCode.startsWith('03') || iconCode.startsWith('04')) return 'fa-cloud text-gray-400'; // Clouds
    if (iconCode.startsWith('09') || iconCode.startsWith('10')) return 'fa-cloud-showers-heavy text-blue-300'; // Rain
    if (iconCode.startsWith('11')) return 'fa-bolt text-yellow-600'; // Thunderstorm
    if (iconCode.startsWith('13')) return 'fa-snowflake text-blue-200'; // Snow
    return 'fa-cloud-sun text-yellow-400';
};

const fetchLiveWeather = async (location: string): Promise<WeatherData | null> => {
    if (!OPEN_WEATHER_API_KEY) return null;

    try {
        // 1. Geocoding
        const geoRes = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${location},NZ&limit=1&appid=${OPEN_WEATHER_API_KEY}`);
        const geoData = await geoRes.json();
        
        if (!geoData || geoData.length === 0) return null;

        const { lat, lon } = geoData[0];

        // 2. Current Weather (For forecast, you'd use the 'forecast' endpoint)
        const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${OPEN_WEATHER_API_KEY}`);
        const weatherData = await weatherRes.json();

        return {
            temp: `${Math.round(weatherData.main.temp)}°C`,
            condition: weatherData.weather[0].main,
            icon: mapOpenWeatherIcon(weatherData.weather[0].icon),
            isReal: true
        };

    } catch (error) {
        console.error("Failed to fetch real weather:", error);
        return null;
    }
};

export const ScheduleView: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState('2024-12-01');
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Weather State
  const [weather, setWeather] = useState<WeatherData>({ temp: '--', condition: 'Loading', icon: 'fa-spinner', isReal: false });

  // Add Event State
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('09:00');
  const [newCategory, setNewCategory] = useState<CategoryType>('sightseeing');
  const [newLocation, setNewLocation] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Fetch events
  useEffect(() => {
    if (db) {
        const q = query(collection(db, "schedules"), orderBy("date"), orderBy("time"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const fetchedEvents = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as ScheduleEvent));
          setEvents(fetchedEvents);
          setLoading(false);
        });
        return () => unsubscribe();
    } else {
        setEvents(mockSchedules);
        setLoading(false);
    }
  }, []);

  const handleAdd = async () => {
    if (!newTitle || !newTime) return;

    const newEvent: Partial<ScheduleEvent> = {
        date: selectedDate,
        time: newTime,
        title: newTitle,
        category: newCategory,
        location: newLocation,
        notes: newNotes,
        completed: false
    };

    if (db) {
        await addDoc(collection(db, "schedules"), newEvent);
    } else {
        const mockId = Math.random().toString(36).substr(2, 9);
        setEvents([...events, { ...newEvent, id: mockId } as ScheduleEvent]);
    }

    setIsAdding(false);
    setNewTitle('');
    setNewLocation('');
    setNewNotes('');
    setNewTime('09:00');
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!window.confirm("Delete this event?")) return;

      if (db) {
          await deleteDoc(doc(db, "schedules", id));
      } else {
          setEvents(events.filter(ev => ev.id !== id));
      }
  };
  
  const days = [
    '2024-11-30', 
    '2024-12-01', '2024-12-02', '2024-12-03', '2024-12-04', 
    '2024-12-05', '2024-12-06', '2024-12-07', '2024-12-08', '2024-12-09'
  ];

  const filteredEvents = events.filter(e => e.date === selectedDate);
  const selectedDayIndex = days.indexOf(selectedDate);

  // --- WEATHER UPDATE LOGIC ---
  useEffect(() => {
      const updateWeather = async () => {
          const firstEvent = filteredEvents[0];
          const location = (firstEvent && firstEvent.location) ? firstEvent.location : '';
          
          // 1. Try Real API
          if (location && OPEN_WEATHER_API_KEY) {
              setWeather(prev => ({ ...prev, condition: 'Loading...', icon: 'fa-spinner fa-spin' }));
              const realData = await fetchLiveWeather(location);
              if (realData) {
                  setWeather(realData);
                  return;
              }
          }

          // 2. Fallback to Mock
          const mockData = getMockWeather(location, selectedDate);
          setWeather(mockData);
      };

      updateWeather();
  }, [selectedDate, events]); // Re-run when date or events change

  return (
    <div className="flex flex-col gap-6 relative">
      {/* Weather & Countdown */}
      <div className="flex gap-4">
        <Card className={`flex-1 text-white border-none shadow-soft-deep transition-colors duration-500 ${weather.isReal ? 'bg-gradient-to-br from-indigo-500 to-purple-500' : 'bg-gradient-to-br from-blue-400 to-blue-300'}`} noPadding>
          <div className="relative p-4 flex flex-col items-center justify-center h-full overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <i className={`fas ${weather.icon.split(' ')[0]} text-6xl`}></i>
            </div>
            
            <i className={`fas ${weather.icon} text-3xl mb-1 ${weather.condition === 'Loading...' ? 'animate-spin' : 'animate-pulse'} relative z-10`}></i>
            <span className="font-bold text-lg relative z-10">{weather.temp}</span>
            <span className="text-xs opacity-90 relative z-10 font-medium">{weather.condition}</span>
            
            <div className="absolute bottom-2 left-0 right-0 text-center">
                 <span className={`text-[8px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full ${weather.isReal ? 'bg-white/20' : 'opacity-60'}`}>
                    {weather.isReal ? 'Live Data' : 'Est. Forecast'}
                 </span>
            </div>
          </div>
        </Card>
        <Card className="flex-[2] flex flex-col justify-center items-center bg-white" noPadding>
            <div className="p-4 text-center">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Time until Trip</p>
                <div className="text-3xl font-extrabold text-primary">5 <span className="text-sm text-dark font-normal">Days</span></div>
            </div>
        </Card>
      </div>

      {/* Date Picker */}
      <div className="overflow-x-auto no-scrollbar -mx-6 px-6 pb-2">
        <div className="flex gap-3 w-max">
          {days.map((date, idx) => {
            const isSelected = date === selectedDate;
            const label = idx === 0 ? 'Pre' : `Day ${idx}`;
            return (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                className={`flex flex-col items-center justify-center w-16 h-20 rounded-2xl border-2 transition-all duration-200 ${
                  isSelected 
                  ? 'bg-primary border-primary text-white shadow-soft transform -translate-y-1' 
                  : 'bg-white border-card-border text-gray-400'
                }`}
              >
                <span className="text-xs font-bold uppercase">{label}</span>
                <span className="text-xl font-extrabold">{date.split('-')[2]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Timeline */}
      <div className="relative pl-4">
        {/* Vertical Line */}
        <div className="absolute left-[27px] top-0 bottom-0 w-1 bg-gray-200 rounded-full"></div>

        <div className="flex flex-col gap-6">
          {loading ? (
             <div className="text-center py-10 text-gray-400">Loading schedule...</div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-10 text-gray-400 font-bold bg-white/50 rounded-3xl border-2 border-dashed border-gray-300">
                <i className="fas fa-umbrella-beach text-4xl mb-2 block opacity-50"></i>
                Rest & Free Time
            </div>
          ) : filteredEvents.map(event => (
            <div key={event.id} className="relative flex gap-4 items-start group/item">
              {/* Dot */}
              <div className={`z-10 w-4 h-4 rounded-full border-2 border-white shadow-sm mt-4 flex-shrink-0 ${
                event.completed ? 'bg-primary' : 'bg-gray-300'
              } ml-[11px]`} />
              
              {/* Content */}
              <Card className="flex-1 flex flex-col gap-1 relative overflow-hidden group">
                <div className={`absolute top-0 right-0 p-2 rounded-bl-xl ${CATEGORY_COLORS[event.category]} bg-opacity-20 border-l-2 border-b-2 flex gap-2 items-center`}>
                   <i className={`fas ${CATEGORY_ICONS[event.category]} opacity-70`}></i>
                </div>
                
                {/* Delete Button (Visible on Hover/Active) */}
                <button 
                    onClick={(e) => handleDelete(event.id, e)}
                    className="absolute bottom-2 right-2 text-gray-300 hover:text-red-400 transition-colors p-2"
                >
                    <i className="fas fa-trash-alt"></i>
                </button>

                <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-dark">{event.time}</span>
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wide">{event.category}</span>
                </div>
                <h3 className="text-xl font-bold text-dark leading-tight pr-8">{event.title}</h3>
                {event.location && (
                  <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                    <i className="fas fa-map-marker-alt text-accent"></i>
                    {event.location}
                  </div>
                )}
                {event.notes && (
                    <div className="mt-2 text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded inline-block self-start border border-yellow-100">
                        <i className="fas fa-info-circle mr-1"></i> {event.notes}
                    </div>
                )}
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* Add Button (Floating) */}
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
                      <h3 className="text-xl font-black text-dark">Add to Day {selectedDayIndex === 0 ? 'Pre' : selectedDayIndex}</h3>
                      <button onClick={() => setIsAdding(false)} className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center"><i className="fas fa-times"></i></button>
                  </div>

                  {/* Category Selector */}
                  <div>
                      <label className="text-sm font-bold text-dark ml-1 mb-2 block">Category</label>
                      <div className="flex gap-3 overflow-x-auto pb-4 px-1 no-scrollbar -mx-1">
                          {Object.keys(CATEGORY_COLORS).map(cat => (
                              <button
                                key={cat}
                                onClick={() => setNewCategory(cat as CategoryType)}
                                className={`flex flex-col items-center gap-1 min-w-[84px] p-2 rounded-xl border-2 transition-all flex-shrink-0 ${
                                    newCategory === cat 
                                    ? `${CATEGORY_COLORS[cat]} bg-opacity-100 text-white border-transparent scale-105 shadow-md` 
                                    : 'bg-white border-gray-200 text-gray-400 grayscale'
                                }`}
                              >
                                  <i className={`fas ${CATEGORY_ICONS[cat]} text-lg`}></i>
                                  <span className="text-[10px] font-bold uppercase w-full overflow-hidden text-ellipsis whitespace-nowrap">{cat}</span>
                              </button>
                          ))}
                      </div>
                  </div>

                  <div className="flex gap-3">
                      <div className="w-36 flex-shrink-0">
                        <Input 
                            label="Time" 
                            type="time" 
                            value={newTime} 
                            onChange={(e) => setNewTime(e.target.value)}
                        />
                      </div>
                      <div className="flex-1">
                        <Input 
                            label="Title" 
                            placeholder="e.g. Lunch" 
                            value={newTitle} 
                            onChange={(e) => setNewTitle(e.target.value)}
                        />
                      </div>
                  </div>

                  <Input 
                    label="Location" 
                    placeholder="e.g. Burger Queen" 
                    value={newLocation} 
                    onChange={(e) => setNewLocation(e.target.value)}
                  />

                  <Input 
                    label="Notes" 
                    placeholder="e.g. Reservation under Tom" 
                    value={newNotes} 
                    onChange={(e) => setNewNotes(e.target.value)}
                  />

                  <Button onClick={handleAdd} className="mt-4" fullWidth>
                      Add Event
                  </Button>
              </div>
          </div>
      )}
    </div>
  );
};