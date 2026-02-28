"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Apple, 
  Salad, 
  Wheat, 
  Carrot, 
  Citrus, 
  MapPin, 
  Clock, 
  TrendingUp,
  Heart,
  Users,
  Gift,
  Star,
  ChevronLeft,
  ChevronRight,
  History
} from "lucide-react";

const mockUpdates = [
  { 
    id: 1, 
    icon: <Apple className="w-6 h-6 text-green-400" />, 
    text: "25 meals saved in Mumbai just now", 
    type: "success",
    location: "Mumbai, India",
    coordinates: { lat: 19.0760, lng: 72.8777 },
    timestamp: "Just now"
  },
  { 
    id: 2, 
    icon: <Salad className="w-6 h-6 text-blue-400" />, 
    text: "12 meals shared in Delhi 2 mins ago", 
    type: "info",
    location: "Delhi, India",
    coordinates: { lat: 28.7041, lng: 77.1025 },
    timestamp: "2 mins ago"
  },
  { 
    id: 3, 
    icon: <Wheat className="w-6 h-6 text-yellow-400" />, 
    text: "40 loaves collected in Pune 5 mins ago", 
    type: "success",
    location: "Pune, India",
    coordinates: { lat: 18.5204, lng: 73.8567 },
    timestamp: "5 mins ago"
  },
  { 
    id: 4, 
    icon: <Carrot className="w-6 h-6 text-orange-400" />, 
    text: "18 kg potatoes rescued in Jaipur 8 mins ago", 
    type: "warning",
    location: "Jaipur, India",
    coordinates: { lat: 26.9124, lng: 75.7873 },
    timestamp: "8 mins ago"
  },
  { 
    id: 5, 
    icon: <Citrus className="w-6 h-6 text-yellow-500" />, 
    text: "10 mango crates saved in Surat 12 mins ago", 
    type: "success",
    location: "Surat, India",
    coordinates: { lat: 21.1702, lng: 72.8311 },
    timestamp: "12 mins ago"
  },
];

// Extended past updates for horizontal scrolling
const pastUpdates = [
  { 
    id: 6, 
    icon: <Apple className="w-5 h-5 text-green-400" />, 
    text: "30 meals rescued in Chennai", 
    type: "success",
    location: "Chennai, India",
    timestamp: "15 mins ago"
  },
  { 
    id: 7, 
    icon: <Wheat className="w-5 h-5 text-yellow-400" />, 
    text: "22 bread loaves saved in Kolkata", 
    type: "success",
    location: "Kolkata, India",
    timestamp: "18 mins ago"
  },
  { 
    id: 8, 
    icon: <Salad className="w-5 h-5 text-blue-400" />, 
    text: "15 kg vegetables shared in Hyderabad", 
    type: "info",
    location: "Hyderabad, India",
    timestamp: "22 mins ago"
  },
  { 
    id: 9, 
    icon: <Carrot className="w-5 h-5 text-orange-400" />, 
    text: "8 kg fruits distributed in Ahmedabad", 
    type: "warning",
    location: "Ahmedabad, India",
    timestamp: "25 mins ago"
  },
  { 
    id: 10, 
    icon: <Citrus className="w-5 h-5 text-yellow-500" />, 
    text: "20 meal boxes delivered in Bangalore", 
    type: "success",
    location: "Bangalore, India",
    timestamp: "28 mins ago"
  },
  { 
    id: 11, 
    icon: <Apple className="w-5 h-5 text-green-400" />, 
    text: "35 portions saved in Lucknow", 
    type: "success",
    location: "Lucknow, India",
    timestamp: "32 mins ago"
  },
  { 
    id: 12, 
    icon: <Salad className="w-5 h-5 text-blue-400" />, 
    text: "12 kg rice distributed in Kanpur", 
    type: "info",
    location: "Kanpur, India",
    timestamp: "35 mins ago"
  },
  { 
    id: 13, 
    icon: <Wheat className="w-5 h-5 text-yellow-400" />, 
    text: "18 meal kits prepared in Indore", 
    type: "success",
    location: "Indore, India",
    timestamp: "40 mins ago"
  }
];

const impactMessages = [
  { id: 1, icon: <TrendingUp className="w-5 h-5 text-emerald-400" />, text: "1000+ meals saved this week!", type: "milestone" },
  { id: 2, icon: <Heart className="w-5 h-5 text-pink-400" />, text: "Thanks to 50 donors today!", type: "gratitude" },
  { id: 3, icon: <Users className="w-5 h-5 text-blue-400" />, text: "200+ volunteers joined this month!", type: "community" },
  { id: 4, icon: <Gift className="w-5 h-5 text-purple-400" />, text: "500kg food rescued today!", type: "achievement" },
  { id: 5, icon: <Star className="w-5 h-5 text-yellow-400" />, text: "New record: 150 meals in one hour!", type: "record" },
];

