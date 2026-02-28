"use client"

import ImpactCounter from "./ImpactCounter";
import { ArrowRight } from "lucide-react";
import ParticlesBackground from "./ParticlesBackground";
import Link from "next/link";

export default function Hero() {
  return (
    <section id="home" className="relative h-screen w-full bg-gradient-to-b from-black/70 via-black/60 to-[#9450a3] overflow-hidden ">
    
      <ParticlesBackground />
      
      <div className="h-full flex items-center pl-20">
        
        <div className="space-y-6">
        
          <span className="text-6xl font-bold text-white max-w-2xl leading-tight block">
            Turning Surplus Food into <span className=" text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Smiles</span>, Not Waste
          </span>
          
          <p className=" mb-4 text-xl max-w-2xl leading-relaxed bg-gradient-to-r from-pink-300 to-blue-300 bg-clip-text text-transparent">
            Our platform connects Surplus foods to those who need it in real-time reducing waste, saving resources, and building a caring community.
          </p>
          
         
          <Link 
            href="/signup" 
            className=" z-10  absolute flex gap-2 justify-center items-center rounded-xl border border-white/20 px-6 py-2 bg-zinc-900 text-white font-light text-lg hover:bg-zinc-800 transition-colors"
          >
            Sign up <ArrowRight size={18} />
          </Link>

          
        </div>

        
   
      </div>
      
      <div className="space-y-6 ">
        
        <ImpactCounter/>
      </div>

      {/* Subtle Wave Animation at Bottom */}
      <div className="absolute bottom-0 left-0 w-full h-24 overflow-hidden ">
        <svg
          className="absolute bottom-0 w-full h-full"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"
            opacity=".25"
            className="fill-current text-white/10"
          />
          <path
            d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.71,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z"
            opacity=".5"
            className="fill-current text-white/20"
          />
          <path
            d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"
            className="fill-current text-white/30"
          />
        </svg>
        
        {/* Animated Wave Overlay */}
        <div className="absolute bottom-0 left-0 w-full h-full">
          <div className="w-full h-full bg-gradient-to-t from-[#9450a3] via-[#9450a3]/80 to-transparent animate-wave"></div>
        </div>
      </div>

    </section>
  );
}