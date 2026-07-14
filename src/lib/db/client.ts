import type { DocumentData, Firestore } from "firebase-admin/firestore";
import { createCollection, requireDate, toDate } from "./firestore-collection";
import type {
  AdminDeviceToken,
  AdminNotification,
  AdminUser,
  BackupSettings,
  Category,
  DbBackupLog,
  EmailLog,
  EmailSettings,
  FirebaseSettings,
  Order,
  OrderItem,
  OrderStatus,
  OrderStatusHistory,
  Product,
  SchedulerState,
  SiteVisit,
} from "./types";

function hydrateAdminUser(id: string, data: DocumentData): AdminUser {
  return {
    id,
    email: String(data.email ?? ""),
    name: (data.name as string | null) ?? null,
    passwordHash: String(data.passwordHash ?? ""),
    role: (data.role as AdminUser["role"]) ?? "ADMIN",
    createdAt: requireDate(data.createdAt),
    updatedAt: requireDate(data.updatedAt),
  };
}

function hydrateCategory(id: string, data: DocumentData): Category {
  return {
    id,
    key: String(data.key ?? ""),
    label: String(data.label ?? ""),
    sortOrder: Number(data.sortOrder ?? 0),
    active: data.active !== false,
    createdAt: requireDate(data.createdAt),
    updatedAt: requireDate(data.updatedAt),
  };
}

function hydrateProduct(id: string, data: DocumentData): Product {
  return {
    id,
    name: String(data.name ?? ""),
    slug: String(data.slug ?? ""),
    pack: String(data.pack ?? ""),
    price: Number(data.price ?? 0),
    mrp: Number(data.mrp ?? 0),
    imageUrl: String(data.imageUrl ?? "/products/default.svg"),
    description: String(data.description ?? ""),
    active: data.active !== false,
    sortOrder: Number(data.sortOrder ?? 0),
    categoryId: String(data.categoryId ?? ""),
    createdAt: requireDate(data.createdAt),
    updatedAt: requireDate(data.updatedAt),
  };
}

function hydrateOrder(id: string, data: DocumentData): Order {
  return {
    id,
    orderNumber: String(data.orderNumber ?? ""),
    customerName: String(data.customerName ?? ""),
    phone: String(data.phone ?? ""),
    altPhone: (data.altPhone as string | null) ?? null,
    email: (data.email as string | null) ?? null,
    address: String(data.address ?? ""),
    city: String(data.city ?? ""),
    state: String(data.state ?? ""),
    pincode: String(data.pincode ?? ""),
    notes: (data.notes as string | null) ?? null,
    paymentMethod: String(data.paymentMethod ?? "UPI"),
    upiId: (data.upiId as string | null) ?? null,
    paymentScreenshot: (data.paymentScreenshot as string | null) ?? null,
    subtotal: Number(data.subtotal ?? 0),
    total: Number(data.total ?? 0),
    shipping: data.shipping != null ? Number(data.shipping) : undefined,
    status: (data.status as OrderStatus) ?? "VERIFYING",
    expectedDeliveryAt: toDate(data.expectedDeliveryAt),
    lastPendingReminderAt: toDate(data.lastPendingReminderAt),
    createdAt: requireDate(data.createdAt),
    updatedAt: requireDate(data.updatedAt),
  };
}

function hydrateOrderItem(id: string, data: DocumentData): OrderItem {
  return {
    id,
    orderId: String(data.orderId ?? ""),
    productId: (data.productId as string | null) ?? null,
    name: String(data.name ?? ""),
    pack: String(data.pack ?? ""),
    price: Number(data.price ?? 0),
    qty: Number(data.qty ?? 0),
    amount: Number(data.amount ?? 0),
  };
}

function hydrateHistory(id: string, data: DocumentData): OrderStatusHistory {
  return {
    id,
    orderId: String(data.orderId ?? ""),
    status: data.status as OrderStatus,
    label: String(data.label ?? ""),
    note: (data.note as string | null) ?? null,
    createdAt: requireDate(data.createdAt),
  };
}

