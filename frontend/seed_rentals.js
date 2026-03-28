
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const rentals = [
  { name: "Luxury Somali Dirac", image_url: "/src/assets/dirac.jpg", price: 15, category: "Dress", duration: "1 day", description: "Somali Style" },
  { name: "Traditional Bridal Dirac", image_url: "/src/assets/dirac1.jpg", price: 15, category: "Dress", duration: "1 day", description: "Classic" },
  { name: "Modern Pattern Dirac", image_url: "/src/assets/dirac2.jpg", price: 15, category: "Dress", duration: "1 day", description: "New" },
  { name: "Elegant Evening Dirac", image_url: "/src/assets/dirac5.jpg", price: 15, category: "Dress", duration: "1 day", description: "Trending" },
  { name: "Royal Silk Dirac", image_url: "/src/assets/dirac6.jpg", price: 15, category: "Dress", duration: "1 day", description: "Premium" },
  { name: "Royal Lace Wedding Gown", image_url: "/src/assets/Weddin1.jpg", price: 200, category: "Dress", duration: "1 day", description: "Hot" },
  { name: "Classic Pearl Dress", image_url: "/src/assets/Weddin2.jpg", price: 180, category: "Dress", duration: "1 day", description: "Elegant" },
  { name: "Classic Groom Suit", image_url: "/src/assets/suit.jpg", price: 150, category: "Dress", duration: "1 day", description: "New" },
  { name: "Modern Elegance Suit", image_url: "/src/assets/suit1.jpg", price: 160, category: "Dress", duration: "1 day", description: "Premium" },
  { name: "Princess Silhouette", image_url: "/src/assets/dress2.jpg", price: 250, category: "Dress", duration: "1 day", description: "Luxury" },
  { name: "Crystal Embellished", image_url: "/src/assets/dress3.jpg", price: 280, category: "Dress", duration: "1 day", description: "Exclusive" },
  { name: "Satin Mermaid Dress", image_url: "/src/assets/dress4.jpg", price: 190, category: "Dress", duration: "1 day", description: "Classic" },
  { name: "Bohemian Chiffon", image_url: "/src/assets/dress5.jpg", price: 160, category: "Dress", duration: "1 day", description: "Trending" },
];

async function seed() {
  console.log('Clearing existing dresses...');
  await supabase.from('services').delete().eq('category', 'Dress');
  
  console.log('Inserting all rentals...');
  const { data, error } = await supabase.from('services').insert(rentals).select();
  
  if (error) {
    console.error('Error inserting rentals:', error);
  } else {
    console.log(`Successfully seeded ${data.length} rentals!`);
  }
}

seed();
