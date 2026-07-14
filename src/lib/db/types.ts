/** Shared domain types for Firestore-backed data layer (replaces Prisma enums/models). */

export type OrderStatus =
  | "PAYMENT_PENDING"
  | "PLACED"
  | "PAYMENT_UPLOADED"
  | "VERIFYING"
  | "CONFIRMED"
  | "PROCESSING"
  | "DISPATCHED"
  | "DELIVERED"
  | "CANCELLED";

export type UserRole = "ADMIN" | "STAFF";

export type BackupFrequency = "DAILY" | "MONTHLY" | "YEARLY";

export type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
};

export type Category = {
  id: string;
  key: string;
  label: string;
  sortOrder: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  pack: string;
  price: number;
  mrp: number;
  imageUrl: string;
  description: string;
  active: boolean;
  sortOrder: number;
  categoryId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  altPhone: string | null;
  email: string | null;
  address: string;
  city: string;
  state: string;
  pincode: string;
  notes: string | null;
  paymentMethod: string;
  upiId: string | null;
  paymentScreenshot: string | null;
  subtotal: number;
  total: number;
  /** Shipping stored when available; optional for older docs. */
  shipping?: number;
  status: OrderStatus;
  expectedDeliveryAt: Date | null;
  lastPendingReminderAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type OrderItem = {
  id: string;
  orderId: string;
  productId: string | null;
  name: string;
  pack: string;
  price: number;
  qty: number;
  amount: number;
};

export type OrderStatusHistory = {
  id: string;
  orderId: string;
  status: OrderStatus;
  label: string;
  note: string | null;
  createdAt: Date;
};

export type SiteVisit = {
  id: string;
  path: string;
  city: string | null;
  region: string | null;
  country: string | null;
  userAgent: string | null;
  createdAt: Date;
};

export type EmailSettings = {
  id: string;
  enabled: boolean;
  host: string;
  port: number;
  enableSsl: boolean;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
  adminNotifyEmail: string;
  notifyCustomerOrderPlaced: boolean;
  notifyCustomerStatusChange: boolean;
  notifyCustomerDelivered: boolean;
  notifyAdminNewOrder: boolean;
  notifyAdminStatusChange: boolean;
  notifyAdminPendingReminder: boolean;
  pendingReminderHours: number;
  createdAt: Date;
  updatedAt: Date;
};

export type EmailLog = {
  id: string;
  orderId: string | null;
  trigger: string;
  recipient: string;
  subject: string;
  status: string;
  error: string | null;
  createdAt: Date;
};

export type AdminNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  orderId: string | null;
  orderNumber: string | null;
  read: boolean;
  createdAt: Date;
};

export type BackupSettings = {
  id: string;
  enabled: boolean;
  frequency: BackupFrequency;
  recipientEmail: string;
  runHour: number;
  runDayOfMonth: number;
  runMonth: number;
  runDayOfYear: number;
  includeScreenshots: boolean;
  lastBackupAt: Date | null;
  lastBackupStatus: string | null;
  lastBackupError: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type DbBackupLog = {
  id: string;
  filename: string;
  sizeBytes: number;
  tableCounts: string | null;
  status: string;
  trigger: string;
  recipient: string;
  error: string | null;
  createdAt: Date;
};

export type SchedulerState = {
  id: string;
  enabled: boolean;
  tickIntervalMinutes: number;
  lastTickAt: Date | null;
  lastDeliverAt: Date | null;
  lastReminderAt: Date | null;
  updatedAt: Date;
};

export type AdminDeviceToken = {
  id: string;
  token: string;
  platform: string;
  adminUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type FirebaseSettings = {
  id: string;
  serviceAccountJson: string;
  projectId: string;
  clientEmail: string;
  createdAt: Date;
  updatedAt: Date;
};

export type CategoryWithProducts = Category & { products: Product[] };
export type OrderWithItems = Order & {
  items: OrderItem[];
  statusHistory: OrderStatusHistory[];
};
