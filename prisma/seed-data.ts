// Catalog reference data for create-only seed (`npm run db:seed` on a fresh DB).
// Never run on Vercel deploy — products are not overwritten on re-seed.
// Images: local paths under /products/photos/ (and category SVGs).

import { PRODUCT_IMAGES } from "./product-images";

export const CATEGORY_IMAGES: Record<string, string> = {
  sparklers: "/products/sparklers.svg",
  fancy: "/products/fancy.svg",
  rockets: "/products/fancy.svg",
  fountain: "/products/fountain.svg",
  bombs: "/products/bombs.svg",
  lakshmi: "/products/lakshmi.svg",
  kids: "/products/kids.svg",
  wala: "/products/wala.svg",
};

export const FALLBACK_IMAGE = "/products/default.svg";

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

function item(
  cat: string,
  name: string,
  pack: string,
  price: number,
  description: string,
): SeedProduct {
  return {
    cat,
    name,
    pack,
    price,
    mrp: price * 5,
    image: PRODUCT_IMAGES[name] ?? CATEGORY_IMAGES[cat] ?? FALLBACK_IMAGE,
    description,
  };
}

export const CATEGORIES: SeedCategory[] = [
  { key: "sparklers", label: "SPARKLERS", sortOrder: 1 },
  { key: "fancy", label: "FANCY SKY SHOTS", sortOrder: 2 },
  { key: "rockets", label: "ROCKETS", sortOrder: 3 },
  { key: "fountain", label: "FOUNTAINS & FLOWER POTS", sortOrder: 4 },
  { key: "bombs", label: "BOMBS", sortOrder: 5 },
  { key: "lakshmi", label: "SOUND CRACKERS", sortOrder: 6 },
  { key: "kids", label: "KIDS SPECIAL", sortOrder: 7 },
  { key: "wala", label: "GARLAND (WALA)", sortOrder: 8 },
];

