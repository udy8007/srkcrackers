export interface ChatReply {
  keys: string[];
  reply: string;
}

export const CHAT_GREETING =
  "Vanakkam! 👋 I'm the <b>SRK Crackers</b> demo assistant. Ask about products, orders, offers, address or phone number!";

export const CHAT_FALLBACK =
  "🤔 Sorry, I didn't understand that. Try quick buttons below or call us at <b>98419 16899</b>. For orders use WhatsApp! 💬";

export const QUICK_REPLIES = [
  { label: "🛍️ Products", value: "Products" },
  { label: "📦 How to Order", value: "Order" },
  { label: "📞 Phone", value: "Phone" },
  { label: "📍 Address", value: "Address" },
  { label: "🎇 80% Offer", value: "Offer" },
  { label: "💰 Min Order", value: "Min order" },
] as const;

export const CHAT_REPLIES: ChatReply[] = [
  { keys: ["hi", "hello", "hey", "vanakkam", "start"], reply: "Vanakkam! 👋 Welcome to <b>SRK Crackers</b>. I can help with products, orders, offers &amp; address. Tap a quick button below or type your question!" },
  { keys: ["product", "cracker", "pattasu", "list", "price"], reply: "🛍️ We have Sparklers, Flower Pots, Rockets, Chakkar, Bombs, Garlands &amp; Sky Shots — all at <b>80% OFF</b>! Scroll to <a href='#products'>Quick Order</a> to browse and add to cart." },
  { keys: ["order", "buy", "purchase", "cart", "how to"], reply: "📦 <b>How to Order:</b><br>1. Select products &amp; quantity<br>2. Click <b>Place Order</b><br>3. Fill your details<br>4. Pay via GPay QR<br>5. Upload payment screenshot<br>6. Track at <a href='#track'>Track Order</a>" },
  { keys: ["phone", "call", "contact", "number", "mobile"], reply: "📞 Call us: <b><a href='tel:9841916899'>98419 16899</a></b><br>🕐 9:00 AM – 9:00 PM (Diwali season)<br>💬 Or <a href='https://wa.me/919841916899' target='_blank'>WhatsApp</a> for orders!" },
  { keys: ["address", "location", "map", "where", "place"], reply: "📍 <b>SRK CRACKERS SHOP</b><br>No 45, Sarathi Nagar<br>Morai Village, Avadi<br>Chennai - 600055, TN<br><a href='#map'>View on Map →</a>" },
  { keys: ["offer", "discount", "80", "diwali", "sale"], reply: "🎇 <b>Diwali Special — Flat 80% OFF</b> on all crackers! Premium Sivakasi quality at wholesale rates. Minimum order applies." },
  { keys: ["min", "minimum", "order amount"], reply: "💰 <b>Minimum Order:</b><br>• Tamil Nadu &amp; PY: <b>₹3000</b><br>• Other States: <b>₹5000</b><br>Transport charges paid by customer." },
  { keys: ["delivery", "ship", "transport", "courier"], reply: "🚚 We deliver across Tamil Nadu &amp; India via registered transport. Parcel sent to nearest hub. Call <b>98419 16899</b> for delivery details." },
  { keys: ["license", "licence", "legal", "govt"], reply: "🏛️ <b>Licensed Dealer</b> — SRK CRACKERS SHOP<br>Licence No 10439/FL/NMSB/2026<br>Morai, Avadi, Chennai<br><a href='#about'>View licence info →</a>" },
  { keys: ["time", "hour", "open", "close", "timing"], reply: "🕐 Shop timing: <b>9:00 AM – 9:00 PM</b><br>Open all days during Diwali season." },
  { keys: ["whatsapp", "wa"], reply: "💬 After placing order, share payment screenshot on <a href='https://wa.me/919841916899' target='_blank'>WhatsApp</a>. Track order at <a href='#track'>Track Order</a> section!" },
  { keys: ["track", "tracking", "status", "order id"], reply: "📋 Track your order at <a href='#track'>Track Order</a> section. Enter your <b>Order ID</b> and registered mobile number." },
  { keys: ["pay", "payment", "gpay", "upi", "qr"], reply: "💳 Pay via <b>Google Pay / UPI</b> after filling order details. Scan the QR code shown · upload payment screenshot · we verify within 2 hours." },
  { keys: ["apk", "app", "download"], reply: "📲 Download our demo app — click <b>Download APK</b> button in the header or hero section!" },
  { keys: ["thank", "thanks"], reply: "🙏 Thank you for choosing SRK Crackers! Happy Diwali! 🎆" },
  { keys: ["bye", "goodbye"], reply: "Goodbye! 👋 Call <b>98419 16899</b> anytime. Happy celebrations! 🎇" },
];

export function getBotReply(message: string): string {
  const lower = message.toLowerCase();
  for (const item of CHAT_REPLIES) {
    if (item.keys.some((key) => lower.includes(key))) return item.reply;
  }
  return CHAT_FALLBACK;
}
