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
  upiId: "srkcrackers@okaxis",
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
  minOrderTN: 3000,
  minOrderOther: 5000,
  apkUrl:
    "https://github.com/appium/appium/raw/master/packages/appium/sample-code/apps/ApiDemos-debug.apk",
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
