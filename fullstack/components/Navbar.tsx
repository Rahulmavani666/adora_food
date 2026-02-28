"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Logo from "../assets/recycling-box.png";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { name: "Home", href: "#home" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "Features", href: "#features" },
    { name: "Impact", href: "#impact" },
    { name: "App", href: "#app" },
  ];

  return (
    <nav
      className={
        [
          "fixed p-1 top-0 left-0 w-full z-50 transition-colors duration-300",
          scrolled
            ? "bg-black/95 backdrop-blur-md border border-purple-800/20 shadow-lg"
            : "bg-transparent shadow"
        ].join(" ")
      }
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3 ">
        
        {/* Logo */}
        <div className="flex items-center gap-2">
         
          <Image
            src={Logo}
            alt="Adora Logo"
            width={40}
            height={40}
          />
          <Link href="#home" className="text-xl font-bold text-green-800 ml-2">
            Adora
          </Link>
        </div>
        

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-gray-100 hover:text-pink-200 transition"
            >
              {link.name}
            </a>
          ))}
          <Link
            href="login"
            className="bg-white/15 text-white px-4 py-2 rounded-md hover:bg-white/25 transition"
          >
            
            log in
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden flex flex-col gap-1"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span className="w-6 h-0.5 bg-gray-800"></span>
          <span className="w-6 h-0.5 bg-gray-800"></span>
          <span className="w-6 h-0.5 bg-gray-800"></span>
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-purple-600/95 backdrop-blur-md shadow-lg px-4 py-3 space-y-3 rounded-2xl mx-3 border border-purple-300/20">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="block text-white/90 hover:text-white transition"
              onClick={() => setMenuOpen(false)}
            >
              {link.name}
            </a>
          ))}
          <Link
            href="signup"
            className="block bg-white/15 text-white px-4 py-2 rounded-md hover:bg-white/25 transition text-center"
            onClick={() => setMenuOpen(false)}
          >
            Sign Up
          </Link>
        </div>
      )}
    </nav>
  );
}
