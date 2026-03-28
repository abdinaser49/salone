import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const supabaseBaseUrl = "https://zimvwvxwvykdxrkmtaqv.supabase.co/storage/v1/object/public/services/";
const defaultRentals = [
  { name: "Luxury Somali Dirac", image_url: `${supabaseBaseUrl}dirac.jpg`, price: 15, category: "Dress", duration: "1 day", description: "Somali Style" },
  { name: "Traditional Bridal Dirac", image_url: `${supabaseBaseUrl}dirac1.jpg`, price: 15, category: "Dress", duration: "1 day", description: "Classic" },
  { name: "Modern Pattern Dirac", image_url: `${supabaseBaseUrl}dirac2.jpg`, price: 15, category: "Dress", duration: "1 day", description: "New" },
  { name: "Elegant Evening Dirac", image_url: `${supabaseBaseUrl}dirac5.jpg`, price: 15, category: "Dress", duration: "1 day", description: "Trending" },
  { name: "Royal Silk Dirac", image_url: `${supabaseBaseUrl}dirac6.jpg`, price: 15, category: "Dress", duration: "1 day", description: "Premium" },
  { name: "Royal Lace Wedding Gown", image_url: `${supabaseBaseUrl}Weddin1.jpg`, price: 200, category: "Dress", duration: "1 day", description: "Hot" },
  { name: "Classic Pearl Dress", image_url: `${supabaseBaseUrl}Weddin2.jpg`, price: 180, category: "Dress", duration: "1 day", description: "Elegant" },
  { name: "Classic Groom Suit", image_url: `${supabaseBaseUrl}suit.jpg`, price: 150, category: "Dress", duration: "1 day", description: "New" },
  { name: "Modern Elegance Suit", image_url: `${supabaseBaseUrl}suit1.jpg`, price: 160, category: "Dress", duration: "1 day", description: "Premium" },
  { name: "Princess Silhouette", image_url: `${supabaseBaseUrl}dress2.jpg`, price: 250, category: "Dress", duration: "1 day", description: "Luxury" },
  { name: "Crystal Embellished", image_url: `${supabaseBaseUrl}dress3.jpg`, price: 280, category: "Dress", duration: "1 day", description: "Exclusive" },
  { name: "Satin Mermaid Dress", image_url: `${supabaseBaseUrl}dress4.jpg`, price: 190, category: "Dress", duration: "1 day", description: "Classic" },
  { name: "Bohemian Chiffon", image_url: `${supabaseBaseUrl}dress5.jpg`, price: 160, category: "Dress", duration: "1 day", description: "Trending" },
];

async function insertRentals() {
  const { data, error } = await supabase.from('services').insert(defaultRentals);
  if (error) {
    console.error("Error inserting data:", error);
  } else {
    console.log("Successfully inserted rentals!");
  }
}

insertRentals();
