'use client';

// components/FeaturesSection.tsx
import { FaListAlt, FaBell, FaShieldAlt, FaChartBar, FaCalendarAlt } from "react-icons/fa";
import { useInView } from "react-intersection-observer";
import React from "react";
import { motion } from "framer-motion";


const features = [
  {
    icon: <FaListAlt className="text-green-600 text-4xl" />,
    title: "Surplus Food Listing Platform",
    description:
      "List excess food with type, quantity, freshness status, and pickup window so nothing goes unnoticed.",
  },
  {
    icon: <FaBell className="text-yellow-500 text-4xl" />,
    title: "Real-Time Pickup Alerts",
    description:
      "Instantly notify nearby students, staff, or NGOs about available food, ensuring faster redistribution.",
  },
  {
    icon: <FaShieldAlt className="text-blue-500 text-4xl" />,
    title: "Smart Expiry & Quality Tagging",
    description:
      "Mark food as 'Safe to Eat for X Hours' with automatic expiry tracking and removal, following safety guidelines.",
  },
  {
    icon: <FaChartBar className="text-purple-500 text-4xl" />,
    title: "Impact & Analytics Dashboard",
    description:
      "Track food saved, water/carbon footprint reduced, and people served – promoting transparency and awareness.",
  },
  {
    icon: <FaCalendarAlt className="text-red-500 text-4xl" />,
    title: "Event Calendar Integration",
    description:
      "Automatic reminders after campus events to log surplus food, making redistribution a habit.",
  },
];

function FeatureCard({ feature, index }: { feature: { icon: React.ReactNode; title: string; description: string }; index: number }) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.15 });

  return (
    <div
      ref={ref}
      className={
        [
          "group mt-1 p-6 rounded-2xl ring-1 ring-zinc-800/60 bg-zinc-900/30 backdrop-blur-sm",
          "transition duration-700 ease-out will-change-transform",
          "hover:-translate-y-1 hover:scale-[1.02]",
          "hover:ring-emerald-400/60 hover:shadow-[0_0_30px_rgba(34,197,94,0.35)]",
          inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
        ].join(" ")
      }
      style={{ transitionDelay: `${index * 100 + 100}ms` }}
    >
      <div className="flex  items-center justify-center mb-4">
        <span className="relative inline-flex items-center justify-center h-14 w-14 rounded-xl ring-1 ring-emerald-400/30 bg-emerald-400/10 transition-colors duration-300 group-hover:bg-emerald-400/15 group-hover:ring-emerald-400 group-hover:shadow-[0_0_25px_rgba(34,197,94,0.35)]">
          {feature.icon}
        </span>
      </div>
      <h3 className="text-xl font-semibold text-gray-100 mb-2 text-center">
        {feature.title}
      </h3>
      <p className="text-zinc-400 text-center">{feature.description}</p>
    </div>
  );
}

export default function FeaturesSection() {
  return (
    <section className="bg-black " id="features">
      <div className="max-w-6xl mx-auto px-4">
     
        <h2 className="text-4xl font-bold text-center mt-20 mb-6 text-zinc-300">
        Why Our Platform Stands Out
        </h2>
        <p className="text-3xl text-center  mb-12 text-zinc-200">
          Key Features
        </p>
       
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
