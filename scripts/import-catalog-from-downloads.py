"""
Copy mapped product photos from Downloads into public/products/photos,
and write prisma/seed-catalog.json for the TypeScript seed/sync step.
"""
from __future__ import annotations

import json
import re
import shutil
from pathlib import Path

SRC = Path(r"c:\Users\udhayakumar.k.DC\Downloads\Image\images")
PHOTOS = Path(r"c:\Users\udhayakumar.k.DC\source\srk\srkcrackers\public\products\photos")
OUT_JSON = Path(r"c:\Users\udhayakumar.k.DC\source\srk\srkcrackers\prisma\seed-catalog.json")

# PDF 14 Jul 2026 — Offer Price is sale price; MRP from PDF when present.
# Image file (basename in SRC) when we have a high-confidence match.
CATALOG = [
    # SPARKLERS
    {"cat": "sparklers", "name": "7 cm Electric Sparklers", "pack": "1 box (10 pcs)", "mrp": 60, "price": 13, "image": None, "desc": "Classic 7 cm electric sparklers with bright golden sparks. Safe for children under adult supervision."},
    {"cat": "sparklers", "name": "7 cm Colour Sparklers", "pack": "1 box (10 pcs)", "mrp": 75, "price": 15, "image": None, "desc": "7 cm colour sparklers — multi-colour sparks. Popular for kids and family celebrations."},
    {"cat": "sparklers", "name": "10 cm Electric Sparklers", "pack": "1 box (10 pcs)", "mrp": 90, "price": 18, "image": None, "desc": "10 cm electric sparklers with longer burn time and brighter golden display."},
    {"cat": "sparklers", "name": "10 cm Colour Sparklers", "pack": "1 box (10 pcs)", "mrp": 100, "price": 20, "image": None, "desc": "10 cm colour sparklers — vibrant mixed-colour sparks."},
    {"cat": "sparklers", "name": "15 cm Electric Sparklers", "pack": "1 box (10 pcs)", "mrp": 150, "price": 30, "image": None, "desc": "15 cm electric sparklers — tall golden fountain effect on a stick."},
    {"cat": "sparklers", "name": "15 cm Green Sparklers", "pack": "1 box (10 pcs)", "mrp": 275, "price": 55, "image": None, "desc": "15 cm green-colour sparklers with rich emerald-gold sparks."},
    {"cat": "sparklers", "name": "15 cm Red Sparklers", "pack": "1 box (10 pcs)", "mrp": 325, "price": 65, "image": None, "desc": "15 cm red sparklers — deep red and gold sparks."},
    {"cat": "sparklers", "name": "30 cm Electric Sparklers", "pack": "1 box (5 pcs)", "mrp": 225, "price": 45, "image": None, "desc": "30 cm mega electric sparklers — extra-long burn with shower of golden sparks."},
    {"cat": "sparklers", "name": "30 cm Colour Sparklers", "pack": "1 box (5 pcs)", "mrp": 275, "price": 55, "image": None, "desc": "30 cm colour sparklers — spectacular multi-colour shower effect."},
    {"cat": "sparklers", "name": "50 cm Electric Sparklers", "pack": "1 box (5 pcs)", "mrp": 900, "price": 180, "image": None, "desc": "50 cm jumbo electric sparklers — longest sparkler in our range."},
    {"cat": "sparklers", "name": "1½ Twinkling Star", "pack": "1 box (10 pcs)", "mrp": 150, "price": 30, "image": "efb9f42b-364c-4c01-b518-bdfafc90f7e9.png", "desc": "1½ twinkling star sparklers — crackling / twinkling effect. 10 pcs per box."},
    {"cat": "fountain", "name": "Flower Pot Asoka", "pack": "10 pcs", "mrp": 850, "price": 170, "image": "ChatGPT Image Jul 14, 2026, 11_39_29 AM.png", "desc": "Flower Pot Asoka — classic cone flower-pot fountains. 10 pcs."},
    # FANCY
    {"cat": "fancy", "name": "5 inch Fancy 2 in 1", "pack": "1 box", "mrp": 1491, "price": 790, "image": "ChatGPT Image Jul 14, 2026, 11_39_42 AM.png", "desc": "5 inch Fancy 2-in-1 combo pack — premium dual-effect aerial fancy."},
    {"cat": "fancy", "name": "2 inch Double Ball", "pack": "1 pc", "mrp": 1320, "price": 260, "image": "ChatGPT Image Jul 14, 2026, 11_39_51 AM.png", "desc": "2 inch Double Ball aerial — dual-burst sky shot. Single piece."},
    {"cat": "fancy", "name": '2" Fancy', "pack": "1 pc", "mrp": 600, "price": 120, "image": None, "desc": "2 inch aerial fancy — shoots skyward and bursts with colourful stars."},
    {"cat": "fancy", "name": '2" Fancy (3 Pcs)', "pack": "1 box (3 pcs)", "mrp": 1400, "price": 280, "image": None, "desc": "2 inch fancy sky shots — box of 3 aerial bursts."},
    {"cat": "fancy", "name": '3" Fancy', "pack": "1 pc", "mrp": 1400, "price": 280, "image": None, "desc": "3 inch aerial fancy — rich colour mix sky shot."},
    {"cat": "fancy", "name": '3½" Fancy (1 Piece)', "pack": "1 pc", "mrp": 1600, "price": 320, "image": None, "desc": "Premium 3.5 inch single-piece fancy — maximum height and brightest colour burst."},
    {"cat": "fancy", "name": '4" Fancy', "pack": "1 pc", "mrp": 1860, "price": 380, "image": None, "desc": "4 inch aerial fancy — loud report with wide multi-colour star burst."},
    {"cat": "fancy", "name": '4" Fancy (2 pcs)', "pack": "1 box (2 pcs)", "mrp": 3250, "price": 650, "image": None, "desc": "4 inch fancy twin pack — two premium aerial bursts."},
    {"cat": "fancy", "name": "30 Shots Multi Colour", "pack": "1 box (1 set)", "mrp": 2350, "price": 480, "image": "97849909-4311-417b-91ac-9ed16346ec08.png", "desc": "30-shot multi-colour aerial display — continuous sky shots."},
    {"cat": "fancy", "name": '3 Pcs Sky Shot (2")', "pack": "1 box (3 pcs)", "mrp": 2900, "price": 580, "image": None, "desc": "Triple 2 inch sky shot pack — three consecutive aerial bursts."},
    {"cat": "fancy", "name": '2" Pipe (1 Piece)', "pack": "1 pc", "mrp": 750, "price": 150, "image": None, "desc": "2 inch pipe sky shot — cylindrical aerial cracker with sharp burst."},
    {"cat": "fancy", "name": "12 Shots", "pack": "1 box (5 pcs)", "mrp": 1400, "price": 280, "image": "81dac276-adc4-491d-b5a2-8277903997a9.png", "desc": "12-shot multi-burst aerial set — sequential sky shots."},
    {"cat": "fancy", "name": "7 Shots", "pack": "1 box (1 set)", "mrp": 700, "price": 140, "image": "2e218feb-525a-404b-94d4-c9c1090d249d.png", "desc": "7-shot multi-burst aerial display — sequential sky shots in one compact set."},
    # ROCKETS
    {"cat": "rockets", "name": "Sky Scrapper", "pack": "1 pc", "mrp": 700, "price": 140, "image": None, "desc": "Sky Scrapper rocket-style aerial — high altitude burst with trailing sparks."},
    {"cat": "rockets", "name": "Rocket Bomb", "pack": "1 box (10 pcs)", "mrp": 600, "price": 120, "image": None, "desc": "Rocket bomb crackers — launches with whistle and bursts in the sky."},
    {"cat": "rockets", "name": "Whistling Rocket", "pack": "1 box (10 pcs)", "mrp": 1200, "price": 240, "image": None, "desc": "Whistling rockets — loud whistle on ascent followed by aerial burst."},
    # FOUNTAINS
    {"cat": "fountain", "name": "Mega Peacock (3 Face)", "pack": "1 box (5 pcs)", "mrp": 1400, "price": 280, "image": None, "desc": "Mega Peacock 3-face fountain — three-directional colour fountain."},
    {"cat": "fountain", "name": "Bada Peacock (5 Face)", "pack": "1 box (5 pcs)", "mrp": 2100, "price": 420, "image": None, "desc": "Bada Peacock 5-face fountain — five-way colour spray."},
    {"cat": "fountain", "name": "Magic Peacock", "pack": "1 box (5 pcs)", "mrp": 900, "price": 180, "image": "ChatGPT Image Jul 14, 2026, 11_39_17 AM.png", "desc": "Magic Peacock fountain — rotating colour fountain with peacock-tail effect."},
    {"cat": "fountain", "name": "Rotate Sparklers", "pack": "1 box (10 pcs)", "mrp": 1200, "price": 240, "image": None, "desc": "Rotating sparkler / dancing umbrella — spins on ground while emitting sparks."},
    {"cat": "fountain", "name": "Colour Koti", "pack": "1 box (10 pcs)", "mrp": 1200, "price": 240, "image": "22494b74-0ae9-45e2-b3da-c28f2a695809.png", "desc": "Colour Koti 3-colour fountain — red, green and gold spray effect."},
    {"cat": "fountain", "name": "Tin Colour Fountain", "pack": "1 box (5 pcs)", "mrp": 450, "price": 90, "image": None, "desc": "Tin colour fountain — compact metal-cased fountain with mixed colour sparks."},
    {"cat": "fountain", "name": "Butterfly", "pack": "1 box (10 pcs)", "mrp": 600, "price": 120, "image": None, "desc": "Butterfly colour-changing fountain — sparks change colour during burn."},
    {"cat": "fountain", "name": "Mega Siren", "pack": "1 box (3 pcs)", "mrp": 1000, "price": 200, "image": None, "desc": "Mega Siren fountain — loud siren sound with colour fountain effect."},
    {"cat": "fountain", "name": "Naya Falls", "pack": "1 box (5 pcs)", "mrp": 1900, "price": 380, "image": "2bbcf453-34c9-4d11-9025-3d4109ddd7d5.png", "desc": "Naya Falls waterfall fountain — cascading golden sparks like a waterfall."},
    # BOMBS
    {"cat": "bombs", "name": "Bullet Bomb", "pack": "1 pc", "mrp": 450, "price": 90, "image": "30086ac1-af0e-42f4-b93f-c2e38854e410.png", "desc": "Bullet Bomb — loud single blast. Use only in wide open ground."},
    {"cat": "bombs", "name": "Hydro Bomb", "pack": "1 box (10 pcs)", "mrp": 350, "price": 70, "image": "ChatGPT Image Jul 14, 2026, 11_40_31 AM.png", "desc": "Hydro bomb crackers — deep thunder sound. 10 pcs per box. Open area only."},
    {"cat": "bombs", "name": "Classic Bomb", "pack": "1 box (10 pcs)", "mrp": 800, "price": 160, "image": "5daa399b-8c01-4d7a-8753-f65a6fe0dd88.png", "desc": "Classic bomb — extra-loud atom bomb series with sharp report."},
    {"cat": "bombs", "name": "Digital Bomb", "pack": "1 box (10 pcs)", "mrp": 1400, "price": 280, "image": "eff55982-9dbd-4656-838c-a411c83a8a99.png", "desc": "Digital bomb — loudest in atom bomb range. Deep resonating blast."},
    {"cat": "bombs", "name": "Paper Bomb (½ Kg)", "pack": "1 pc", "mrp": 600, "price": 120, "image": None, "desc": "½ kg paper bomb — heavy single blast for large open areas."},
    {"cat": "bombs", "name": "Paper Bomb (1 Kg)", "pack": "1 pc", "mrp": 1200, "price": 240, "image": None, "desc": "1 kg mega paper bomb — maximum single-shot sound effect."},
    # SOUND
    {"cat": "lakshmi", "name": "3¼ Lakshmi (1 Packet)", "pack": "1 pkt (5 pcs)", "mrp": 75, "price": 15, "image": "ae4b6c35-f13b-41db-a514-1ce3862d286c.png", "desc": "3.25 inch Lakshmi crackers — traditional sharp sound. 5 pieces per packet."},
    {"cat": "lakshmi", "name": "Gold Lakshmi (1 Packet)", "pack": "1 pkt (5 pcs)", "mrp": 175, "price": 35, "image": "0b49cb22-2de4-4912-826c-a3d3e43aa97e.png", "desc": "Gold Lakshmi premium sound crackers — louder burst with gold-label quality."},
    {"cat": "lakshmi", "name": "4 DLX Lakshmi", "pack": "1 pkt (5 pcs)", "mrp": 140, "price": 28, "image": "f372f1d4-e20d-4a25-a7fd-66bee84e96f1.png", "desc": "4 inch deluxe Lakshmi crackers — enhanced sound and longer burn."},
    {"cat": "lakshmi", "name": "Hulk DLX", "pack": "1 pkt (5 pcs)", "mrp": 190, "price": 38, "image": None, "desc": "Hulk deluxe mega sound crackers — extra loud burst."},
    {"cat": "lakshmi", "name": '5" Lion (1 Packet)', "pack": "1 pkt (5 pcs)", "mrp": 220, "price": 44, "image": "153ae031-ef2e-4214-b8eb-dc367fdf2312.png", "desc": "5 inch Lion brand crackers — deep loud report. Premium sound cracker."},
    {"cat": "lakshmi", "name": "Red Bijili (100)", "pack": "1 bag (100 pcs)", "mrp": 140, "price": 28, "image": "5677f15a-4c32-4430-8471-5a1b1571cf34.png", "desc": "Red bijili — small single-shot crackers, 100 pieces per bag."},
    {"cat": "lakshmi", "name": "Two Sound (1 Packet)", "pack": "1 pkt (5 pcs)", "mrp": 230, "price": 45, "image": None, "desc": "Two-sound crackers — traditional double-report sound. 5 pcs per packet."},
    {"cat": "lakshmi", "name": "Jallikattu DLX (1 Packet)", "pack": "1 pkt (5 pcs)", "mrp": 325, "price": 65, "image": "d12cf0ca-9877-45c2-a831-9e226a6b5483.png", "desc": "Jallikattu deluxe sound crackers — loud burst. 5 pcs per packet."},
    {"cat": "lakshmi", "name": "2¾ Kuruvi", "pack": "1 pkt (5 pcs)", "mrp": 40, "price": 8, "image": "42ab9bb7-e35a-473c-ab8f-c2eaab6f8c6b.png", "desc": "2.75 inch Kuruvi crackers — classic small sound cracker."},
    # KIDS
    {"cat": "kids", "name": "Roll Cap", "pack": "1 box (10 pcs)", "mrp": 425, "price": 85, "image": "rol 1.jpeg", "desc": "Roll cap strips — safe fun for kids, produces small popping sounds."},
    {"cat": "kids", "name": "Wonder Throw Box", "pack": "1 box (10 pcs)", "mrp": 600, "price": 120, "image": "ChatGPT Image Jul 14, 2026, 11_13_13 AM.png", "desc": "Wonder throw box — throw-and-pop novelty cracker for kids with supervision."},
    {"cat": "kids", "name": "Sky Lander (1 Piece)", "pack": "1 pc", "mrp": 250, "price": 50, "image": None, "desc": "Sky Lander helicopter novelty — spins up into the air with sparks."},
    {"cat": "kids", "name": "Pop Pop (50 Boxes)", "pack": "1 pack (50 boxes)", "mrp": 2000, "price": 400, "image": None, "desc": "Pop Pop snappers — 50 boxes of safe popping fun for kids."},
    {"cat": "kids", "name": "Bidi Blast (10 Boxes)", "pack": "1 pack (10 boxes)", "mrp": 750, "price": 150, "image": None, "desc": "Bidi Blast novelty — small crackling pop effect. 10 boxes per pack."},
    {"cat": "kids", "name": "Gun with 3 Ring Caps", "pack": "1 set", "mrp": 500, "price": 100, "image": "ChatGPT Image Jul 14, 2026, 11_13_34 AM.png", "desc": "Toy gun with 3 ring cap rolls — classic kids' firework toy."},
    {"cat": "kids", "name": "Ring Cap (100 Packets)", "pack": "1 pack (100 pkt)", "mrp": 3750, "price": 750, "image": "74682011-05b7-4ae5-ab24-9f6a48bb9873.png", "desc": "Ring caps bulk pack — 100 packets for toy guns."},
    {"cat": "kids", "name": "Anaconda (10 Boxes)", "pack": "1 pack (10 boxes)", "mrp": 250, "price": 50, "image": None, "desc": "Anaconda snake novelty — expanding snake effect on ignition."},
    {"cat": "kids", "name": "Selfie Stick", "pack": "1 box (5 pcs)", "mrp": 850, "price": 170, "image": "a759ef97-d583-40b3-b692-0de2bd60b5e6.png", "desc": "Selfie Stick photo flash — bright white flash effect for photos."},
    {"cat": "kids", "name": "Colour Smoke", "pack": "1 box (5 pcs)", "mrp": 900, "price": 180, "image": None, "desc": "Colour smoke fountain — coloured smoke plume. Daytime-friendly."},
    {"cat": "kids", "name": "Photo Flash", "pack": "1 box (10 pcs)", "mrp": 450, "price": 90, "image": None, "desc": "Photo flash crackers — bright white strobe flash for night celebrations."},
    # WALA
    {"cat": "wala", "name": "28 Wala", "pack": "1 string", "mrp": 75, "price": 15, "image": "2238c344-9579-4934-a3ba-aa0599d82abe.png", "desc": "28 crackers string (wala) — short garland for quick celebration burst."},
    {"cat": "wala", "name": "100 Wala", "pack": "1 string", "mrp": 225, "price": 45, "image": "cde8e28c-9d21-4415-964c-95ffa9b27162.png", "desc": "100 wala cracker garland — continuous chain firing."},
    {"cat": "wala", "name": "200 Wala", "pack": "1 string", "mrp": 450, "price": 90, "image": "15ade38a-0355-4747-8111-a82145cf227f.png", "desc": "200 wala garland — longer continuous burst sequence."},
    {"cat": "wala", "name": "24 DLX Wala", "pack": "1 string", "mrp": 300, "price": 60, "image": "92aac6bc-41c3-40e2-ad5e-95493f977b05.png", "desc": "24 deluxe wala — premium quality thread with louder individual crackers."},
    {"cat": "wala", "name": "1000 Wala", "pack": "1 box", "mrp": 1100, "price": 220, "image": "feea1728-0805-479c-8e32-65f6c55642d2.png", "desc": "1000 wala garland ladi — extended continuous firing for grand celebrations."},
    {"cat": "wala", "name": "2000 Wala", "pack": "1 box", "mrp": 2200, "price": 440, "image": "a3b47cd2-4412-4ec2-9572-b19f4c2e7986.png", "desc": "2000 wala mega garland — long continuous burst. Ideal for Diwali finale."},
    {"cat": "wala", "name": "5000 Wala", "pack": "1 box", "mrp": 5500, "price": 1100, "image": "d2d8b661-26e9-4167-948a-a1734e4042c1.png", "desc": "5000 wala super garland — one of the longest ladi chains."},
    {"cat": "wala", "name": "10000 Wala", "pack": "1 box", "mrp": 11000, "price": 2200, "image": "7b73cb6c-9a28-4f4e-b9af-d036b290bc7e.png", "desc": "10000 wala jumbo garland — maximum length continuous cracker chain."},
]

