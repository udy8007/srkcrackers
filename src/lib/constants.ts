import type { OrderStatus } from "@prisma/client";

/** Central business configuration for SRK Crackers. */
export const BUSINESS = {
  name: "SRK Crackers",
  tagline: "Licensed Fireworks Dealer",
  phone: "9841916899",
  phoneDisplay: "98419 16899",
  whatsapp: "919841916899",
  email: "srkcrackers@gmail.com",
  upiId: "srkcrackers@okaxis",
  addressLine: "Survey No 280/79, Door No 45, Mogai Village, Avadi Taluk, Tiruvallur District",
  city: "Avadi",
  district: "Tiruvallur",
  state: "Tamil Nadu",
  hours: "9:00 AM – 9:00 PM",
  mapQuery: "Avadi, Tiruvallur District, Tamil Nadu, India",
  mapEmbed:
    "https://maps.google.com/maps?q=Avadi,+Tiruvallur+District,+Tamil+Nadu,+India&ll=13.1067,80.1015&z=14&hl=en&output=embed",
  minOrderTN: 3000,
  minOrderOther: 5000,
  apkUrl:
    "https://github.com/appium/appium/raw/master/packages/appium/sample-code/apps/ApiDemos-debug.apk",
} as const;

export const LICENSE_INFO = {
  name: "SRK CRACKERS",
  surveyNo: "280/79",
  doorNo: "45",
  licenceNo: "—",
  village: "MOGAI",
  taluk: "AVADI",
  district: "TIRUVALLUR",
  validUpTo: "—",
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
