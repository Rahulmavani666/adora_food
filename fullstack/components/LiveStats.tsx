"use client";
import { useState, useEffect, useRef } from "react";

export default function LiveStats() {
  const [meals, setMeals] = useState(1200);
  const [co2, setCo2] = useState(450);
  const [volunteers, setVolunteers] = useState(35);
  const [isVisible, setIsVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -100px 0px"
      }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setMeals(prev => prev + Math.floor(Math.random() * 5) + 1);
      setCo2(prev => prev + Math.floor(Math.random() * 3) + 1);
      setVolunteers(prev => prev + (Math.random() > 0.7 ? 1 : 0));
    }, 1000); // update every 1 sec
    return () => clearInterval(interval);
  }, []);

  return (
    <section 
      ref={statsRef}
      className={`py-20 bg-gradient-to-b from-[#9450a3] via-[#9450a3]/90 to-black transition-all duration-1000 ease-out ${
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-20'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-white mb-4">
            Real-Time Impact
          </h2>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            See the difference we're making together in real-time
          </p>
        </div>
        
        <div className="flex justify-center gap-16 text-white">
          <StatCard 
            value={meals} 
            label="Meals Saved Today" 
            delay={0}
            isVisible={isVisible}
          />
          <StatCard 
            value={co2} 
            label="CO₂ Emissions Prevented (kg)" 
            delay={200}
            isVisible={isVisible}
          />
          <StatCard 
            value={volunteers} 
            label="Volunteers Active" 
            delay={400}
            isVisible={isVisible}
          />
        </div>
      </div>
    </section>
  );
}

function StatCard({ 
  value, 
  label, 
  delay, 
  isVisible 
}: { 
  value: number; 
  label: string; 
  delay: number;
  isVisible: boolean;
}) {
  return (
    <div 
     id="impact"
      className={`text-center transition-all duration-700 ease-out ${
        isVisible 
          ? 'opacity-100 translate-y-0 scale-100' 
          : 'opacity-0 translate-y-10 scale-95'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="text-6xl font-bold mb-2 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
        {value.toLocaleString()}
      </div>
      <div className="text-lg opacity-90 text-white/80">{label}</div>
    </div>
  );
}
