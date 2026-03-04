

import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
// import LiveStats from "@/components/LiveStats";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import ImpactSection from "@/components/ImpactSection";
import ProductShowcase from "@/components/ProductShowcase";
import CallToAction from "@/components/Cta";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";

export const dynamic = 'force-dynamic';

export default function Home() {
  return(
    <>
     
           <Navbar/>
           <Hero/>
          
           <ImpactSection/>
           <Features/>
           <HowItWorks/>
           <ProductShowcase/>
           <FAQ/>
           <CallToAction/>
           <Footer/>
           
         
           
          
    
  
    </>
  )
}
