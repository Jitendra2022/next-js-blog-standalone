"use server";

import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { signToken, setSessionCookie, clearSessionCookie } from "@/lib/auth/session";
import { loginSchema, registerSchema, LoginInput, RegisterInput } from "@/lib/validations/auth";
import { seedDatabase } from "@/lib/db/seed";

export interface ActionResult<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

export async function loginAction(input: LoginInput): Promise<ActionResult> {
  try {
    const validated = loginSchema.safeParse(input);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    await connectToDatabase();

    // Auto-seed if database is empty to ensure demo admin exists
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      await seedDatabase();
    }

    const user = await User.findOne({ email: validated.data.email.toLowerCase() });
    if (!user || !user.password) {
      return { success: false, error: "Invalid email or password." };
    }

    const isMatch = await verifyPassword(validated.data.password, user.password);
    if (!isMatch) {
      return { success: false, error: "Invalid email or password." };
    }

    const token = await signToken({
      userId: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    });

    await setSessionCookie(token);

    return {
      success: true,
      data: {
        userId: user._id.toString(),
        name: user.name,
        role: user.role,
      },
    };
  } catch (error: unknown) {
    console.error("Login action error:", error);
    const msg = error instanceof Error ? error.message : "An unexpected error occurred.";
    return { success: false, error: msg };
  }
}

export async function registerAction(input: RegisterInput): Promise<ActionResult> {
  try {
    const validated = registerSchema.safeParse(input);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    await connectToDatabase();

    const existingUser = await User.findOne({ email: validated.data.email.toLowerCase() });
    if (existingUser) {
      return { success: false, error: "An account with this email already exists." };
    }

    // If first user, make admin, otherwise reader
    const totalUsers = await User.countDocuments();
    const role = totalUsers === 0 ? "admin" : "reader";

    const passwordHash = await hashPassword(validated.data.password);
    const newUser = await User.create({
      name: validated.data.name,
      email: validated.data.email.toLowerCase(),
      password: passwordHash,
      role,
    });

    const token = await signToken({
      userId: newUser._id.toString(),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      avatar: newUser.avatar,
    });

    await setSessionCookie(token);

    return {
      success: true,
      data: {
        userId: newUser._id.toString(),
        name: newUser.name,
        role: newUser.role,
      },
    };
  } catch (error: unknown) {
    console.error("Register action error:", error);
    const msg = error instanceof Error ? error.message : "Failed to register account.";
    return { success: false, error: msg };
  }
}

export async function logoutAction(): Promise<ActionResult> {
  try {
    await clearSessionCookie();
    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to logout";
    return { success: false, error: msg };
  }
}

export async function quickDemoLoginAction(targetRole: "admin" | "author"): Promise<ActionResult> {
  try {
    await connectToDatabase();

    // Ensure database is seeded
    await seedDatabase();

    const email = targetRole === "admin" ? "admin@blogapp.io" : "author@blogapp.io";
    const user = await User.findOne({ email });

    if (!user) {
      return { success: false, error: "Demo account not found. Try seeding first." };
    }

    const token = await signToken({
      userId: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    });

    await setSessionCookie(token);

    return {
      success: true,
      data: {
        userId: user._id.toString(),
        name: user.name,
        role: user.role,
      },
    };
  } catch (error: unknown) {
    console.error("Quick demo login error:", error);
    const msg = error instanceof Error ? error.message : "Demo login failed.";
    return { success: false, error: msg };
  }
}
