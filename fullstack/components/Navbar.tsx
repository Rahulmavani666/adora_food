"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import Logo from "../assets/recycling-box.png";
import { ArrowRight, Leaf } from "lucide-react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeLink, setActiveLink] = useState("home");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Track which section is in view
  useEffect(() => {
    const ids = ["home", "how-it-works", "features", "impact", "app", "contact"];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveLink(entry.target.id);
          }
        }
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const navLinks = [
    { name: "Home", href: "#home", id: "home" },
    { name: "How It Works", href: "#how-it-works", id: "how-it-works" },
    { name: "Features", href: "#features", id: "features" },
    { name: "Impact", href: "#impact", id: "impact" },
    { name: "App", href: "#app", id: "app" },
    { name: "Contact", href: "#contact", id: "contact" },
  ];

  return (
    <>
      <nav
        className={[
          "fixed top-0 left-0 w-full z-50 transition-all duration-500",
          scrolled
            ? "py-2 bg-gray-950/80 backdrop-blur-xl border-b border-white/[0.06] shadow-[0_4px_30px_rgba(0,0,0,0.4)]"
            : "py-3 bg-transparent",
        ].join(" ")}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between px-5">
          {/* ── Logo ── */}
          <Link href="#home" className="flex items-center gap-2.5 group relative">
            <div className="relative">
              <div className="absolute -inset-1.5 rounded-full bg-violet-500/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <Image
                src={Logo}
                alt="Adora Logo"
                width={36}
                height={36}
                className="relative drop-shadow-[0_0_8px_rgba(139,92,246,0.3)]"
              />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-white via-violet-200 to-violet-400 bg-clip-text text-transparent tracking-tight">
              Adora
            </span>
          </Link>

          {/* ── Desktop Menu ── */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = activeLink === link.id;
              return (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setActiveLink(link.id)}
                  className={[
                    "relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 group",
                    isActive
                      ? "text-white"
                      : "text-gray-400 hover:text-white",
                  ].join(" ")}
                >
                  {/* Active pill background */}
                  {isActive && (
                    <span className="absolute inset-0 rounded-lg bg-white/[0.07] border border-white/[0.08] shadow-sm" />
                  )}
                  {/* Hover underline */}
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-[2px] w-0 bg-gradient-to-r from-violet-400 to-pink-400 rounded-full transition-all duration-300 group-hover:w-4/5" />
                  <span className="relative">{link.name}</span>
                </a>
              );
            })}
          </div>

          {/* ── CTA Buttons ── */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-300 hover:text-white transition-colors duration-300 px-4 py-2"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="group relative inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white rounded-xl overflow-hidden transition-all duration-300 hover:shadow-[0_0_24px_rgba(139,92,246,0.3)]"
            >
              {/* Button gradient bg */}
              <span className="absolute inset-0 bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl" />
              <span className="absolute inset-0 bg-gradient-to-r from-violet-500 to-pink-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <span className="relative flex items-center gap-1.5">
                Get Started
                <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-0.5" />
              </span>
            </Link>
          </div>

          {/* ── Mobile Menu Button ── */}
          <button
            className="md:hidden relative w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <div className="w-5 h-4 flex flex-col justify-between">
              <span
                className={[
                  "block h-[2px] bg-white rounded-full transition-all duration-300 origin-center",
                  menuOpen ? "rotate-45 translate-y-[7px]" : "",
                ].join(" ")}
              />
              <span
                className={[
                  "block h-[2px] bg-white rounded-full transition-all duration-200",
                  menuOpen ? "opacity-0 scale-x-0" : "opacity-100",
                ].join(" ")}
              />
              <span
                className={[
                  "block h-[2px] bg-white rounded-full transition-all duration-300 origin-center",
                  menuOpen ? "-rotate-45 -translate-y-[7px]" : "",
                ].join(" ")}
              />
            </div>
          </button>
        </div>
      </nav>

      {/* ── Mobile Menu Overlay ── */}
      <div
        className={[
          "fixed inset-0 z-40 md:hidden transition-all duration-500",
          menuOpen ? "visible" : "invisible pointer-events-none",
        ].join(" ")}
      >
        {/* Backdrop */}
        <div
          className={[
            "absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-500",
            menuOpen ? "opacity-100" : "opacity-0",
          ].join(" ")}
          onClick={() => setMenuOpen(false)}
        />

        {/* Panel */}
        <div
          className={[
            "absolute top-0 right-0 h-full w-[280px] bg-gray-950/95 backdrop-blur-2xl border-l border-white/[0.06] flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
            menuOpen ? "translate-x-0" : "translate-x-full",
          ].join(" ")}
        >
          {/* Mobile header */}
          <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Leaf size={18} className="text-emerald-400" />
              <span className="text-sm font-semibold text-white">Menu</span>
            </div>
            <button
              onClick={() => setMenuOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors"
            >
              <span className="text-gray-400 text-lg">&times;</span>
            </button>
          </div>

          {/* Mobile links */}
          <nav className="flex-1 p-5 space-y-1.5">
            {navLinks.map((link, i) => {
              const isActive = activeLink === link.id;
              return (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => { setActiveLink(link.id); setMenuOpen(false); }}
                  className={[
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300",
                    isActive
                      ? "bg-violet-600/15 text-violet-300 border border-violet-600/20"
                      : "text-gray-400 hover:text-white hover:bg-white/[0.04] border border-transparent",
                  ].join(" ")}
                  style={{ transitionDelay: menuOpen ? `${i * 50}ms` : "0ms" }}
                >
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
                  )}
                  {link.name}
                </a>
              );
            })}
          </nav>

          {/* Mobile CTA */}
          <div className="p-5 space-y-3 border-t border-white/[0.06]">
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="block text-center text-sm font-medium text-gray-300 hover:text-white px-4 py-2.5 rounded-xl border border-white/[0.08] hover:bg-white/[0.04] transition-all duration-300"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              onClick={() => setMenuOpen(false)}
              className="block text-center text-sm font-semibold text-white px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-pink-500 transition-all duration-500 shadow-lg shadow-violet-500/20"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
