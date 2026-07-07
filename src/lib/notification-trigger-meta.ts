export type EmailPreviewTrigger =
  | "ORDER_PLACED_CUSTOMER"
  | "STATUS_CHANGE_CUSTOMER"
  | "DELIVERED_CUSTOMER"
  | "ORDER_PLACED_ADMIN"
  | "STATUS_CHANGE_ADMIN"
  | "PENDING_REMINDER_ADMIN"
  | "DB_BACKUP"
  | "TEST";

export interface NotificationTriggerMeta {
  formKey:
    | "notifyCustomerOrderPlaced"
    | "notifyCustomerStatusChange"
    | "notifyCustomerDelivered"
    | "notifyAdminNewOrder"
    | "notifyAdminStatusChange"
    | "notifyAdminPendingReminder";
  previewTrigger: EmailPreviewTrigger;
  label: string;
  description: string;
  audience: "Customer" | "Admin";
  timing: string;
  icon: string;
}

export const NOTIFICATION_TRIGGER_META: NotificationTriggerMeta[] = [
  {
    formKey: "notifyCustomerOrderPlaced",
    previewTrigger: "ORDER_PLACED_CUSTOMER",
    label: "Customer — order placed",
    description: "Branded confirmation with order summary and full invoice",
    audience: "Customer",
    timing: "Instant — when customer finalizes order (email required)",
    icon: "📧",
  },
  {
    formKey: "notifyCustomerStatusChange",
    previewTrigger: "STATUS_CHANGE_CUSTOMER",
    label: "Customer — status updates",
    description: "Notifies when order moves to Confirmed, Processing, or Dispatched",
    audience: "Customer",
    timing: "Instant — on each admin status change",
    icon: "🔄",
  },
  {
    formKey: "notifyCustomerDelivered",
    previewTrigger: "DELIVERED_CUSTOMER",
    label: "Customer — delivered",
    description: "Delivery confirmation with optional admin note",
    audience: "Customer",
    timing: "Instant — when order is marked delivered",
    icon: "✅",
  },
  {
    formKey: "notifyAdminNewOrder",
    previewTrigger: "ORDER_PLACED_ADMIN",
    label: "Admin — new order alert",
    description: "Urgent alert with customer details and link to admin order page",
    audience: "Admin",
    timing: "Instant — same time as customer order",
    icon: "🔔",
  },
  {
    formKey: "notifyAdminStatusChange",
    previewTrigger: "STATUS_CHANGE_ADMIN",
    label: "Admin — status change alert",
    description: "Optional copy of status updates sent to admin inbox",
    audience: "Admin",
    timing: "Instant — on every status change (off by default)",
    icon: "📋",
  },
  {
    formKey: "notifyAdminPendingReminder",
    previewTrigger: "PENDING_REMINDER_ADMIN",
    label: "Admin — pending order reminder",
    description: "Table of orders stuck in Placed / Verifying awaiting your action",
    audience: "Admin",
    timing: "Repeating — every N hours via in-app scheduler",
    icon: "⏰",
  },
];
