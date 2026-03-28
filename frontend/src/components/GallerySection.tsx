import { motion } from "framer-motion";
import pic1 from "@/assets/pic1.jpg";
import pic2 from "@/assets/pic2.jpg";
import pic3 from "@/assets/pic3.jpg";
import pic4 from "@/assets/pic4.jpg";
import pic5 from "@/assets/pic5.jpg";
import pic9 from "@/assets/pic9.jpg";

const galleryImages = [
  { url: pic1, title: "Elegant Style" },
  { url: pic2, title: "Beauty Trends" },
  { url: pic3, title: "Modern Looks" },
  { url: pic4, title: "Salon Excellence" },
  { url: pic5, title: "Premium Care" },
  { url: pic9, title: "Final Touch" },
];

const GallerySection = () => {
  return (
    <section className="py-24 bg-slate-50" id="gallery">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-serif text-[#e91e63] text-4xl md:text-5xl font-medium mb-4">Our Work Gallery</h2>
          <div className="w-24 h-[1px] bg-[#e91e63]/30 mx-auto mb-6" />
          <p className="text-slate-500 max-w-2xl mx-auto font-light">
            Take a look at some of our recent professional beauty transformations and salon styles.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
          {galleryImages.map((img, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="relative aspect-square overflow-hidden rounded-2xl group cursor-pointer shadow-sm hover:shadow-2xl transition-all duration-500"
            >
              <img
                src={img.url}
                alt={img.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-6">
                <p className="text-white font-serif text-lg">{img.title}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GallerySection;
