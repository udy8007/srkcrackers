import "server-only";

import {
  buildAdminEnquiryPendingReminderEmail,
  buildAdminNewEnquiryEmail,
  buildAdminNewOrderEmail,
  buildAdminPendingReminderEmail,
  buildAdminStatusChangeEmail,
  buildCustomerEnquiryResolvedEmail,
  buildCustomerOrderConfirmationEmail,
  buildCustomerStatusChangeEmail,
  buildDatabaseBackupPreviewEmail,
  buildTestEmail,
  type EnquiryEmailContext,
} from "@/lib/email-templates";
import type { PrintInvoiceData } from "@/lib/print-invoice-html";
import type { OrderStatus } from "@/lib/db/types";
import { resolveSiteOrigin } from "@/lib/email-settings";
import type { OrderEmailContext } from "@/lib/email-templates";

export const EMAIL_PREVIEW_TRIGGERS = [
  "ORDER_PLACED_CUSTOMER",
  "STATUS_CHANGE_CUSTOMER",
  "DELIVERED_CUSTOMER",
  "ORDER_PLACED_ADMIN",
  "STATUS_CHANGE_ADMIN",
  "PENDING_REMINDER_ADMIN",
  "ENQUIRY_PLACED_ADMIN",
  "ENQUIRY_RESOLVED_CUSTOMER",
  "ENQUIRY_PENDING_REMINDER_ADMIN",
  "DB_BACKUP",
  "TEST",
] as const;

export type EmailPreviewTrigger = (typeof EMAIL_PREVIEW_TRIGGERS)[number];

function sampleContext(status: OrderStatus = "VERIFYING"): OrderEmailContext {
  const origin = resolveSiteOrigin();
  return {
    orderNumber: "SRK-20260707-0042",
    customerName: "Ravi Kumar",
    phone: "9841916899",
    email: "customer@example.com",
    status,
    subtotal: 2850,
    total: 3050,
    itemCount: 8,
    createdAt: new Date().toISOString(),
    adminOrderUrl: `${origin}/admin/orders/sample-order-id`,
    trackUrl: `${origin}/?track=SRK-20260707-0042&phone=9841916899`,
  };
}

function sampleEnquiryContext(origin: string): EnquiryEmailContext {
  return {
    enquiryNumber: "ENQ-20260911-A3F2",
    name: "Ravi Kumar",
    phone: "9841916899",
    email: "customer@example.com",
    message: "I need bulk pricing for gift boxes. Can you deliver to Ambattur?",
    status: "PENDING",
    createdAt: new Date().toISOString(),
    adminEnquiryUrl: `${origin}/admin/enquiries/sample-enquiry-id`,
  };
}

function sampleInvoice(origin: string): PrintInvoiceData {
  return {
    orderNumber: "SRK-20260707-0042",
    createdAt: new Date().toISOString(),
    status: "VERIFYING",
    customerName: "Ravi Kumar",
    phone: "9841916899",
    email: "customer@example.com",
    address: "12, Gandhi Nagar, Avadi",
    city: "Chennai",
    state: "Tamil Nadu",
    pincode: "600055",
    paymentMethod: "UPI",
    upiId: "9841916899-5@ybl",
    subtotal: 2850,
    shipping: 200,
    total: 3050,
    items: [
      { name: "28 Shots", pack: "1 Pc", price: 450, qty: 2, amount: 900 },
      { name: "4\" Lakshmi", pack: "1 Box", price: 650, qty: 3, amount: 1950 },
    ],
    origin,
  };
}

export function getEmailPreview(trigger: EmailPreviewTrigger): { subject: string; html: string } {
  const origin = resolveSiteOrigin();
  const ctx = sampleContext();

  switch (trigger) {
    case "ORDER_PLACED_CUSTOMER":
      return buildCustomerOrderConfirmationEmail(ctx, sampleInvoice(origin));
    case "STATUS_CHANGE_CUSTOMER":
      return buildCustomerStatusChangeEmail({
        ...sampleContext("CONFIRMED"),
        previousStatus: "VERIFYING",
        note: "Payment verified. Your order is confirmed!",
      });
    case "DELIVERED_CUSTOMER":
      return buildCustomerStatusChangeEmail({
        ...sampleContext("DELIVERED"),
        previousStatus: "DISPATCHED",
        note: "Your parcel has been delivered. Thank you for shopping with us!",
      });
    case "ORDER_PLACED_ADMIN":
      return buildAdminNewOrderEmail(ctx);
    case "STATUS_CHANGE_ADMIN":
      return buildAdminStatusChangeEmail({
        ...sampleContext("DISPATCHED"),
        previousStatus: "PROCESSING",
        note: "Handed to postal — expected delivery in 3 days",
      });
    case "PENDING_REMINDER_ADMIN":
      return buildAdminPendingReminderEmail(
        [
          ctx,
          {
            ...ctx,
            orderNumber: "SRK-20260706-0018",
            customerName: "Priya S.",
            status: "PLACED",
            total: 1420,
          },
        ],
        `${origin}/admin/orders`,
      );
    case "ENQUIRY_PLACED_ADMIN":
      return buildAdminNewEnquiryEmail(sampleEnquiryContext(origin));
    case "ENQUIRY_RESOLVED_CUSTOMER":
      return buildCustomerEnquiryResolvedEmail({
        ...sampleEnquiryContext(origin),
        status: "RESOLVED",
        adminNote: "We can deliver gift boxes to Ambattur. Please call us to confirm quantity.",
      });
    case "ENQUIRY_PENDING_REMINDER_ADMIN":
      return buildAdminEnquiryPendingReminderEmail(
        [
          sampleEnquiryContext(origin),
          {
            ...sampleEnquiryContext(origin),
            enquiryNumber: "ENQ-20260911-B7K1",
            name: "Priya S.",
          },
        ],
        `${origin}/admin/enquiries`,
      );
    case "DB_BACKUP":
      return buildDatabaseBackupPreviewEmail();
    case "TEST":
      return buildTestEmail();
    default:
      throw new Error(`Unknown preview trigger: ${trigger}`);
  }
}