export const PRODUCTS: SeedProduct[] = [
  item("sparklers", "7 cm Electric Sparklers", "1 box (10 pcs)", 12, "Classic 7 cm electric sparklers with bright golden sparks. Safe for children under adult supervision. Burns 25–35 seconds per stick. Sivakasi quality."),
  item("sparklers", "7 cm Colour Sparklers", "1 box (10 pcs)", 15, "7 cm colour sparklers — multi-colour sparks (gold, red, green). Popular for kids and family celebrations. 10 sticks per box."),
  item("sparklers", "10 cm Electric Sparklers", "1 box (10 pcs)", 18, "10 cm electric sparklers with longer burn time and brighter golden display. Ideal for Diwali night."),
  item("sparklers", "10 cm Colour Sparklers", "1 box (10 pcs)", 20, "10 cm colour sparklers — vibrant mixed-colour sparks. Longer stick for extended celebration."),
  item("sparklers", "15 cm Electric Sparklers", "1 box (10 pcs)", 30, "15 cm electric sparklers — tall golden fountain effect on a stick. Best-selling sparkler for terrace use."),
  item("sparklers", "15 cm Green Sparklers", "1 box (10 pcs)", 55, "15 cm green-colour sparklers with rich emerald-gold sparks. Premium grade."),
  item("sparklers", "15 cm Red Sparklers", "1 box (10 pcs)", 65, "15 cm red sparklers — deep red and gold sparks. Festive favourite for Diwali."),
  item("sparklers", "30 cm Electric Sparklers", "1 box (5 pcs)", 45, "30 cm mega electric sparklers — extra-long burn with shower of golden sparks. 5 pcs per box."),
  item("sparklers", "30 cm Colour Sparklers", "1 box (5 pcs)", 55, "30 cm colour sparklers — spectacular multi-colour shower effect. Premium long sparklers."),
  item("sparklers", "50 cm Electric Sparklers", "1 box (5 pcs)", 180, "50 cm jumbo electric sparklers — longest sparkler in our range. Dramatic golden cascade."),
  item("sparklers", "10 Crackling", "1 box (10 pcs)", 22, "10 crackling sparklers — golden sparks with crackling sound effect."),

  item("fancy", "2\" Fancy", "1 pc", 120, "2 inch aerial fancy — shoots skyward and bursts with colourful stars. Single-piece sky shot."),
  item("fancy", "2\" Fancy (3 Pcs)", "1 box (3 pcs)", 280, "2 inch fancy sky shots — box of 3 aerial bursts with multi-colour display."),
  item("fancy", "3½\" Fancy", "1 pc", 220, "3.5 inch aerial fancy — larger burst radius with rich colour mix. Premium Sivakasi sky shot."),
  item("fancy", "3½\" Fancy (1 Piece)", "1 pc", 320, "Premium 3.5 inch single-piece fancy — maximum height and brightest colour burst."),
  item("fancy", "4\" Fancy", "1 pc", 260, "4 inch aerial fancy — loud report with wide multi-colour star burst. Open areas only."),
  item("fancy", "4\" Fancy (12 Step)", "1 box (12 pcs)", 350, "4 inch fancy 12-step sequential display — multiple aerial bursts in one box."),
  item("fancy", "30 Shots Multi Colour", "1 box (1 set)", 450, "30-shot multi-colour aerial display — continuous sky shots with mixed colours."),
  item("fancy", "3 Pcs Sky Shot (2\")", "1 box (3 pcs)", 280, "Triple 2 inch sky shot pack — three consecutive aerial bursts."),
  item("fancy", "2\" Pipe (1 Piece)", "1 pc", 120, "2 inch pipe sky shot — cylindrical aerial cracker with sharp burst."),
  item("fancy", "Green Flash", "1 box (5 pcs)", 70, "Green flash aerial novelty — bright green flash effect on burst. 5 pcs per box."),
  item("fancy", "7 Shots", "1 box (1 set)", 140, "7-shot multi-burst aerial display — sequential sky shots in one compact set."),

  item("rockets", "Sky Scrapper", "1 pc", 150, "Sky Scrapper rocket-style aerial — high altitude burst with trailing sparks."),
  item("rockets", "Rocket Bomb", "1 box (10 pcs)", 120, "Rocket bomb crackers — launches with whistle and bursts in the sky. 10 per box."),
  item("rockets", "Whistling Rocket", "1 box (10 pcs)", 240, "Whistling rockets — loud whistle on ascent followed by aerial burst. 10 pcs per box."),

  item("fountain", "Mega Peacock (3 Face)", "1 box (5 pcs)", 280, "Mega Peacock 3-face fountain — three-directional colour fountain with peacock-tail effect."),
  item("fountain", "Bada Peacock (5 Face)", "1 box (5 pcs)", 420, "Bada Peacock 5-face fountain — five-way colour spray with golden and green sparks."),
  item("fountain", "Magic Peacock", "1 box (5 pcs)", 180, "Magic Peacock fountain — rotating colour fountain with crackling finish."),
  item("fountain", "Bada Peacock", "1 box (5 pcs)", 450, "Bada Peacock deluxe fountain — tall multi-colour fountain with extended burn."),
  item("fountain", "Rotate Sparklers", "1 box (10 pcs)", 240, "Rotating sparkler / dancing umbrella — spins on ground while emitting sparks."),
  item("fountain", "Colour Koti", "1 box (10 pcs)", 240, "Colour Koti 3-colour fountain — red, green and gold spray effect. 10 pcs per box."),
  item("fountain", "Tin Colour Fountain", "1 box (5 pcs)", 90, "Tin colour fountain — compact metal-cased fountain with mixed colour sparks."),
  item("fountain", "Butterfly", "1 box (10 pcs)", 120, "Butterfly colour-changing fountain — sparks change colour during burn."),
  item("fountain", "Mega Siren", "1 box (3 pcs)", 200, "Mega Siren fountain — loud siren sound with colour fountain effect. 3 pcs per box."),
  item("fountain", "Naya Falls", "1 box (5 pcs)", 350, "Naya Falls waterfall fountain — cascading golden sparks like a waterfall."),

  item("bombs", "Hitler (¼ Kg)", "1 pc", 60, "Hitler ¼ kg sound bomb — loud single blast. Use only in wide open ground."),
  item("bombs", "Hydro Bomb", "1 box (10 pcs)", 70, "Hydro bomb atom crackers — deep thunder sound. 10 pcs per box. Open area only."),
  item("bombs", "Classic Bomb", "1 box (10 pcs)", 160, "Classic bomb — extra-loud atom bomb series with sharp report. 10 pcs per box."),
  item("bombs", "Digital Bomb", "1 box (10 pcs)", 280, "Digital bomb — loudest in atom bomb range. Deep resonating blast. 10 pcs per box."),
  item("bombs", "Paper Bomb (¼ Kg)", "1 pc", 60, "¼ kg paper bomb — single powerful blast wrapped in paper. Open ground only."),
  item("bombs", "Paper Bomb (½ Kg)", "1 pc", 120, "½ kg paper bomb — heavier single blast for large open areas."),
  item("bombs", "Paper Bomb (1 Kg)", "1 pc", 240, "1 kg mega paper bomb — maximum single-shot sound effect. Large open fields only."),

  item("lakshmi", "3¼ Lakshmi (1 Packet)", "1 pkt (5 pcs)", 15, "3.25 inch Lakshmi crackers — traditional sharp sound. 5 pieces per packet."),
  item("lakshmi", "Gold Lakshmi (1 Packet)", "1 pkt (5 pcs)", 35, "Gold Lakshmi premium sound crackers — louder burst with gold-label quality."),
  item("lakshmi", "4 DLX Lakshmi", "1 pkt (5 pcs)", 28, "4 inch deluxe Lakshmi crackers — enhanced sound and longer burn."),
  item("lakshmi", "Hulk DLX", "1 pkt (5 pcs)", 38, "Hulk deluxe mega sound crackers — extra loud burst. Popular for Diwali night."),
  item("lakshmi", "5\" Lion (1 Packet)", "1 pkt (5 pcs)", 44, "5 inch Lion brand crackers — deep loud report. Premium sound cracker."),
  item("lakshmi", "Red Bijili (100)", "1 bag (100 pcs)", 28, "Red bijili — small single-shot crackers, 100 pieces per bag."),
  item("lakshmi", "Kaki Ola Vedi (1 Packet)", "1 pkt (5 pcs)", 65, "Kaki Ola Vedi — traditional Tamil Nadu favourite with sharp double sound."),
  item("lakshmi", "Jallikattu DLX (1 Packet)", "1 pkt (5 pcs)", 65, "Jallikattu deluxe sound crackers — loud burst. 5 pcs per packet."),
  item("lakshmi", "2¾ Kuruvi", "1 pkt (5 pcs)", 8, "2.75 inch Kuruvi crackers — classic small sound cracker. Budget-friendly."),

  item("kids", "Roll Cap", "1 box (10 pcs)", 85, "Roll cap strips — safe fun for kids, produces small popping sounds."),
  item("kids", "Wonder Throw Box", "1 box (10 pcs)", 120, "Wonder throw box — throw-and-pop novelty cracker. Safe for children with supervision."),
  item("kids", "Sky Lander (1 Piece)", "1 pc", 50, "Sky Lander helicopter novelty — spins up into the air with sparks."),
  item("kids", "Pop Pop (50 Boxes)", "1 pack (50 boxes)", 400, "Pop Pop snappers — 50 boxes of safe popping fun for kids."),
  item("kids", "Bidi Blast (10 Boxes)", "1 pack (10 boxes)", 150, "Bidi Blast novelty — small crackling pop effect. 10 boxes per pack."),
  item("kids", "Gun with 3 Ring Caps", "1 set", 100, "Toy gun with 3 ring cap rolls — classic kids' firework toy."),
  item("kids", "Ring Cap (100 Packets)", "1 pack (100 pkt)", 750, "Ring caps bulk pack — 100 packets for toy guns."),
  item("kids", "Anaconda (10 Boxes)", "1 pack (10 boxes)", 50, "Anaconda snake novelty — expanding snake effect on ignition."),
  item("kids", "Selfie Stick", "1 box (5 pcs)", 170, "Selfie Stick photo flash — bright white flash effect for photos. 5 pcs per box."),
  item("kids", "Colour Smoke", "1 box (5 pcs)", 180, "Colour smoke fountain — releases coloured smoke plume. Daytime-friendly. 5 pcs per box."),
  item("kids", "Photo Flash", "1 box (10 pcs)", 90, "Photo flash crackers — bright white strobe flash effect for night celebrations."),

  item("wala", "28 Wala", "1 string", 15, "28 crackers string (wala) — short garland for quick celebration burst."),
  item("wala", "100 Wala", "1 string", 45, "100 wala cracker garland — continuous chain firing."),
  item("wala", "200 Wala", "1 string", 90, "200 wala garland — longer continuous burst sequence."),
  item("wala", "24 DLX Wala", "1 string", 60, "24 deluxe wala — premium quality thread with louder individual crackers."),
  item("wala", "1000 Wala", "1 box", 220, "1000 wala garland ladi — extended continuous firing for grand celebrations."),
  item("wala", "2000 Wala", "1 box", 440, "2000 wala mega garland — long continuous burst. Ideal for Diwali finale."),
  item("wala", "5000 Wala", "1 box", 1100, "5000 wala super garland — one of the longest ladi chains."),
  item("wala", "10000 Wala", "1 box", 2200, "10000 wala jumbo garland — maximum length continuous cracker chain."),
];
