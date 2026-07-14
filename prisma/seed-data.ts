// Catalog from SRK Crackers Price List (14 Jul 2026).
// Create-only seed on empty DB; use `npm run db:sync-catalog` to upsert prices/images locally.

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
  mrp: number,
  description: string,
): SeedProduct {
  return {
    cat,
    name,
    pack,
    price,
    mrp,
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
  item("sparklers", "7 cm Electric Sparklers", "1 box (10 pcs)", 13, 60, "Classic 7 cm electric sparklers with bright golden sparks. Safe for children under adult supervision."),
  item("sparklers", "7 cm Colour Sparklers", "1 box (10 pcs)", 15, 75, "7 cm colour sparklers — multi-colour sparks. Popular for kids and family celebrations."),
  item("sparklers", "10 cm Electric Sparklers", "1 box (10 pcs)", 18, 90, "10 cm electric sparklers with longer burn time and brighter golden display."),
  item("sparklers", "10 cm Colour Sparklers", "1 box (10 pcs)", 20, 100, "10 cm colour sparklers — vibrant mixed-colour sparks."),
  item("sparklers", "15 cm Electric Sparklers", "1 box (10 pcs)", 30, 150, "15 cm electric sparklers — tall golden fountain effect on a stick."),
  item("sparklers", "15 cm Green Sparklers", "1 box (10 pcs)", 55, 275, "15 cm green-colour sparklers with rich emerald-gold sparks."),
  item("sparklers", "15 cm Red Sparklers", "1 box (10 pcs)", 65, 325, "15 cm red sparklers — deep red and gold sparks."),
  item("sparklers", "30 cm Electric Sparklers", "1 box (5 pcs)", 45, 225, "30 cm mega electric sparklers — extra-long burn with shower of golden sparks."),
  item("sparklers", "30 cm Colour Sparklers", "1 box (5 pcs)", 55, 275, "30 cm colour sparklers — spectacular multi-colour shower effect."),
  item("sparklers", "50 cm Electric Sparklers", "1 box (5 pcs)", 180, 900, "50 cm jumbo electric sparklers — longest sparkler in our range."),
  item("sparklers", "1½ Twinkling Star", "1 box (10 pcs)", 30, 150, "1½ twinkling star sparklers — crackling / twinkling effect. 10 pcs per box."),
  item("fountain", "Flower Pot Asoka", "10 pcs", 170, 850, "Flower Pot Asoka — classic cone flower-pot fountains. 10 pcs."),
  item("fancy", "5 inch Fancy 2 in 1", "1 box", 790, 1491, "5 inch Fancy 2-in-1 combo pack — premium dual-effect aerial fancy."),
  item("fancy", "2 inch Double Ball", "1 pc", 260, 1320, "2 inch Double Ball aerial — dual-burst sky shot. Single piece."),
  item("fancy", "2\" Fancy", "1 pc", 120, 600, "2 inch aerial fancy — shoots skyward and bursts with colourful stars."),
  item("fancy", "2\" Fancy (3 Pcs)", "1 box (3 pcs)", 280, 1400, "2 inch fancy sky shots — box of 3 aerial bursts."),
  item("fancy", "3\" Fancy", "1 pc", 280, 1400, "3 inch aerial fancy — rich colour mix sky shot."),
  item("fancy", "3½\" Fancy (1 Piece)", "1 pc", 320, 1600, "Premium 3.5 inch single-piece fancy — maximum height and brightest colour burst."),
  item("fancy", "4\" Fancy", "1 pc", 380, 1860, "4 inch aerial fancy — loud report with wide multi-colour star burst."),
  item("fancy", "4\" Fancy (2 pcs)", "1 box (2 pcs)", 650, 3250, "4 inch fancy twin pack — two premium aerial bursts."),
  item("fancy", "30 Shots Multi Colour", "1 box (1 set)", 480, 2350, "30-shot multi-colour aerial display — continuous sky shots."),
  item("fancy", "3 Pcs Sky Shot (2\")", "1 box (3 pcs)", 580, 2900, "Triple 2 inch sky shot pack — three consecutive aerial bursts."),
  item("fancy", "2\" Pipe (1 Piece)", "1 pc", 150, 750, "2 inch pipe sky shot — cylindrical aerial cracker with sharp burst."),
  item("fancy", "12 Shots", "1 box (5 pcs)", 280, 1400, "12-shot multi-burst aerial set — sequential sky shots."),
  item("fancy", "7 Shots", "1 box (1 set)", 140, 700, "7-shot multi-burst aerial display — sequential sky shots in one compact set."),
  item("rockets", "Sky Scrapper", "1 pc", 140, 700, "Sky Scrapper rocket-style aerial — high altitude burst with trailing sparks."),
  item("rockets", "Rocket Bomb", "1 box (10 pcs)", 120, 600, "Rocket bomb crackers — launches with whistle and bursts in the sky."),
  item("rockets", "Whistling Rocket", "1 box (10 pcs)", 240, 1200, "Whistling rockets — loud whistle on ascent followed by aerial burst."),
  item("fountain", "Mega Peacock (3 Face)", "1 box (5 pcs)", 280, 1400, "Mega Peacock 3-face fountain — three-directional colour fountain."),
  item("fountain", "Bada Peacock (5 Face)", "1 box (5 pcs)", 420, 2100, "Bada Peacock 5-face fountain — five-way colour spray."),
  item("fountain", "Magic Peacock", "1 box (5 pcs)", 180, 900, "Magic Peacock fountain — rotating colour fountain with peacock-tail effect."),
  item("fountain", "Rotate Sparklers", "1 box (10 pcs)", 240, 1200, "Rotating sparkler / dancing umbrella — spins on ground while emitting sparks."),
  item("fountain", "Colour Koti", "1 box (10 pcs)", 240, 1200, "Colour Koti 3-colour fountain — red, green and gold spray effect."),
  item("fountain", "Tin Colour Fountain", "1 box (5 pcs)", 90, 450, "Tin colour fountain — compact metal-cased fountain with mixed colour sparks."),
  item("fountain", "Butterfly", "1 box (10 pcs)", 120, 600, "Butterfly colour-changing fountain — sparks change colour during burn."),
  item("fountain", "Mega Siren", "1 box (3 pcs)", 200, 1000, "Mega Siren fountain — loud siren sound with colour fountain effect."),
  item("fountain", "Naya Falls", "1 box (5 pcs)", 380, 1900, "Naya Falls waterfall fountain — cascading golden sparks like a waterfall."),
  item("bombs", "Bullet Bomb", "1 pc", 90, 450, "Bullet Bomb — loud single blast. Use only in wide open ground."),
  item("bombs", "Hydro Bomb", "1 box (10 pcs)", 70, 350, "Hydro bomb crackers — deep thunder sound. 10 pcs per box. Open area only."),
  item("bombs", "Classic Bomb", "1 box (10 pcs)", 160, 800, "Classic bomb — extra-loud atom bomb series with sharp report."),
  item("bombs", "Digital Bomb", "1 box (10 pcs)", 280, 1400, "Digital bomb — loudest in atom bomb range. Deep resonating blast."),
  item("bombs", "Paper Bomb (½ Kg)", "1 pc", 120, 600, "½ kg paper bomb — heavy single blast for large open areas."),
  item("bombs", "Paper Bomb (1 Kg)", "1 pc", 240, 1200, "1 kg mega paper bomb — maximum single-shot sound effect."),
  item("lakshmi", "3¼ Lakshmi (1 Packet)", "1 pkt (5 pcs)", 15, 75, "3.25 inch Lakshmi crackers — traditional sharp sound. 5 pieces per packet."),
  item("lakshmi", "Gold Lakshmi (1 Packet)", "1 pkt (5 pcs)", 35, 175, "Gold Lakshmi premium sound crackers — louder burst with gold-label quality."),
  item("lakshmi", "4 DLX Lakshmi", "1 pkt (5 pcs)", 28, 140, "4 inch deluxe Lakshmi crackers — enhanced sound and longer burn."),
  item("lakshmi", "Hulk DLX", "1 pkt (5 pcs)", 38, 190, "Hulk deluxe mega sound crackers — extra loud burst."),
  item("lakshmi", "5\" Lion (1 Packet)", "1 pkt (5 pcs)", 44, 220, "5 inch Lion brand crackers — deep loud report. Premium sound cracker."),
  item("lakshmi", "Red Bijili (100)", "1 bag (100 pcs)", 28, 140, "Red bijili — small single-shot crackers, 100 pieces per bag."),
  item("lakshmi", "Two Sound (1 Packet)", "1 pkt (5 pcs)", 45, 230, "Two-sound crackers — traditional double-report sound. 5 pcs per packet."),
  item("lakshmi", "Jallikattu DLX (1 Packet)", "1 pkt (5 pcs)", 65, 325, "Jallikattu deluxe sound crackers — loud burst. 5 pcs per packet."),
  item("lakshmi", "2¾ Kuruvi", "1 pkt (5 pcs)", 8, 40, "2.75 inch Kuruvi crackers — classic small sound cracker."),
  item("kids", "Roll Cap", "1 box (10 pcs)", 85, 425, "Roll cap strips — safe fun for kids, produces small popping sounds."),
  item("kids", "Wonder Throw Box", "1 box (10 pcs)", 120, 600, "Wonder throw box — throw-and-pop novelty cracker for kids with supervision."),
  item("kids", "Sky Lander (1 Piece)", "1 pc", 50, 250, "Sky Lander helicopter novelty — spins up into the air with sparks."),
  item("kids", "Pop Pop (50 Boxes)", "1 pack (50 boxes)", 400, 2000, "Pop Pop snappers — 50 boxes of safe popping fun for kids."),
  item("kids", "Bidi Blast (10 Boxes)", "1 pack (10 boxes)", 150, 750, "Bidi Blast novelty — small crackling pop effect. 10 boxes per pack."),
  item("kids", "Gun with 3 Ring Caps", "1 set", 100, 500, "Toy gun with 3 ring cap rolls — classic kids' firework toy."),
  item("kids", "Ring Cap (100 Packets)", "1 pack (100 pkt)", 750, 3750, "Ring caps bulk pack — 100 packets for toy guns."),
  item("kids", "Anaconda (10 Boxes)", "1 pack (10 boxes)", 50, 250, "Anaconda snake novelty — expanding snake effect on ignition."),
  item("kids", "Selfie Stick", "1 box (5 pcs)", 170, 850, "Selfie Stick photo flash — bright white flash effect for photos."),
  item("kids", "Colour Smoke", "1 box (5 pcs)", 180, 900, "Colour smoke fountain — coloured smoke plume. Daytime-friendly."),
  item("kids", "Photo Flash", "1 box (10 pcs)", 90, 450, "Photo flash crackers — bright white strobe flash for night celebrations."),
  item("wala", "28 Wala", "1 string", 15, 75, "28 crackers string (wala) — short garland for quick celebration burst."),
  item("wala", "100 Wala", "1 string", 45, 225, "100 wala cracker garland — continuous chain firing."),
  item("wala", "200 Wala", "1 string", 90, 450, "200 wala garland — longer continuous burst sequence."),
  item("wala", "24 DLX Wala", "1 string", 60, 300, "24 deluxe wala — premium quality thread with louder individual crackers."),
  item("wala", "1000 Wala", "1 box", 220, 1100, "1000 wala garland ladi — extended continuous firing for grand celebrations."),
  item("wala", "2000 Wala", "1 box", 440, 2200, "2000 wala mega garland — long continuous burst. Ideal for Diwali finale."),
  item("wala", "5000 Wala", "1 box", 1100, 5500, "5000 wala super garland — one of the longest ladi chains."),
  item("wala", "10000 Wala", "1 box", 2200, 11000, "10000 wala jumbo garland — maximum length continuous cracker chain."),
];
