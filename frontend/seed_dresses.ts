import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const dresses = [
  { name: "Royal Lace Wedding Gown", image_url: "/src/assets/Weddin1.jpg", price: 200, category: "Dress", duration: "1 day", description: "Wedding Dress / Suit Rental" },
  { name: "Classic Pearl Dress", image_url: "/src/assets/Weddin2.jpg", price: 180, category: "Dress", duration: "1 day", description: "Wedding Dress / Suit Rental" },
  { name: "Classic Groom Suit", image_url: "/src/assets/suit.jpg", price: 150, category: "Dress", duration: "1 day", description: "Wedding Dress / Suit Rental" },
  { name: "Modern Elegance Suit", image_url: "/src/assets/suit1.jpg", price: 160, category: "Dress", duration: "1 day", description: "Wedding Dress / Suit Rental" },
  { name: "Princess Silhouette", image_url: "/src/assets/dress2.jpg", price: 250, category: "Dress", duration: "1 day", description: "Wedding Dress / Suit Rental" },
  { name: "Crystal Embellished", image_url: "/src/assets/dress3.jpg", price: 280, category: "Dress", duration: "1 day", description: "Wedding Dress / Suit Rental" },
  { name: "Satin Mermaid Dress", image_url: "/src/assets/dress4.jpg", price: 190, category: "Dress", duration: "1 day", description: "Wedding Dress / Suit Rental" },
  { name: "Bohemian Chiffon", image_url: "/src/assets/dress5.jpg", price: 160, category: "Dress", duration: "1 day", description: "Wedding Dress / Suit Rental" },
];

async function seed() {
  console.log('Clearing existing dresses...');
  await supabase.from('services').delete().eq('category', 'Dress');
  
  console.log('Inserting new dresses...');
  const { data, error } = await supabase.from('services').insert(dresses).select();
  
  if (error) {
    console.error('Error inserting dresses:', error);
  } else {
    console.log(`Successfully seeded ${data.length} dresses!`);
  }
}

seed();
