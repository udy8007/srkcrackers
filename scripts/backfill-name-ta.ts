/**
 * Backfill Product.nameTa from English → Tamil mapping.
 * Run: npx tsx scripts/backfill-name-ta.ts
 */
import { PrismaClient } from "@prisma/client";

const NAME_TA: Record<string, string> = {
  "7 cm Electric Sparklers": "7 செ.மீ. எலக்ட்ரிக் கம்பி மத்தாப்பு",
  "7 cm Colour Sparklers": "7 செ.மீ. கலர் கம்பி மத்தாப்பு",
  "10 cm Electric Sparklers": "10 செ.மீ. எலக்ட்ரிக் கம்பி மத்தாப்பு",
  "10 cm Colour Sparklers": "10 செ.மீ. கலர் கம்பி மத்தாப்பு",
  "15 cm Electric Sparklers": "15 செ.மீ. எலக்ட்ரிக் கம்பி மத்தாப்பு",
  "15 cm Green Sparklers": "15 செ.மீ. பச்சை கம்பி மத்தாப்பு",
  "15 cm Red Sparklers": "15 செ.மீ. சிவப்பு கம்பி மத்தாப்பு",
  "30 cm Electric Sparklers": "30 செ.மீ. எலக்ட்ரிக் கம்பி மத்தாப்பு",
  "30 cm Colour Sparklers": "30 செ.மீ. கலர் கம்பி மத்தாப்பு",
  "50 cm Electric Sparklers": "50 செ.மீ. எலக்ட்ரிக் கம்பி மத்தாப்பு",
  "Twinkling Star": "ட்விங்கிளிங் ஸ்டார்",
  "1½ Twinkling Star": "1½ ட்விங்கிளிங் ஸ்டார்",
  "Twinkling Star Deluxe": "டீலக்ஸ் ட்விங்கிளிங் ஸ்டார்",
  "Green Colour (Torch)": "பச்சை டார்ச்",
  "Deluxe Chakkar": "டீலக்ஸ் சக்கரம்",
  "Special Chakkar": "ஸ்பெஷல் சக்கரம்",
  "Colour Swirls": "கலர் சுழல்",
  "Kurkure Crackling 12 Shot": "குர்குரே 12 ஷாட்",
  "60 Multi Colour Shot": "60 மல்டி கலர் ஷாட்",
  "Chota Fancy": "சோட்டா பேன்சி",
  '2" Fancy': "2 அங்குல் பேன்சி",
  '2" Fancy (3 Pcs)': "2 அங்குல் பேன்சி (3 பீஸ்)",
  "2 Inch Double Ball": "2 அங்குல் டபுள் பால்",
  '2" Pipe': "2 அங்குல் பைப்",
  '3" Fancy': "3 அங்குல் பேன்சி",
  '3½" Fancy': "3½ அங்குல் பேன்சி",
  '4" Fancy': "4 அங்குல் பேன்சி",
  "5 Inch Fancy 2 in 1": "5 அங்குல் 2 இன் 1 பேன்சி",
  "3 Pcs Sky Shot": "3 பீஸ் ஸ்கை ஷாட்",
  "7 Shots": "7 ஷாட்ஸ்",
  "30 Shots Multi Colour": "30 ஷாட்ஸ் மல்டி கலர்",
  "120 Shots": "120 ஷாட்ஸ்",
  Helicopter: "ஹெலிகாப்டர்",
  "Rocket Bomb": "ராக்கெட் பாம்",
  "Whistling Rocket": "விசில் ராக்கெட்",
  "Flower Pot Asoka": "அசோகா பூச்சட்டி",
  "Flower Pots Special": "ஸ்பெஷல் பூச்சட்டி",
  "Flower Pots Deluxe": "டீலக்ஸ் பூச்சட்டி",
  "Colour Koti": "கலர் கோட்டி",
  "Colour Koti Deluxe": "டீலக்ஸ் கலர் கோட்டி",
  Butterfly: "பட்டாம்பூச்சி",
  "Rotate Sparklers": "சுழலும் கம்பி மத்தாப்பு",
  "Mini Siren": "மினி சைரன்",
  "Mega Siren": "மெகா சைரன்",
  "Magic Peacock": "மேஜிக் மயில்",
  "Bada Peacock": "பெரிய மயில்",
  "Naya Falls": "நயா நீர்வீழ்ச்சி",
  "Hitler Paper Bomb": "ஹிட்லர் பேப்பர் வெடி",
  "Kaki Ola Vedi": "காக்கி ஓலை வெடி",
  "Hydro Bomb": "ஹைட்ரோ பாம்",
  "Classic Bomb": "கிளாசிக் பாம்",
  "Digital Bomb": "டிஜிட்டல் பாம்",
  "Paper Bomb (½ Kg)": "அரை கிலோ பேப்பர் பாம்",
  "Paper Bomb (1 Kg)": "1 கிலோ பேப்பர் பாம்",
  '4" Gun Out': "4 அங்குல் இடி முழக்கம்",
  "2¾ Kuruvi": "2¾ குருவி வெடி",
  "3¼ Lakshmi": "3¼ லட்சுமி வெடி",
  "4 DLX Lakshmi": "4 டீலக்ஸ் லட்சுமி வெடி",
  "Gold Lakshmi": "கோல்டு லட்சுமி வெடி",
  "Hulk DLX": "ஹல்க் டீலக்ஸ்",
  '5" Lion': "5 அங்குல் லயன் வெடி",
  "Red Bijili": "ரெட் பிஜிலி",
  "Two Sound": "டூ சவுண்ட்",
  "Jallikattu DLX": "ஜல்லிக்கட்டு டீலக்ஸ்",
  "Roll Cap": "ரோல் கேப்",
  "Wonder Throw Box": "வொண்டர் த்ரோ பாக்ஸ்",
  "Pop Pop": "பாப் பாப்",
  "Beedi Blast": "பீடி பிளாஸ்ட்",
  "Gun with 3 Ring Caps": "3 ரிங் கேப்புடன் துப்பாக்கி",
  "Ring Cap": "ரிங் கேப்",
  Anaconda: "அனகொண்டா",
  "Selfie Stick": "செல்ஃபி ஸ்டிக்",
  "Colour Smoke": "கலர் புகை",
  "Photo Flash": "போட்டோ பிளாஷ்",
  "Sky Lander": "ஸ்கை லேண்டர்",
  Kitkat: "கிட்கேட்",
  Guitar: "கிட்டார்",
  "Lighter Stick": "லைட்டர் ஸ்டிக்",
  "28 Wala": "28 வாலா",
  "100 Wala": "100 வாலா",
  "200 Wala": "200 வாலா",
  "1000 Wala": "1000 வாலா",
  "2000 Wala": "2000 வாலா",
  "5000 Wala": "5000 வாலா",
  "10000 Wala": "10000 வாலா",
};