CATEGORY_FALLBACK = {
    "sparklers": "/products/sparklers.svg",
    "fancy": "/products/fancy.svg",
    "rockets": "/products/fancy.svg",
    "fountain": "/products/fountain.svg",
    "bombs": "/products/bombs.svg",
    "lakshmi": "/products/lakshmi.svg",
    "kids": "/products/kids.svg",
    "wala": "/products/wala.svg",
}


def slugify(name: str) -> str:
    s = name.lower()
    for a, b in (
        ("3½", "3-5"),
        ("3¼", "3-25"),
        ("2¾", "2-75"),
        ("1½", "1-5"),
        ("½", "half"),
        ("¼", "quarter"),
        ('"', "in"),
        ("″", "in"),
    ):
        s = s.replace(a, b)
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s


def main() -> None:
    if PHOTOS.exists():
        shutil.rmtree(PHOTOS)
    PHOTOS.mkdir(parents=True)

    products_out = []
    copied = 0
    for row in CATALOG:
        slug = slugify(row["name"])
        image_path = CATEGORY_FALLBACK[row["cat"]]
        src_name = row.get("image")
        if src_name:
            src = SRC / src_name
            if src.exists():
                ext = src.suffix.lower() or ".png"
                dest_name = f"{slug}{ext}"
                dest = PHOTOS / dest_name
                shutil.copy2(src, dest)
                image_path = f"/products/photos/{dest_name}"
                copied += 1
            else:
                print("MISSING SOURCE:", src_name)
        products_out.append(
            {
                "cat": row["cat"],
                "name": row["name"],
                "pack": row["pack"],
                "price": row["price"],
                "mrp": row["mrp"],
                "image": image_path,
                "description": row["desc"],
            }
        )

    OUT_JSON.write_text(json.dumps({"products": products_out}, indent=2), encoding="utf-8")
    print(f"Copied {copied} photos -> {PHOTOS}")
    print(f"Wrote {len(products_out)} products -> {OUT_JSON}")


if __name__ == "__main__":
    main()
