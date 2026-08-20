"use server";

import { signIn, signOut } from "@/lib/auth";

export async function sendMagicLink(formData: FormData) {
  const email = formData.get("email");
  if (typeof email !== "string" || !email.trim()) return;

  await signIn("nodemailer", { email: email.trim(), redirectTo: "/" });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}
