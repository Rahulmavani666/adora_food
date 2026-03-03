"use client"; 
import Image from "next/image"
import Screenshot from "@/assets/scc.png"
import {motion, useScroll, useTransform} from "framer-motion"
import { useEffect, useRef } from "react";

export default function ProductShowcase(){
    
    const appImage = useRef<HTMLImageElement>(null);


    const {scrollYProgress: scrollYProgrss } = useScroll({
        target: appImage,
        offset:["start end" ,"end end"],
        
    });      

   

    const rotateX = useTransform(scrollYProgrss,[0,1],[20,0])
    const opacity = useTransform(scrollYProgrss,[0,1],[0.7,1])


    return(
        <div className="relative bg-black text-white py-30 bg-gradient-to-b from-black via-gray-900 to-[#9450a3]">
            <div className="container mx-auto px-4  flex flex-col items-center  ">
                <h1 className="text-4xl font-bold text-center mb-8">
                    Our Product Interface
                </h1>
                <p className="mb-10 max-w-4xl text-center text-white/80 text-md font-light "> 
                Discover a seamless experience designed to streamline your workflow and boost productivity. Our intuitive interface puts powerful features at your fingertips, enabling you to accomplish more in less time. Join thousands of satisfied users who've transformed their operations with our innovative solution.
                </p>
                <motion.div
                 style={{
                    opacity:opacity,
                    rotateX: rotateX,
                    transformPerspective: "880px",

                 }}
                >

                <div className="flex justify-center">
                    <Image 
                        src={Screenshot}
                        alt="Product Interface Screenshot" 
                        className="rounded-lg shadow-lg max-w-full h-auto"
                        priority
                        ref={appImage}
                    />
                </div>

                </motion.div>
          
            </div>
        </div>
    )
}