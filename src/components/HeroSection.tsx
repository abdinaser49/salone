import { motion } from "framer-motion";
import heroImage from "@/assets/hero1.jpg";
import rightImage from "@/assets/hero-salon.jpg";
import { ArrowUpRight } from "lucide-react";

interface HeroSectionProps {
  onBookNow: () => void;
}

const HeroSection = ({ onBookNow }: HeroSectionProps) => {
  return (
    <section className="relative min-h-screen pt-24 pb-12 overflow-hidden bg-[#fdfbf7]">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-8 pt-12 md:pt-20">
        
        {/* Left Image Section */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="relative w-full lg:w-1/3 flex justify-center lg:justify-start"
        >
          <div className="relative w-64 h-80 sm:w-80 sm:h-[28rem] md:h-[32rem] ml-4 lg:ml-8 mt-8">
            {/* Orange Arch Frame */}
            <div className="absolute -inset-y-4 -inset-x-6 border-t-[3px] border-l-[3px] border-r-[3px] border-[#E87A5D] rounded-t-[10rem] md:rounded-t-[12rem] opacity-90 rounded-b-xl z-0 pointer-events-none"></div>
            
            {/* White arch background to clip */}
            <div className="absolute inset-0 bg-white rounded-t-[10rem] md:rounded-t-[12rem] shadow-sm z-10"></div>
            
            <img
              src={heroImage}
              alt="Spa treatment"
              className="w-full h-full object-cover rounded-t-[10rem] md:rounded-t-[12rem] relative z-10"
            />
            
            {/* 50% Off Badge */}
            <div className="absolute -top-4 -right-8 md:-top-6 md:-right-12 w-24 h-24 bg-[#112232] rounded-full flex flex-col items-center justify-center text-white z-30 shadow-xl border-[6px] border-white">
              <span className="text-[10px] font-bold tracking-widest text-gray-300 mb-0.5">UP TO</span>
              <span className="text-xl md:text-2xl font-bold text-[#E87A5D] leading-none mb-0.5">50%</span>
              <span className="text-[10px] font-bold tracking-widest text-gray-300">OFF</span>
            </div>
          </div>
        </motion.div>

        {/* Center Text Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative w-full lg:w-1/3 flex flex-col items-center lg:items-start text-center lg:text-left z-20 space-y-6 mt-8 lg:mt-0"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E87A5D]"></span>
            <span className="text-[10px] font-bold tracking-widest text-gray-800 uppercase">Shine with perfection</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-display leading-[1.05] tracking-tight">
            <span className="block text-[#E87A5D] font-medium">Best Place for</span>
            <span className="block text-[#112232] font-semibold mt-1">Naturals SPA</span>
            <span className="block text-[#E87A5D] font-medium mt-1">Treatment</span>
          </h1>
          
          <p className="text-gray-500 text-sm sm:text-base leading-relaxed max-w-sm mt-2 font-body font-light">
            Conveniently unleash interoperable ideas with multimedia based convergence massage
          </p>

          <button 
            onClick={onBookNow}
            className="group inline-flex items-center gap-2 bg-[#E87A5D] hover:bg-[#d66a4f] text-white px-7 py-3.5 rounded-full text-sm font-semibold transition-all mt-6 shadow-md shadow-[#E87A5D]/20"
          >
            Skin Aesthetics
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" strokeWidth={2.5} />
          </button>
        </motion.div>

        {/* Right Image Section */}
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="relative w-full lg:w-1/3 justify-center lg:justify-end hidden lg:flex"
        >
          <div className="relative w-56 h-80 lg:w-64 lg:h-[26rem] mt-16 lg:mr-4">
             {/* Oval border frame */}
             <div className="absolute -inset-4 rounded-[12rem] border-[2px] border-[#E87A5D] opacity-60 z-0 scale-[1.02]"></div>
             
             <img
              src={rightImage}
              alt="Massage treatment"
              className="w-full h-full object-cover rounded-[12rem] relative z-10 shadow-lg"
            />
          </div>
        </motion.div>

      </div>
    </section>
  );
};

export default HeroSection;
