import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ShoppingBag, ArrowRight } from "lucide-react";

// Henna Images
import henna1 from "@/assets/henna.jpg";
import henna2 from "@/assets/henna1.jpg";
import henna3 from "@/assets/henna2.jpg";
import henna4 from "@/assets/henna3.jpg";
import henna5 from "@/assets/henna4.jpg";

// Dress Images
import dress1 from "@/assets/Weddin1.jpg";
import dress2 from "@/assets/Weddin2.jpg";
import dress3 from "@/assets/suit.jpg";
import dress4 from "@/assets/suit1.jpg";
import dress5 from "@/assets/dress2.jpg";
import dress6 from "@/assets/dress3.jpg";
import dress7 from "@/assets/dress4.jpg";
import dress8 from "@/assets/dress5.jpg";

interface BridalRentalsSectionProps {
  onRentDress: (dressName: string, imageUrl: string) => void;
  onBookHenna: (imageUrl: string) => void;
}

const hennaImages = [henna1, henna2, henna3, henna4, henna5];
const dresses = [
  { id: 1, name: "Royal Lace Wedding Gown", image: dress1, price: "$200/day" },
  { id: 2, name: "Classic Pearl Dress", image: dress2, price: "$180/day" },
  { id: 3, name: "Classic Groom Suit", image: dress3, price: "$150/day" },
  { id: 4, name: "Modern Elegance Suit", image: dress4, price: "$160/day" },
  { id: 5, name: "Princess Silhouette", image: dress5, price: "$250/day" },
  { id: 6, name: "Crystal Embellished", image: dress6, price: "$280/day" },
  { id: 7, name: "Satin Mermaid Dress", image: dress7, price: "$190/day" },
  { id: 8, name: "Bohemian Chiffon", image: dress8, price: "$160/day" },
];

const BridalRentalsSection = ({ onRentDress, onBookHenna }: BridalRentalsSectionProps) => {
  const [activeTab, setActiveTab] = useState<"dress" | "henna">("dress");

  return (
    <section id="bridal" className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#E87A5D]/10 rounded-full mb-6">
            <Sparkles className="w-3.5 h-3.5 text-[#E87A5D]" />
            <span className="text-[#E87A5D] text-[10px] font-bold uppercase tracking-widest">Bridal & Special Events</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-display font-medium text-[#112232] mb-6">
            Henna Art & Wedding Dress Rentals
          </h2>
          <p className="max-w-2xl mx-auto text-gray-500 font-body leading-relaxed">
            Discover our exquisite collection of premium wedding dresses available for rent, and explore our stunning intricate henna designs for your special day.
          </p>
        </motion.div>

        {/* Custom Tabs */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
            <button
              onClick={() => setActiveTab("dress")}
              className={`px-8 py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all ${
                activeTab === "dress"
                  ? "bg-white text-[#E87A5D] shadow-[0_4px_12px_rgb(0,0,0,0.05)]"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Dresses & Suits
            </button>
            <button
              onClick={() => setActiveTab("henna")}
              className={`px-8 py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all ${
                activeTab === "henna"
                  ? "bg-white text-[#E87A5D] shadow-[0_4px_12px_rgb(0,0,0,0.05)]"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Henna Gallery
            </button>
          </div>
        </div>

        {/* Content Container */}
        <div className="min-h-[600px]">
          <AnimatePresence mode="wait">
            
            {/* Dresses Tab Content */}
            {activeTab === "dress" && (
              <motion.div
                key="dress"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
              >
                {dresses.map((dress) => (
                  <div key={dress.id} className="group bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300">
                    <div className="aspect-[3/4] overflow-hidden relative bg-gray-50">
                      <img 
                        src={dress.image} 
                        alt={dress.name} 
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700" 
                      />
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold text-[#112232] shadow-sm">
                        {dress.price}
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="font-display font-semibold text-lg text-[#112232] mb-4 truncate">{dress.name}</h3>
                      <button 
                        onClick={() => onRentDress(dress.name, dress.image)}
                        className="w-full bg-gray-50 hover:bg-[#E87A5D] text-[#112232] hover:text-white py-3 rounded-xl font-bold text-xs tracking-wider transition-colors flex items-center justify-center gap-2 group/btn"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>Rent This Dress</span>
                      </button>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {/* Henna Tab Content */}
            {activeTab === "henna" && (
              <motion.div
                key="henna"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-12"
              >
                <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
                  {hennaImages.map((img, idx) => (
                    <div key={idx} className="break-inside-avoid group relative overflow-hidden rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300">
                      <img 
                        src={img} 
                        alt={`Henna design ${idx + 1}`} 
                        className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                        <button 
                          onClick={() => onBookHenna(img)}
                          className="text-white hover:text-[#E87A5D] font-medium text-sm flex items-center gap-2 transition-colors"
                        >
                          Book this style <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-center">
                  <button 
                    onClick={() => onBookHenna(henna1)}
                    className="bg-[#112232] hover:bg-black text-white px-10 py-4 rounded-full font-bold tracking-wide transition-colors flex items-center gap-2 shadow-xl shadow-gray-200"
                  >
                    <span>Book Henna Session</span>
                    <Sparkles className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </div>
    </section>
  );
};

export default BridalRentalsSection;
