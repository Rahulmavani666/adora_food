// components/HowItWorks.tsx
"use client";

import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Calendar, Bell, CheckCircle } from "lucide-react";
import ParticlesBackground from "./ParticlesBackground";

const steps = [
  {
    icon: <Calendar className="w-10 h-10 text-green-400" />,
    title: "List Surplus Food",
    description:
      "Post available surplus food with details like quantity, freshness, and pickup time."
  },
  {
    icon: <Bell className="w-10 h-10 text-yellow-400" />,
    title: "Notify Volunteers",
    description:
      "Nearby students, NGOs, or staff get real-time alerts for quick pickup."
  },
  {
    icon: <CheckCircle className="w-10 h-10 text-purple-400" />,
    title: "Food is Saved",
    description:
      "Food is collected, shared, and enjoyed — reducing waste and impact."
  }
];

export default function HowItWorks() {
  const { ref, inView } = useInView({
    threshold: 0.3,
    triggerOnce: true
  });

  return (
    <section ref={ref} id="how-it-works" className="relative py-20 bg-gradient-to-b from-black via-gray-900 to-black text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.3),transparent_50%)]"></div>
      </div>
      
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <motion.h2 
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-3xl md:text-4xl font-bold text-center mb-16"
        >
          How It Works
        </motion.h2>

     

        <div className="relative flex flex-col md:flex-row items-center md:justify-between">
          {/* Growing Horizontal Line for Desktop */}
          <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-gray-700 z-0">
            <motion.div
              className="h-full bg-gradient-to-r from-green-400 via-yellow-400 to-purple-400"
              initial={{ width: 0 }}
              animate={inView ? { width: "100%" } : {}}
              transition={{ duration: 1.5, ease: "easeInOut", delay: 0.3 }}
            />
          </div>
         

          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ 
                duration: 0.8, 
                delay: 0.5 + index * 0.3,
                ease: "easeOut"
              }}
              className="relative z-10 flex flex-col items-center text-center mb-12 md:mb-0 max-w-xs"
            >
              <motion.div 
                className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full shadow-lg border border-gray-600 mb-6 relative overflow-hidden"
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
                }}
                transition={{ duration: 0.3 }}
              >
                {/* Glow effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                {step.icon}
              </motion.div>
              <motion.h3 
                className="text-lg font-semibold mb-2"
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : {}}
                transition={{ duration: 0.6, delay: 0.8 + index * 0.3 }}
              >
                {step.title}
              </motion.h3>
              <motion.p 
                className="text-gray-400"
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : {}}
                transition={{ duration: 0.6, delay: 1.0 + index * 0.3 }}
              >
                {step.description}
              </motion.p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
