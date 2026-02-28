import Image from "next/image";
import mobile from "@/assets/mobile.png"
import ParticlesBackground from "./ParticlesBackground";

export default function CTASection() {
  return (
    <section id="app" className=" w-full py-20 bg-black text-white overflow-hidden">
        
      {/* Particles Background */}
      <div className="absolute inset-0">
        <ParticlesBackground />
      </div>
      
      <div className="relative z-10 container   mx-auto  flex flex-col md:flex-row items-center  gap-52 px-6">
  
        {/* Text */}
        <div className="text-white max-w-lg">
          <h2 className=" text-white/80 text-4xl md:text-5xl font-bold mb-4">
            Join the Food Rescue Movement 🌱
          </h2>
          <p className="mb-6 text-lg opacity-90">
            Download our app now and start saving food, helping communities, and
            making a real difference — all from your phone.
          </p>
          <div className="flex gap-4 ">
            <a
              href="#"
              className= "  bg-white text-green-700 px-6 py-3 rounded-xl font-semibold hover:scale-105 transition"
            >
              📲 Download App
            </a>
            <a
              href="#"
              className="bg-green-900/20 backdrop-blur-md border border-white/30 px-6 py-3 rounded-xl font-semibold hover:bg-green-900/30 transition"
            >
              Learn More
            </a>
          </div>
        </div>

        {/* Image */}
        <div className="relative w-64 md:w-80 animate-bounce-slow">
          <Image
            src={mobile}
            alt="App Screenshot"
            width={400}
            height={800}
            className="drop-shadow-2xl"
          />
        </div>
      </div>
  
    </section>
  );
}


