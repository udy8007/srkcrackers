import type { OrderStatus } from "@prisma/client";

/** Central business configuration for SRK Crackers. */
export const BUSINESS = {
  name: "SRK Crackers",
  tagline: "Licensed Fireworks Dealer",
  url: "https://www.srkcrackers.in",
  phone: "9841916899",
  phoneDisplay: "98419 16899",
  whatsapp: "919841916899",
  email: "srkcrackers@gmail.com",
  gstin: "33BJBPR5461B2ZI",
  upiId: "selvianu2107@okhdfcbank",
  addressLine: "No 45, Sarathi Nagar, Morai Village, Avadi, Chennai - 600055",
  street: "No 45, Sarathi Nagar, Morai Village",
  city: "Avadi",
  district: "Chennai",
  state: "Tamil Nadu",
  postalCode: "600055",
  country: "IN",
  lat: 13.1987642,
  lng: 80.0896457,
  hours: "9:00 AM – 9:00 PM",
  mapQuery: "Sarathi Nagar, Morai Village, Avadi, Chennai 600055, Tamil Nadu",
  mapEmbed:
    "https://maps.google.com/maps?q=13.1987642,80.0896457&z=16&hl=en&output=embed",
  minOrderAmount: 1250,
  shippingCost: 200,
  deliveryArea: "Chennai",
  yearsExperience: 10,
  /** Default days from dispatch until expected postal delivery. */
  defaultDeliveryDays: 3,
  apkUrl: "/srk-crackers.apk",
} as const;

export const LICENSE_INFO = {
  name: "SRK CRACKERS SHOP",
  licenceNo: "10439/FL/NMSB/2026",
  doorNo: "45",
  nagar: "SARATHI NAGAR",
  village: "MORAI",
  taluk: "AVADI",
  district: "CHENNAI",
  pincode: "600055",
  issuedOn: "19 Jun 2026",
  validUpTo: "18 Jun 2029",
  capacity: "100 KGS OF FIREWORKS",
  working: "500 KGS OF CELLULOID / NITRATION",
} as const;

export interface OrderStatusMeta {
  key: OrderStatus;
  label: string;
  /** Whether this status is part of the customer-facing progress timeline. */
  timeline: boolean;
}

/** Ordered list of order statuses (drives timeline + admin dropdown). */
export const ORDER_STATUSES: OrderStatusMeta[] = [
  { key: "PAYMENT_PENDING", label: "Payment Not Completed", timeline: false },
  { key: "PLACED", label: "Order Placed", timeline: true },
  { key: "PAYMENT_UPLOADED", label: "Payment Screenshot Received", timeline: true },
  { key: "VERIFYING", label: "Payment Verification", timeline: true },
  { key: "CONFIRMED", label: "Order Confirmed", timeline: true },
  { key: "PROCESSING", label: "Processing & Packing", timeline: true },
  { key: "DISPATCHED", label: "Dispatched", timeline: true },
  { key: "DELIVERED", label: "Delivered", timeline: true },
  { key: "CANCELLED", label: "Cancelled", timeline: false },
];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = ORDER_STATUSES.reduce(
  (acc, status) => {
    acc[status.key] = status.label;
    return acc;
  },
  {} as Record<OrderStatus, string>,
);

export const INDIAN_STATES = [
  "Tamil Nadu",
  "Puducherry",
  "Andhra Pradesh",
  "Karnataka",
  "Kerala",
  "Other",
] as const;

export interface CustomerFeedbackItem {
  name: string;
  location: string;
  rating: number;
  text: string;
  date: string;
}

/** Customer testimonials shown on the storefront. */
export const CUSTOMER_FEEDBACK: CustomerFeedbackItem[] = [
  {
    name: "Udhaya Kumar",
    location: "Avadi, Chennai",
    rating: 5,
    text: "Ordered for Diwali — excellent Sivakasi quality and very fair pricing. Team confirmed within an hour and delivery was on time.",
    date: "Nov 2025",
  },
  {
    name: "Anu",
    location: "Poonamallee",
    rating: 5,
    text: "Best crackers shop near Morai. We could buy single items without forced boxes. GPay payment and WhatsApp order was very easy.",
    date: "Oct 2025",
  },
  {
    name: "Murugan V.",
    location: "Ambattur, Chennai",
    rating: 5,
    text: "10 years trusted dealer — genuine licensed shop. Bulk order for our apartment celebration was packed safely and rates were wholesale level.",
    date: "Sep 2025",
  },
  {
    name: "Deepa K.",
    location: "Thiruvallur",
    rating: 5,
    text: "Kids loved the sparklers and flower pots. Good variety, clear price list PDF, and friendly phone support. Will order again this Diwali.",
    date: "Aug 2025",
  },
  {
    name: "Arun J.",
    location: "Velachery, Chennai",
    rating: 5,
    text: "Sent order to my hometown — dispatch was quick and every item matched the estimate. Highly recommend SRK Crackers for online enquiry orders.",
    date: "Jul 2025",
  },
  {
    name: "Selvam P.",
    location: "Red Hills",
    rating: 5,
    text: "Licensed dealer with proper GST invoice. Payment verification was smooth and they called to confirm delivery date. Very professional service.",
    date: "Jun 2025",
  },
];