async function loadOrderRelations(
  row: Order,
  include: Record<string, unknown>,
  firestore: Firestore,
): Promise<Order & { items?: OrderItem[]; statusHistory?: OrderStatusHistory[] }> {
  const out: Order & { items?: OrderItem[]; statusHistory?: OrderStatusHistory[] } = {
    ...row,
  };
  if (include.items) {
    const snap = await firestore.collection("orderItems").where("orderId", "==", row.id).get();
    out.items = snap.docs.map((d) => hydrateOrderItem(d.id, d.data()));
  }
  if (include.statusHistory) {
    const snap = await firestore
      .collection("orderStatusHistory")
      .where("orderId", "==", row.id)
      .get();
    out.statusHistory = snap.docs
      .map((d) => hydrateHistory(d.id, d.data()))
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
  return out;
}

async function loadCategoryProducts(
  row: Category,
  include: Record<string, unknown>,
  _firestore: Firestore,
): Promise<Category & { products?: Product[] }> {
  if (!include.products) return row;
  const productWhere =
    typeof include.products === "object" &&
    include.products &&
    "where" in (include.products as object)
      ? ((include.products as { where?: { active?: boolean } }).where ?? {})
      : {};
  const products = await productDelegate.findMany({
    where: { categoryId: row.id, ...productWhere },
    orderBy:
      typeof include.products === "object" &&
      include.products &&
      "orderBy" in (include.products as object)
        ? ((include.products as { orderBy?: { sortOrder: "asc" } }).orderBy ?? {
            sortOrder: "asc",
          })
        : { sortOrder: "asc" },
  });
  return { ...row, products };
}

const productDelegate = createCollection<Product>("products", hydrateProduct, {
  uniqueFields: ["slug"],
});

const categoryDelegate = createCollection<Category>("categories", hydrateCategory, {
  uniqueFields: ["key"],
  include: loadCategoryProducts,
});

const orderDelegate = createCollection<Order>("orders", hydrateOrder, {
  uniqueFields: ["orderNumber"],
  include: loadOrderRelations as never,
  dateFields: [
    "createdAt",
    "updatedAt",
    "expectedDeliveryAt",
    "lastPendingReminderAt",
  ],
});

export type FirestoreDb = {
  $transaction: {
    <T>(fn: (tx: FirestoreDb) => Promise<T>): Promise<T>;
    <T>(ops: Promise<T>[]): Promise<T[]>;
  };
  adminUser: ReturnType<typeof createCollection<AdminUser>>;
  category: typeof categoryDelegate;
  product: typeof productDelegate;
  order: typeof orderDelegate;
  orderItem: ReturnType<typeof createCollection<OrderItem>>;
  orderStatusHistory: ReturnType<typeof createCollection<OrderStatusHistory>>;
  siteVisit: ReturnType<typeof createCollection<SiteVisit>>;
  emailSettings: ReturnType<typeof createCollection<EmailSettings>>;
  emailLog: ReturnType<typeof createCollection<EmailLog>>;
  adminNotification: ReturnType<typeof createCollection<AdminNotification>>;
  backupSettings: ReturnType<typeof createCollection<BackupSettings>>;
  dbBackupLog: ReturnType<typeof createCollection<DbBackupLog>>;
  schedulerState: ReturnType<typeof createCollection<SchedulerState>>;
  adminDeviceToken: ReturnType<typeof createCollection<AdminDeviceToken>>;
  firebaseSettings: ReturnType<typeof createCollection<FirebaseSettings>>;
};

export const firestoreDb: FirestoreDb = {
  async $transaction<T>(
    arg: ((tx: FirestoreDb) => Promise<T>) | Promise<T>[],
  ): Promise<T | T[]> {
    if (Array.isArray(arg)) return Promise.all(arg);
    return arg(firestoreDb);
  },
  adminUser: createCollection<AdminUser>("adminUsers", hydrateAdminUser, {
    uniqueFields: ["email"],
  }),
  category: categoryDelegate,
  product: productDelegate,
  order: orderDelegate,
  orderItem: createCollection<OrderItem>("orderItems", hydrateOrderItem, {
    dateFields: [],
  }),
  orderStatusHistory: createCollection<OrderStatusHistory>(
    "orderStatusHistory",
    hydrateHistory,
    { dateFields: ["createdAt"] },
  ),
  siteVisit: createCollection<SiteVisit>("siteVisits", (id, data) => ({
    id,
    path: String(data.path ?? "/"),
    city: (data.city as string | null) ?? null,
    region: (data.region as string | null) ?? null,
    country: (data.country as string | null) ?? null,
    userAgent: (data.userAgent as string | null) ?? null,
    createdAt: requireDate(data.createdAt),
  }), { dateFields: ["createdAt"] }),
  emailSettings: createCollection<EmailSettings>("emailSettings", (id, data) => ({
    id,
    enabled: Boolean(data.enabled),
    host: String(data.host ?? ""),
    port: Number(data.port ?? 465),
    enableSsl: data.enableSsl !== false,
    username: String(data.username ?? ""),
    password: String(data.password ?? ""),
    fromEmail: String(data.fromEmail ?? ""),
    fromName: String(data.fromName ?? "SRK Crackers"),
    adminNotifyEmail: String(data.adminNotifyEmail ?? ""),
    notifyCustomerOrderPlaced: data.notifyCustomerOrderPlaced !== false,
    notifyCustomerStatusChange: data.notifyCustomerStatusChange !== false,
    notifyCustomerDelivered: data.notifyCustomerDelivered !== false,
    notifyAdminNewOrder: data.notifyAdminNewOrder !== false,
    notifyAdminStatusChange: Boolean(data.notifyAdminStatusChange),
    notifyAdminPendingReminder: data.notifyAdminPendingReminder !== false,
    pendingReminderHours: Number(data.pendingReminderHours ?? 2),
    createdAt: requireDate(data.createdAt),
    updatedAt: requireDate(data.updatedAt),
  })),
  emailLog: createCollection<EmailLog>("emailLogs", (id, data) => ({
    id,
    orderId: (data.orderId as string | null) ?? null,
    trigger: String(data.trigger ?? ""),
    recipient: String(data.recipient ?? ""),
    subject: String(data.subject ?? ""),
    status: String(data.status ?? ""),
    error: (data.error as string | null) ?? null,
    createdAt: requireDate(data.createdAt),
  }), { dateFields: ["createdAt"] }),
  adminNotification: createCollection<AdminNotification>(
    "adminNotifications",
    (id, data) => ({
      id,
      type: String(data.type ?? ""),
      title: String(data.title ?? ""),
      message: String(data.message ?? ""),
      orderId: (data.orderId as string | null) ?? null,
      orderNumber: (data.orderNumber as string | null) ?? null,
      read: Boolean(data.read),
      createdAt: requireDate(data.createdAt),
    }),
    { dateFields: ["createdAt"] },
  ),
  backupSettings: createCollection<BackupSettings>("backupSettings", (id, data) => ({
    id,
    enabled: Boolean(data.enabled),
    frequency: (data.frequency as BackupSettings["frequency"]) ?? "DAILY",
    recipientEmail: String(data.recipientEmail ?? ""),
    runHour: Number(data.runHour ?? 2),
    runDayOfMonth: Number(data.runDayOfMonth ?? 1),
    runMonth: Number(data.runMonth ?? 1),
    runDayOfYear: Number(data.runDayOfYear ?? 1),
    includeScreenshots: Boolean(data.includeScreenshots),
    lastBackupAt: toDate(data.lastBackupAt),
    lastBackupStatus: (data.lastBackupStatus as string | null) ?? null,
    lastBackupError: (data.lastBackupError as string | null) ?? null,
    createdAt: requireDate(data.createdAt),
    updatedAt: requireDate(data.updatedAt),
  })),
  dbBackupLog: createCollection<DbBackupLog>("dbBackupLogs", (id, data) => ({
    id,
    filename: String(data.filename ?? ""),
    sizeBytes: Number(data.sizeBytes ?? 0),
    tableCounts: (data.tableCounts as string | null) ?? null,
    status: String(data.status ?? ""),
    trigger: String(data.trigger ?? ""),
    recipient: String(data.recipient ?? ""),
    error: (data.error as string | null) ?? null,
    createdAt: requireDate(data.createdAt),
  }), { dateFields: ["createdAt"] }),
  schedulerState: createCollection<SchedulerState>("schedulerState", (id, data) => ({
    id,
    enabled: data.enabled !== false,
    tickIntervalMinutes: Number(data.tickIntervalMinutes ?? 30),
    lastTickAt: toDate(data.lastTickAt),
    lastDeliverAt: toDate(data.lastDeliverAt),
    lastReminderAt: toDate(data.lastReminderAt),
    updatedAt: requireDate(data.updatedAt),
  }), { dateFields: ["updatedAt", "lastTickAt", "lastDeliverAt", "lastReminderAt"] }),
  adminDeviceToken: createCollection<AdminDeviceToken>(
    "adminDeviceTokens",
    (id, data) => ({
      id,
      token: String(data.token ?? ""),
      platform: String(data.platform ?? "android"),
      adminUserId: (data.adminUserId as string | null) ?? null,
      createdAt: requireDate(data.createdAt),
      updatedAt: requireDate(data.updatedAt),
    }),
    { uniqueFields: ["token"] },
  ),
  firebaseSettings: createCollection<FirebaseSettings>(
    "firebaseSettings",
    (id, data) => ({
      id,
      serviceAccountJson: String(data.serviceAccountJson ?? ""),
      projectId: String(data.projectId ?? ""),
      clientEmail: String(data.clientEmail ?? ""),
      createdAt: requireDate(data.createdAt),
      updatedAt: requireDate(data.updatedAt),
    }),
  ),
};
