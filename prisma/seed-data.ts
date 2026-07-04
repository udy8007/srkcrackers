// Source-of-truth catalog used to seed the database.
// Prices are in whole INR. Images are hosted product pack photos.

const IMG_BASE = "https://jallikattucrackers.in/wp-content/uploads";
const img = (path: string) => IMG_BASE + path;

export const FALLBACK_IMAGE = img("/2023/10/678.webp");

export interface SeedCategory {
  key: string;
  label: string;
  sortOrder: number;
}

export interface SeedProduct {
  cat: string;
  name: string;
  pack: string;
  price: number;
  mrp: number;
  image: string;
  description: string;
}

export const CATEGORIES: SeedCategory[] = [
  { key: "sound", label: "ONE SOUND CRACKERS (80% DIS)", sortOrder: 1 },
  { key: "flower", label: "FLOWER POTS (80% DIS)", sortOrder: 2 },
  { key: "rocket", label: "ROCKET NOVELTIES (80% DIS)", sortOrder: 3 },
  { key: "chakkar", label: "CHAKKARS (80% DIS)", sortOrder: 4 },
  { key: "bomb", label: "BOMB NOVELTIES (80% DIS)", sortOrder: 5 },
  { key: "garland", label: "WALA CRACKERS (80% DIS)", sortOrder: 6 },
  { key: "sparkler", label: "PREMIUM SPARKLERS (80% DIS)", sortOrder: 7 },
  { key: "sky", label: "SKY DISPLAY (80% DIS)", sortOrder: 8 },
];

