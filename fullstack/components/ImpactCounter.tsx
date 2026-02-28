"use client";

import { useState, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';

export default function ImpactCounter() {
  const [counts, setCounts] = useState({
    mealsSaved: 0,
    wasteReduced: 0,
    peopleHelped: 0,
    carbonSaved: 0
  });

  const [isVisible, setIsVisible] = useState(false);
  const { ref, inView } = useInView({
    threshold: 0.5,
    triggerOnce: true
  });

  useEffect(() => {
    if (inView) {
      setIsVisible(true);
      animateCounters();
    }
  }, [inView]);

  const animateCounters = () => {
    const finalCounts = {
      mealsSaved: 15420,
      wasteReduced: 8230,
      peopleHelped: 4560,
      carbonSaved: 1250
    };

    const duration = 2000; // 2 seconds
    const steps = 60;
    const stepDuration = duration / steps;

    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      
      const progress = currentStep / steps;
      const easeOutQuart = 1 - Math.pow(1 - progress, 4); // Smooth easing

      setCounts({
        mealsSaved: Math.floor(finalCounts.mealsSaved * easeOutQuart),
        wasteReduced: Math.floor(finalCounts.wasteReduced * easeOutQuart),
        peopleHelped: Math.floor(finalCounts.peopleHelped * easeOutQuart),
        carbonSaved: Math.floor(finalCounts.carbonSaved * easeOutQuart)
      });

      if (currentStep >= steps) {
        clearInterval(interval);
        setCounts(finalCounts);
      }
    }, stepDuration);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatWeight = (kg: number) => {
    if (kg >= 1000) {
      return (kg / 1000).toFixed(1) + ' tons';
    }
    return kg + ' kg';
  };

  return (
    <div  ref={ref} className="absolute right-32 top-1/2 transform -translate-y-1/2 z-10">
      <div className="group bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 animate-subtle-bounce shadow-2xl w-96 ring-1 ring-white/10 transition duration-500 ease-out will-change-transform hover:-translate-y-1 hover:scale-[1.01] hover:ring-emerald-400/60 hover:shadow-[0_0_30px_rgba(34,197,94,0.35)]">
        <h3 className="text-white text-2xl font-bold mb-8 text-center">Our Impact</h3>
        
        <div className="grid grid-cols-2 gap-6">
          {/* Meals Saved */}
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-3">
              <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse ring-0 transition duration-300 group-hover:ring-1 group-hover:ring-emerald-400/40 group-hover:shadow-[0_0_18px_rgba(34,197,94,0.45)]"></div>
              <span className="text-white/80 text-sm font-medium">Meals Saved</span>
            </div>
            <div className="text-3xl font-bold text-green-400 mb-2">
              {formatNumber(counts.mealsSaved)}
            </div>
            <div className="text-white/60 text-xs">From going to waste</div>
          </div>

          {/* Waste Reduced */}
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-3">
              <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse ring-0 transition duration-300 group-hover:ring-1 group-hover:ring-emerald-400/40 group-hover:shadow-[0_0_18px_rgba(34,197,94,0.45)]"></div>
              <span className="text-white/80 text-sm font-medium">Waste Reduced</span>
            </div>
            <div className="text-3xl font-bold text-blue-400 mb-2">
              {formatWeight(counts.wasteReduced)}
            </div>
            <div className="text-white/60 text-xs">Food waste prevented</div>
          </div>

          {/* People Helped */}
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-3">
              <div className="w-4 h-4 bg-purple-500 rounded-full animate-pulse ring-0 transition duration-300 group-hover:ring-1 group-hover:ring-emerald-400/40 group-hover:shadow-[0_0_18px_rgba(34,197,94,0.45)]"></div>
              <span className="text-white/80 text-sm font-medium">People Helped</span>
            </div>
            <div className="text-3xl font-bold text-purple-400 mb-2">
              {formatNumber(counts.peopleHelped)}
            </div>
            <div className="text-white/60 text-xs">Students & community</div>
          </div>

          {/* Carbon Saved */}
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-3">
              <div className="w-4 h-4 bg-yellow-500 rounded-full animate-pulse ring-0 transition duration-300 group-hover:ring-1 group-hover:ring-emerald-400/40 group-hover:shadow-[0_0_18px_rgba(34,197,94,0.45)]"></div>
              <span className="text-white/80 text-sm font-medium">Carbon Saved</span>
            </div>
            <div className="text-3xl font-bold text-yellow-400 mb-2">
              {formatWeight(counts.carbonSaved)}
            </div>
            <div className="text-white/60 text-xs">CO2 emissions avoided</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-8">
          <div className="flex items-center justify-between text-sm text-white/60 mb-3">
            <span>This Month</span>
            <span>+12% from last month</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-green-400 to-blue-400 h-3 rounded-full transition-all duration-1000 ease-out"
              style={{ width: isVisible ? '78%' : '0%' }}
            ></div>
          </div>
        </div>

        {/* Live Status */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center space-x-2 bg-green-500/20 text-green-400 text-sm px-4 py-2 rounded-full">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse ring-0 transition duration-300 group-hover:ring-1 group-hover:ring-emerald-400/50 group-hover:shadow-[0_0_14px_rgba(34,197,94,0.55)]"></div>
            <span>Live Updates</span>
          </div>
        </div>
      </div>
    </div>
  );
}
