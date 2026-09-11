export type EmailPreviewTrigger =
  | "ORDER_PLACED_CUSTOMER"
  | "STATUS_CHANGE_CUSTOMER"
  | "DELIVERED_CUSTOMER"
  | "ORDER_PLACED_ADMIN"
  | "STATUS_CHANGE_ADMIN"
  | "PENDING_REMINDER_ADMIN"
  | "ENQUIRY_PLACED_ADMIN"
  | "ENQUIRY_RESOLVED_CUSTOMER"
  | "ENQUIRY_PENDING_REMINDER_ADMIN"
  | "DB_BACKUP"
  | "TEST";

export interface NotificationTriggerMeta {
  formKey:
    | "notifyCustomerOrderPlaced"
    | "notifyCustomerStatusChange"
    | "notifyCustomerDelivered"
    | "notifyAdminNewOrder"
    | "notifyAdminStatusChange"
    | "notifyAdminPendingReminder"
    | "notifyAdminNewEnquiry"
    | "notifyCustomerEnquiryResolved"
    | "notifyAdminEnquiryPendingReminder";
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
    description:
      "Disabled: status emails go to the customer only. Admins see status changes in the dashboard.",
    audience: "Admin",
    timing: "In-app only — no email copy to admin",
    icon: "📋",
  },
  {
    formKey: "notifyAdminPendingReminder",
    previewTrigger: "PENDING_REMINDER_ADMIN",
    label: "Admin — pending order reminder",
    description:
      "Placed/Verifying email reminder, plus FCM push for incomplete checkouts (payment pending — please contact) with order deep link",
    audience: "Admin",
    timing: "Repeating — every N hours via in-app scheduler until resolved/cancelled",
    icon: "⏰",
  },
  {
    formKey: "notifyAdminNewEnquiry",
    previewTrigger: "ENQUIRY_PLACED_ADMIN",
    label: "Admin — new enquiry alert",
    description: "Urgent alert with customer details and link to admin enquiry page",
    audience: "Admin",
    timing: "Instant — when customer submits enquiry form",
    icon: "📩",
  },
  {
    formKey: "notifyCustomerEnquiryResolved",
    previewTrigger: "ENQUIRY_RESOLVED_CUSTOMER",
    label: "Customer — enquiry resolved",
    description: "Resolution confirmation with optional admin response note",
    audience: "Customer",
    timing: "Instant — when admin marks enquiry as resolved (email required)",
    icon: "✅",
  },
  {
    formKey: "notifyAdminEnquiryPendingReminder",
    previewTrigger: "ENQUIRY_PENDING_REMINDER_ADMIN",
    label: "Admin — pending enquiry reminder",
    description: "Email + FCM push for enquiries still pending after N hours",
    audience: "Admin",
    timing: "Repeating — every N hours via in-app scheduler until resolved",
    icon: "⏰",
  },
];