export default function LiveTicker() {
  const [updates, setUpdates] = useState<typeof mockUpdates>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showImpact, setShowImpact] = useState(false);
  const [impactIndex, setImpactIndex] = useState(0);
  const [showPastUpdates, setShowPastUpdates] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % updates.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setUpdates(mockUpdates);
  }, []);

  // Show impact messages every 8 seconds
  useEffect(() => {
    const impactInterval = setInterval(() => {
      setShowImpact(true);
      setImpactIndex((prev) => (prev + 1) % impactMessages.length);
      setTimeout(() => setShowImpact(false), 3000);
    }, 8000);

    return () => clearInterval(impactInterval);
  }, []);

  const getTypeColor = (type: string) => {
    switch (type) {
      case "success":
        return "text-green-300 border-green-400/40 bg-green-400/20";
      case "warning":
        return "text-yellow-300 border-yellow-400/40 bg-yellow-400/20";
      case "info":
        return "text-blue-300 border-blue-400/40 bg-blue-400/20";
      default:
        return "text-emerald-300 border-emerald-400/40 bg-emerald-400/20";
    }
  };

  const getImpactColor = (type: string) => {
    switch (type) {
      case "milestone":
        return "bg-emerald-500/20 border-emerald-400/40 text-emerald-300";
      case "gratitude":
        return "bg-pink-500/20 border-pink-400/40 text-pink-300";
      case "community":
        return "bg-blue-500/20 border-blue-400/40 text-blue-300";
      case "achievement":
        return "bg-purple-500/20 border-purple-400/40 text-purple-300";
      case "record":
        return "bg-yellow-500/20 border-yellow-400/40 text-yellow-300";
      default:
        return "bg-emerald-500/20 border-emerald-400/40 text-emerald-300";
    }
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  const generateMapThumbnail = (location: string, coordinates: { lat: number, lng: number }) => {
    // More realistic map representation with streets, landmarks, and terrain
    const locationHash = location.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const streetPattern = locationHash % 3; // Different street patterns for different cities
    
    return (
      <div  className="w-16 h-12 bg-gradient-to-br from-slate-700 via-slate-600 to-slate-500 rounded-lg border border-white/30 relative overflow-hidden shadow-inner">
        {/* Terrain/Water bodies */}
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/40 via-transparent to-green-900/30"></div>
        
        {/* Street grid pattern */}
        <div className="absolute inset-0">
          {/* Horizontal streets */}
          <div className="absolute top-2 left-0 right-0 h-px bg-yellow-200/40"></div>
          <div className="absolute top-4 left-0 right-0 h-px bg-yellow-200/30"></div>
          <div className="absolute top-6 left-0 right-0 h-px bg-yellow-200/40"></div>
          <div className="absolute top-8 left-0 right-0 h-px bg-yellow-200/30"></div>
          
          {/* Vertical streets */}
          <div className="absolute top-0 bottom-0 left-3 w-px bg-yellow-200/30"></div>
          <div className="absolute top-0 bottom-0 left-6 w-px bg-yellow-200/40"></div>
          <div className="absolute top-0 bottom-0 left-9 w-px bg-yellow-200/30"></div>
          <div className="absolute top-0 bottom-0 left-12 w-px bg-yellow-200/35"></div>
        </div>
        
        {/* Building blocks */}
        <div className="absolute top-1.5 left-1 w-1.5 h-1 bg-gray-400/60 rounded-sm"></div>
        <div className="absolute top-3 left-4 w-1 h-1.5 bg-gray-300/50 rounded-sm"></div>
        <div className="absolute top-1 left-7 w-2 h-1 bg-gray-400/70 rounded-sm"></div>
        <div className="absolute top-5 left-10 w-1 h-1 bg-gray-300/60 rounded-sm"></div>
        <div className="absolute top-2.5 left-13 w-1.5 h-1.5 bg-gray-400/50 rounded-sm"></div>
        <div className="absolute bottom-2 left-2 w-1 h-1 bg-gray-300/40 rounded-sm"></div>
        <div className="absolute bottom-1.5 left-8 w-1.5 h-1 bg-gray-400/60 rounded-sm"></div>
        
        {/* Green spaces/parks */}
        {streetPattern === 0 && (
          <div className="absolute top-3 left-7 w-2 h-2 bg-green-500/40 rounded-full"></div>
        )}
        {streetPattern === 1 && (
          <div className="absolute bottom-2 left-4 w-3 h-1.5 bg-green-400/30 rounded-sm"></div>
        )}
        
        {/* Water body for coastal cities */}
        {(location.includes('Mumbai') || location.includes('Chennai') || location.includes('Kolkata')) && (
          <div className="absolute bottom-0 right-0 w-6 h-3 bg-blue-400/40 rounded-tl-lg"></div>
        )}
        
        {/* Location marker with glow effect */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute inset-0 w-3 h-3 bg-red-400/60 rounded-full animate-ping"></div>
            {/* Main marker */}
            <div className="relative w-2.5 h-2.5 bg-red-500 rounded-full border border-white/80 shadow-lg">
              <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 bg-red-300 rounded-full"></div>
            </div>
          </div>
        </div>
        
        {/* Subtle coordinate overlay */}
        <div className="absolute bottom-0.5 right-0.5 text-[5px] text-white/50 font-mono bg-black/30 px-0.5 rounded">
          {coordinates.lat.toFixed(1)}°N
        </div>
        
        {/* Subtle map grid overlay */}
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full" style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '4px 3px'
          }}></div>
        </div>
      </div>
    );
  };

  return (
    <div className="  bg-zinc-900/90 backdrop-blur-md rounded-3xl p-6 border border-white/10 shadow-2xl w-full max-w-md mx-auto ring-1 ring-white/5 ">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
          <h3 className="text-xl font-bold text-white">Live Updates</h3>
        </div>
        <div className="text-xs text-white/60 bg-white/10 px-3 py-1 rounded-full">
          Real-time
        </div>
      </div>

      {/* Impact Message Banner */}
      <AnimatePresence>
        {showImpact && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`mb-4 p-3 rounded-xl border ${getImpactColor(impactMessages[impactIndex].type)}`}
          >
            <div className="flex items-center space-x-2">
              {impactMessages[impactIndex].icon}
              <span className="text-sm font-medium">{impactMessages[impactIndex].text}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live Updates Container */}
      <div className="space-y-3 max-h-64 overflow-hidden">
        <AnimatePresence>
          {updates.map((update, idx) => (
            <motion.div
              key={update.id}
              initial={{ opacity: 0, x: -20, scale: 0.95 }}
              animate={{ 
                opacity: idx === currentIndex ? 1 : 0.6, 
                x: 0, 
                scale: idx === currentIndex ? 1 : 0.98 
              }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              transition={{ 
                duration: 0.5, 
                ease: "easeOut",
                delay: idx * 0.1 
              }}
              className={`
                relative p-4 rounded-2xl border transition-all duration-300
                ${getTypeColor(update.type)}
                ${idx === currentIndex ? 'ring-2 ring-emerald-400/40 shadow-lg shadow-emerald-400/20' : ''}
                hover:scale-[1.02] hover:shadow-lg cursor-pointer
              `}
            >
              {/* Active Indicator */}
              {idx === currentIndex && (
                <motion.div
                  className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-emerald-400 rounded-full"
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                />
              )}

              {/* Glowing Border for Most Recent Update */}
              {idx === currentIndex && (
                <motion.div
                  className="absolute inset-0 rounded-2xl border-2 border-emerald-400/60"
                  initial={{ opacity: 0 }}
                  animate={{ 
                    opacity: [0, 1, 0],
                    scale: [1, 1.02, 1]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              )}
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {update.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-relaxed text-white mb-2">{update.text}</p>
                  
                  {/* Location and Time Info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-3 h-3 text-white/60" />
                      <span className="text-xs text-white/60">{update.location}</span>
                      <Clock className="w-3 h-3 text-white/60 ml-2" />
                      <span className="text-xs text-white/60">{update.timestamp}</span>
                    </div>
                  </div>
                </div>
                
                {/* Map Thumbnail */}
                <div className="flex-shrink-0 ml-2">
                  {generateMapThumbnail(update.location, update.coordinates)}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Past Updates Section */}
      <div className="mt-6 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-white/60" />
            <h4 className="text-sm font-semibold text-white/80">Past Updates</h4>
            <button
              onClick={() => setShowPastUpdates(!showPastUpdates)}
              className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              {showPastUpdates ? 'Hide' : 'Show'}
            </button>
          </div>
          {showPastUpdates && (
            <div className="flex space-x-1">
              <button
                onClick={scrollLeft}
                className="p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <ChevronLeft className="w-3 h-3 text-white/60" />
              </button>
              <button
                onClick={scrollRight}
                className="p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <ChevronRight className="w-3 h-3 text-white/60" />
              </button>
            </div>
          )}
        </div>

        <AnimatePresence>
          {showPastUpdates && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div
                ref={scrollContainerRef}
                className="flex space-x-3 overflow-x-auto scrollbar-hide pb-2 scroll-smooth"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                }}
              >
                {pastUpdates.map((update) => (
                  <motion.div
                    key={update.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`
                      flex-shrink-0 w-64 p-3 rounded-xl border transition-all duration-200
                      ${getTypeColor(update.type)}
                      hover:scale-[1.02] hover:shadow-lg cursor-pointer
                    `}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {update.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium leading-relaxed text-white mb-1">
                          {update.text}
                        </p>
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-2.5 h-2.5 text-white/50" />
                          <span className="text-[10px] text-white/50">{update.location}</span>
                          <Clock className="w-2.5 h-2.5 text-white/50 ml-1" />
                          <span className="text-[10px] text-white/50">{update.timestamp}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              {/* Scroll Indicators */}
              <div className="flex justify-center mt-2 space-x-1">
                {Array.from({ length: Math.ceil(pastUpdates.length / 3) }).map((_, idx) => (
                  <div
                    key={idx}
                    className="w-1.5 h-1.5 rounded-full bg-white/20"
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between text-xs text-white/60">
          <span>Last updated: Just now</span>
          <div className="flex space-x-1">
            {updates.map((_, idx) => (
              <div
                key={idx}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  idx === currentIndex 
                    ? 'bg-emerald-400 scale-125' 
                    : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