export const PRODUCTS: SeedProduct[] = [
  { cat: "sound", name: "2.75″ Kuruvi Crackers", pack: "1 pkt (5 pcs)", price: 7, mrp: 35, image: img("/2023/10/678.webp"), description: "Classic Kuruvi sound crackers — loud single burst. Ideal for kids and family celebrations. 5 pieces per packet." },
  { cat: "sound", name: "3.5″ Lakshmi Crackers", pack: "1 pkt (5 pcs)", price: 12, mrp: 60, image: img("/2023/10/679.webp"), description: "Traditional Lakshmi brand crackers with sharp sound. Premium quality Sivakasi manufacture. 5 pcs per packet." },
  { cat: "sound", name: "4″ Lakshmi Crackers", pack: "1 pkt (5 pcs)", price: 18, mrp: 90, image: img("/2023/10/680.webp"), description: "Bigger 4 inch Lakshmi crackers for louder celebration. Long-lasting burn with clear sound. 5 pcs per packet." },
  { cat: "sound", name: "2 Sound Crackers", pack: "1 pkt (5 pcs)", price: 30, mrp: 150, image: img("/2023/10/596.webp"), description: "Double sound crackers — two consecutive blasts per cracker. Very popular for Diwali night. 5 pcs per packet." },
  { cat: "sound", name: "4″ Hulk Mega Deluxe", pack: "1 pkt (5 pcs)", price: 29, mrp: 145, image: img("/2023/10/762.webp"), description: "Mega deluxe sound crackers with extra loud burst. Hulk series premium quality. 5 pcs per packet." },
  { cat: "flower", name: "Flower Pot Small", pack: "1 box (10 pcs)", price: 50, mrp: 250, image: img("/2023/10/840.webp"), description: "Small flower pot fountain — colourful sparks shoot upward for 45–60 seconds. Safe for terrace use. 10 pcs per box." },
  { cat: "flower", name: "Flower Pot Big", pack: "1 box (10 pcs)", price: 75, mrp: 375, image: img("/2024/05/703.webp"), description: "Big flower pot with taller fountain effect and multi-colour display. Longer burning time. 10 pcs per box." },
  { cat: "flower", name: "Flower Pot Special", pack: "1 box (10 pcs)", price: 90, mrp: 450, image: img("/2023/10/541.webp"), description: "Special edition flower pot with enhanced colour mix — gold, silver and red sparks. 10 pcs per box." },
  { cat: "flower", name: "Flower Pot Asoka", pack: "1 box (10 pcs)", price: 120, mrp: 600, image: img("/2025/08/832.webp"), description: "Asoka brand premium flower pot — bright golden fountain with crackling effect at the end. 10 pcs per box." },
  { cat: "flower", name: "Flower Pots Deluxe", pack: "1 box (5 pcs)", price: 170, mrp: 850, image: img("/2025/05/594.webp"), description: "Deluxe large flower pot — maximum height fountain with rich colour display. Premium Sivakasi quality. 5 pcs per box." },
  { cat: "rocket", name: "Colour Rocket", pack: "1 box (10 pcs)", price: 65, mrp: 325, image: img("/2023/10/773.webp"), description: "Colour rockets that shoot high with trailing coloured sparks. Great visual effect. 10 rockets per box." },
  { cat: "rocket", name: "Whistling Rocket", pack: "1 box (10 pcs)", price: 150, mrp: 750, image: img("/2023/10/460.webp"), description: "Whistling sound rockets — flies high with loud whistle before burst. Kids favourite. 10 pcs per box." },
  { cat: "rocket", name: "Musical Rocket", pack: "1 box (10 pcs)", price: 140, mrp: 700, image: img("/2025/07/799.webp"), description: "Musical tone rockets with pleasant sound on ascent. Multi-colour tail effect. 10 pcs per box." },
  { cat: "chakkar", name: "Ground Chakkar Asoka", pack: "1 box (10 pcs)", price: 48, mrp: 240, image: img("/2023/10/454.webp"), description: "Ground spinner chakkar — spins fast with golden sparks in circular pattern. 10 pcs per box." },
  { cat: "chakkar", name: "Ground Chakkar Special", pack: "1 box (10 pcs)", price: 90, mrp: 450, image: img("/2025/10/01.webp"), description: "Special chakkar with multi-colour spinning display. Longer spin duration. 10 pcs per box." },
  { cat: "chakkar", name: "Ground Chakkar Deluxe", pack: "1 box (10 pcs)", price: 140, mrp: 700, image: img("/2025/10/03.webp"), description: "Deluxe ground chakkar — widest spin diameter with crackling sparks. Premium quality. 10 pcs per box." },
  { cat: "bomb", name: "King of King Bomb", pack: "1 box (10 pcs)", price: 99, mrp: 495, image: img("/2023/10/537.webp"), description: "Extra loud atom bomb crackers — deep thunder sound. For open ground use only. 10 pcs per box." },
  { cat: "bomb", name: "1/4 kg Paper Bomb", pack: "1 pcs", price: 50, mrp: 250, image: img("/2023/10/480.webp"), description: "Quarter kg paper bomb — single loud blast wrapped in paper. Use in wide open area. 1 piece." },
  { cat: "bomb", name: "1/2 kg Paper Bomb", pack: "1 pcs", price: 100, mrp: 500, image: img("/2023/10/484.webp"), description: "Half kg paper bomb — powerful single explosion. Adult supervision required. 1 piece." },
  { cat: "bomb", name: "1 kg Paper Bomb", pack: "1 pcs", price: 200, mrp: 1000, image: img("/2023/10/481.webp"), description: "One kg mega paper bomb — maximum sound effect. Only for large open fields. 1 piece." },
  { cat: "garland", name: "1000 Wala Prime", pack: "1 box", price: 300, mrp: 1500, image: img("/2024/07/593.webp"), description: "1000 crackers garland (ladi) — continuous chain firing for extended celebration. Prime quality thread." },
  { cat: "garland", name: "2000 Wala Prime", pack: "1 box (1 pcs)", price: 600, mrp: 3000, image: img("/2023/10/499.webp"), description: "2000 wala garland ladi — long continuous burst sequence. Best for grand Diwali finale." },
  { cat: "garland", name: "5000 Wala Prime", pack: "1 box (1 pcs)", price: 1500, mrp: 7500, image: img("/2023/10/500.webp"), description: "5000 wala mega garland — longest continuous cracker chain. Premium Sivakasi manufacture." },
  { cat: "sparkler", name: "12cm Benz Electric", pack: "1 box (10 pcs)", price: 30, mrp: 150, image: img("/2023/10/694.webp"), description: "12cm electric sparklers — golden sparks safe for children with adult supervision. 10 pcs per box." },
  { cat: "sparkler", name: "15cm Audi Electric", pack: "1 box (10 pcs)", price: 45, mrp: 225, image: img("/2023/10/696.webp"), description: "15cm Audi electric sparklers — longer burn time with bright golden display. 10 pcs per box." },
  { cat: "sparkler", name: "15cm Audi Crackling", pack: "1 box (10 pcs)", price: 50, mrp: 250, image: img("/2023/10/701.webp"), description: "15cm crackling sparklers — golden sparks with crackling sound effect. 10 pcs per box." },
  { cat: "sparkler", name: "1½″ Twinkling Star", pack: "1 box (10 pcs)", price: 24, mrp: 120, image: img("/2024/09/669.jpg"), description: "Twinkling star crackers — small sparkling bursts with pleasant sound. 10 pcs per box." },
  { cat: "sky", name: "2″ Sky Display", pack: "1 box (1 pcs)", price: 100, mrp: 500, image: img("/2023/10/684.webp"), description: "2 inch aerial sky shot — shoots high and bursts with multi-colour display. Single piece box." },
  { cat: "sky", name: "1″ Chotta Sky Display", pack: "1 box (1 pcs)", price: 40, mrp: 200, image: img("/2023/10/686.webp"), description: "Compact 1 inch sky display — mini aerial burst ideal for small celebrations. Single piece." },
  { cat: "sky", name: "30 Multi Color Shot Ultra", pack: "1 box (1 pcs)", price: 450, mrp: 2250, image: img("/2024/07/603.webp"), description: "30 multi-colour aerial shots — premium sky display with 30 sequential colour bursts. Show-stopper item." },
];
