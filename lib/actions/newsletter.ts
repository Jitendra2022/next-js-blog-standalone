"use server";

import { connectToDatabase } from "@/lib/db/mongodb";
import { Newsletter } from "@/models/Newsletter";
import { z } from "zod";

const emailSchema = z.string().trim().email("Please provide a valid email address");

export async function subscribeNewsletterAction(email: string) {
  try {
    const validated = emailSchema.safeParse(email);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    await connectToDatabase();

    const existing = await Newsletter.findOne({ email: validated.data.toLowerCase() });
    if (existing) {
      return { success: true, message: "You're already subscribed! Thank you for your support." };
    }

    await Newsletter.create({
      email: validated.data.toLowerCase(),
    });

    return {
      success: true,
      message: "Thank you for subscribing! You will receive our latest engineering insights.",
    };
  } catch (error: unknown) {
    console.error("Newsletter subscription error:", error);
    const msg = error instanceof Error ? error.message : "Failed to subscribe.";
    return { success: false, error: msg };
  }
}
