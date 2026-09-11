import { isValidPhone } from "@/lib/utils";
import type { CreateEnquiryInput } from "@/types";

export interface ValidatedEnquiryInput {
  name: string;
  phone: string;
  email: string | null;
  message: string;
}

export function validateEnquiryInput(input: CreateEnquiryInput): {
  ok: true;
  data: ValidatedEnquiryInput;
} | {
  ok: false;
  error: string;
} {
  const name = input.name?.trim() ?? "";
  const phone = input.phone?.trim().replace(/\D/g, "") ?? "";
  const email = input.email?.trim() ?? "";
  const message = input.message?.trim() ?? "";

  if (name.length < 2) {
    return { ok: false, error: "Please enter your name." };
  }
  if (!isValidPhone(phone)) {
    return { ok: false, error: "Please enter a valid 10-digit mobile number." };
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  if (message.length < 10) {
    return { ok: false, error: "Please enter your enquiry (at least 10 characters)." };
  }
  if (message.length > 2000) {
    return { ok: false, error: "Enquiry message is too long (max 2000 characters)." };
  }

  return {
    ok: true,
    data: {
      name,
      phone,
      email: email || null,
      message,
    },
  };
}
