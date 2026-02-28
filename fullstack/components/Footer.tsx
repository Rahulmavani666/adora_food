// components/Footer.tsx
import { FaFacebookF, FaInstagram, FaTwitter, FaLinkedinIn } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="relative bg-zinc-800/70 backdrop-blur-md border-t border-white/10 text-white py-10 overflow-hidden">
      
      {/* Gradient Glow Effect */}
      {/* <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-[#9450a3] blur-3xl rounded-full pointer-events-none"></div> */}

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Logo & Description */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-bold tracking-wide text-white/80 text-glow">Adora</h2>
            <p className="text-gray-300 text-1xl mt-1 font-light ">
            “Join the movement to feed, not waste.”
            </p>

        {/* Copyright */}
        <p className="mt-14 text-xs text-gray-400 ">
          © 2025 Adora. All rights reserved.
        </p>
          </div>

          {/* Navigation Links */}
          <ul className="flex gap-6 text-sm">
            <li><a href="#" className="hover:text-green-400 transition">Home</a></li>
            <li><a href="#" className="hover:text-green-400 transition">About</a></li>
            <li><a href="#" className="hover:text-green-400 transition">Contact</a></li>
            <li><a href="#" className="hover:text-green-400 transition">Report</a></li>
          </ul>

          {/* Social Icons */}
          <div className="flex gap-4 text-lg">
            <a href="#" className="hover:text-green-400 transition"><FaFacebookF /></a>
            <a href="#" className="hover:text-green-400 transition"><FaInstagram /></a>
            <a href="#" className="hover:text-green-400 transition"><FaTwitter /></a>
            <a href="#" className="hover:text-green-400 transition"><FaLinkedinIn /></a>
          </div>
        </div>

        {/* Divider */}
    

      </div>
    </footer>
  );
}