/** Extra DB-name aliases → canonical English key in NAME_TA */
const ALIASES: Record<string, string> = {
  "hitler (¼ kg) paper bomb": "Hitler Paper Bomb",
  "hitler paper bomb": "Hitler Paper Bomb",
  "120shots": "120 Shots",
  "120 shots": "120 Shots",
  "2 inch double ball": "2 Inch Double Ball",
  "colour swirls (special)": "Colour Swirls",
  "1½ twinkling star": "1½ Twinkling Star",
};

function normalize(name: string): string {
  return name
    .normalize("NFKC")
    .replace(/[“”„]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Strip trailing pack/qty notes like "(5pcs)", "(1 Packet)", "(Special)". */
function stripPackSuffix(name: string): string {
  return name.replace(/\s*\([^)]*\)\s*$/g, "").trim();
}

const NORMALIZED = new Map(
  Object.entries(NAME_TA).map(([en, ta]) => [normalize(en), { en, ta }] as const),
);

function resolveTamil(dbName: string): string | null {
  // Exact
  if (NAME_TA[dbName]) return NAME_TA[dbName];

  const n = normalize(dbName);
  if (NORMALIZED.has(n)) return NORMALIZED.get(n)!.ta;
  if (ALIASES[n] && NAME_TA[ALIASES[n]]) return NAME_TA[ALIASES[n]];

  // Without trailing (pack) suffix
  const stripped = stripPackSuffix(dbName);
  if (stripped !== dbName) {
    if (NAME_TA[stripped]) return NAME_TA[stripped];
    const ns = normalize(stripped);
    if (NORMALIZED.has(ns)) return NORMALIZED.get(ns)!.ta;
    if (ALIASES[ns] && NAME_TA[ALIASES[ns]]) return NAME_TA[ALIASES[ns]];
  }

  // Prefix match: DB "Mega Siren (3pcs)" vs key "Mega Siren"
  // Prefer longest matching English key
  let best: { len: number; ta: string } | null = null;
  for (const [en, ta] of Object.entries(NAME_TA)) {
    const enN = normalize(en);
    if (n === enN || n.startsWith(enN + " ") || n.startsWith(enN + "(")) {
      if (!best || enN.length > best.len) best = { len: enN.length, ta };
    }
  }
  return best?.ta ?? null;
}

async function main() {
  const prisma = new PrismaClient();
  try {
    const products = await prisma.product.findMany({
      select: { id: true, name: true, nameTa: true },
      orderBy: { sortOrder: "asc" },
    });

    let updated = 0;
    let skipped = 0;
    const unmatched: string[] = [];

    for (const product of products) {
      const ta = resolveTamil(product.name);

      if (!ta) {
        unmatched.push(product.name);
        continue;
      }

      if (product.nameTa === ta) {
        skipped++;
        continue;
      }

      await prisma.product.update({
        where: { id: product.id },
        data: { nameTa: ta },
      });
      updated++;
      console.log(`✓ ${product.name} → ${ta}`);
    }

    console.log("\n--- Summary ---");
    console.log(`Total products: ${products.length}`);
    console.log(`Updated: ${updated}`);
    console.log(`Already set: ${skipped}`);
    console.log(`Unmatched: ${unmatched.length}`);
    if (unmatched.length) {
      console.log("Unmatched names:");
      for (const name of unmatched) console.log(`  - ${name}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
