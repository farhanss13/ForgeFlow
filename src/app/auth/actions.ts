"use server";

import { createClient } from "@/utils/supabase/server";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function login(currentState: { error: string | null; success: string | null } | null, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const redirectTo = (formData.get("redirectTo") as string) || "/dashboard";

  if (!email || !password) {
    return { error: "Email and password are required.", success: null };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message, success: null };
  }

  revalidatePath("/", "layout");
  redirect(redirectTo);
}

export async function signup(currentState: { error: string | null; success: string | null } | null, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;

  if (!email || !password || !fullName) {
    return { error: "All fields are required.", success: null };
  }

  const supabase = await createClient();

  // Create user in Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    return { error: error.message, success: null };
  }

  if (!data.user) {
    return { error: "Signup failed. Please try again.", success: null };
  }

  // Create the Profile in the database using Prisma
  try {
    await prisma.profile.create({
      data: {
        id: data.user.id,
        email: email,
        fullName: fullName,
      },
    });
  } catch (dbError) {
    console.error("Database Profile creation failed:", dbError);
    if (
      dbError &&
      typeof dbError === "object" &&
      "code" in dbError &&
      (dbError as { code: string }).code !== "P2002"
    ) {
      return { error: "Account created but failed to initialize profile. Please contact support.", success: null };
    }
  }

  revalidatePath("/", "layout");
  
  if (data.session) {
    redirect("/dashboard");
  } else {
    return { 
      error: null, 
      success: "Registration successful! Please check your email to verify your account or log in directly if automatic confirmation is enabled." 
    };
  }
}

export async function logout() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/", "layout");
  redirect("/login");
}
