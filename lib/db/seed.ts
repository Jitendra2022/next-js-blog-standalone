import { connectToDatabase } from "./mongodb";
import { User } from "@/models/User";
import { Category } from "@/models/Category";
import { Post } from "@/models/Post";
import { Comment } from "@/models/Comment";
import { hashPassword } from "@/lib/auth/password";
import { estimateReadingTime } from "@/lib/utils";

export async function seedDatabase() {
  await connectToDatabase();

  // 1. Seed Demo Users
  let adminUser = await User.findOne({ email: "admin@blogapp.io" });
  if (!adminUser) {
    const adminPasswordHash = await hashPassword("Admin@12345");
    adminUser = await User.create({
      name: "Alex Vance",
      email: "admin@blogapp.io",
      password: adminPasswordHash,
      role: "admin",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
      bio: "Lead Software Architect & Tech Writer specializing in scalable Next.js systems, distributed cloud computing, and developer experience.",
      socialLinks: {
        twitter: "https://twitter.com/alexvance",
        github: "https://github.com",
        linkedin: "https://linkedin.com",
      },
    });
  }

  let authorUser = await User.findOne({ email: "author@blogapp.io" });
  if (!authorUser) {
    const authorPasswordHash = await hashPassword("Author@12345");
    authorUser = await User.create({
      name: "Sarah Chen",
      email: "author@blogapp.io",
      password: authorPasswordHash,
      role: "author",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80",
      bio: "Staff Frontend Engineer & UI/UX enthusiast. Passionate about design systems, React 19 server components, and clean code.",
      socialLinks: {
        twitter: "https://twitter.com/sarahchen",
        github: "https://github.com",
        website: "https://sarahchen.dev",
      },
    });
  }

  // 2. Seed Categories
  const categoriesData = [
    {
      name: "Next.js & React",
      slug: "nextjs-react",
      description: "Deep dives into React 19, Server Actions, App Router caching, and cutting-edge web performance.",
      color: "#6366f1",
    },
    {
      name: "Architecture & Cloud",
      slug: "architecture-cloud",
      description: "Scalable system design, microservices, AWS serverless deployments, and database optimization.",
      color: "#0ea5e9",
    },
    {
      name: "Full-Stack Dev",
      slug: "full-stack-dev",
      description: "End-to-end web development with TypeScript, Mongoose, PostgreSQL, and secure API patterns.",
      color: "#10b981",
    },
    {
      name: "AI & Machine Learning",
      slug: "ai-machine-learning",
      description: "Practical integrations of LLMs, agentic workflows, embeddings, and vector databases in modern apps.",
      color: "#8b5cf6",
    },
    {
      name: "Design Systems",
      slug: "design-systems",
      description: "Creating accessible, responsive, and delightful user interfaces with modern CSS and Tailwind.",
      color: "#ec4899",
    },
  ];

  const categoryMap = new Map();
  for (const cat of categoriesData) {
    let existing = await Category.findOne({ slug: cat.slug });
    if (!existing) {
      existing = await Category.create(cat);
    }
    categoryMap.set(cat.slug, existing);
  }

  // 3. Seed Comprehensive Sample Posts
  const existingPostCount = await Post.countDocuments();
  if (existingPostCount === 0) {
    const postsData = [
      {
        title: "Mastering Next.js App Router: Architectural Patterns for Enterprise Apps",
        slug: "mastering-nextjs-app-router-enterprise-patterns",
        excerpt:
          "Explore battle-tested architectural paradigms for large-scale Next.js App Router applications, focusing on data fetching boundaries, caching layers, and Server Actions.",
        content: `
## Introduction to Modern Full-Stack Architecture

Building modern web applications requires a shift in how we think about rendering, component colocation, and data flow. With **Next.js App Router** and **React Server Components (RSC)**, the boundary between client and server has been redefined into a unified mental model.

In this deep-dive guide, we explore how enterprise engineering teams can harness the full power of server-first paradigms without falling into common anti-patterns.

---

### Core Principles of RSC & Server Actions

Server Components execute exclusively on the server and never hydrate on the client. This offers three decisive advantages:

1. **Zero Client Bundle Overhead**: Dependencies imported inside server components never enter the browser bundle.
2. **Direct Data Layer Access**: Database queries with Mongoose or Prisma can be executed directly inside the component lifecycle without public API roundtrips.
3. **Automatic Security by Default**: Database connection strings, API tokens, and internal logic remain strictly protected inside the server boundary.

\`\`\`typescript
// Example: Direct Server Component Data Fetching
import { connectToDatabase } from "@/lib/db/mongodb";
import { Post } from "@/models/Post";

export async function PostList() {
  await connectToDatabase();
  const posts = await Post.find({ status: "published" })
    .sort({ publishedAt: -1 })
    .limit(10)
    .lean();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {posts.map((post) => (
        <article key={post._id.toString()} className="card p-6 border rounded-xl">
          <h2 className="text-xl font-bold">{post.title}</h2>
          <p className="text-muted-foreground mt-2">{post.excerpt}</p>
        </article>
      ))}
    </div>
  );
}
\`\`\`

---

### Streamlined Mutations with Server Actions

Gone are the days of setting up boilerplate REST endpoints for every single user form. Next.js **Server Actions** allow asynchronous functions defined on the server to be triggered seamlessly from forms or client component event handlers.

> **Key Insight**: Always validate your input using Zod schemas at the top of every Server Action to ensure robust validation and runtime type safety.

\`\`\`typescript
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

const schema = z.object({
  email: z.string().email(),
});

export async function subscribeNewsletter(formData: FormData) {
  const parsed = schema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { error: "Please enter a valid email address." };
  }

  // Persist to database
  await saveSubscriber(parsed.data.email);
  revalidatePath("/");

  return { success: true };
}
\`\`\`

---

### Summary Checklist for Production

- [x] Colocate data fetching directly with the consuming component.
- [x] Use \`revalidatePath\` and \`revalidateTag\` strategically to invalidate cached routes.
- [x] Validate all Server Action inputs with **Zod**.
- [x] Use \`Suspense\` boundaries for progressive streaming and fast Largest Contentful Paint (LCP).

Stay tuned for our next installment where we dissect advanced caching invalidation algorithms!
`,
        coverImage: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&auto=format&fit=crop&q=80",
        author: adminUser._id,
        category: categoryMap.get("nextjs-react")._id,
        tags: ["Next.js", "React 19", "Server Components", "TypeScript", "Performance"],
        status: "published",
        isFeatured: true,
        views: 1420,
        likes: 184,
        readingTime: 6,
        publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Building High-Throughput Cloud Storage with AWS S3 and Next.js Presigned URLs",
        slug: "high-throughput-cloud-storage-aws-s3-presigned-urls",
        excerpt:
          "Learn how to securely upload multi-gigabyte media assets straight from the browser to Amazon S3 buckets using presigned URLs and fine-grained IAM policies.",
        content: `
## Why Direct-to-S3 Uploads Matter

When building media-heavy web platforms, streaming files through your Next.js application server introduces unwanted network hops, CPU spikes, and memory buffering constraints.

By offloading the actual file transfer directly to **Amazon Web Services (AWS) Simple Storage Service (S3)** using **Presigned URLs**, your application servers only handle permission handshakes.

---

### Architecture Breakdown

1. **Client Request**: The browser requests a short-lived cryptographically signed upload URL from a Next.js Route Handler or Server Action.
2. **Server Generation**: The server verifies the user's authentication and permissions, then utilizes \`@aws-sdk/s3-request-presigner\` to generate a \`PutObjectCommand\` presigned URL valid for 5 minutes.
3. **Direct Binary Transfer**: The browser executes an HTTP \`PUT\` directly to the Amazon S3 endpoint with progress tracking.
4. **Metadata Persistence**: Once S3 acknowledges the upload with a \`200 OK\`, the client notifies the server to register the record in MongoDB.

\`\`\`typescript
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function generateUploadUrl(filename: string, fileType: string) {
  const key = \`uploads/\${Date.now()}-\${filename}\`;

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
    Key: key,
    ContentType: fileType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
  return { uploadUrl, key };
}
\`\`\`

---

### Handling Fallbacks for Local Development

When working in local development without AWS credentials, a resilient fallback storage mechanism saves developers hours of configuration headaches. By routing file writes to \`public/uploads\` when \`AWS_ACCESS_KEY_ID\` is absent, your entire team can run and test the app with zero external cloud dependencies.
`,
        coverImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80",
        author: adminUser._id,
        category: categoryMap.get("architecture-cloud")._id,
        tags: ["AWS S3", "Cloud", "Serverless", "Security", "DevOps"],
        status: "published",
        isFeatured: false,
        views: 940,
        likes: 122,
        readingTime: 5,
        publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        title: "The Evolution of Design Systems: From Atomic Components to Fluid Tokens",
        slug: "evolution-of-design-systems-fluid-tokens",
        excerpt:
          "How modern design tokens, CSS variables, and headless primitives like Radix and Tailwind v4 enable effortless multi-theme engineering.",
        content: `
## The Philosophy of Scalable Design

Modern product engineering demands that interfaces adapt fluidly across devices, operating system color schemes, and personalized user preferences.

Historically, design systems suffered from rigid component coupling. Today, headless UI primitives paired with semantic CSS custom properties give developers the speed of utility-first CSS without sacrificing accessibility.

### Semantic Tokens vs Hardcoded Values

Consider how colors should be named:
- ❌ \`bg-blue-600\` (Describes implementation, breaks when rebranding or switching themes)
- ✅ \`bg-primary\` (Describes semantic purpose, automatically shifts between dark and light modes)

\`\`\`css
/* Clean theme token architecture in modern CSS */
:root {
  --background: #fafafa;
  --foreground: #09090b;
  --primary: #4f46e5;
  --card: #ffffff;
}

.dark {
  --background: #09090b;
  --foreground: #f4f4f5;
  --primary: #6366f1;
  --card: #111114;
}
\`\`\`

> "A great design system does not restrict creativity; it eliminates mundane decisions so designers and engineers can focus on solving real user problems."

Try toggling the theme switch in the navigation bar above to see these fluid variables dynamically restyle this entire application!
`,
        coverImage: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200&auto=format&fit=crop&q=80",
        author: authorUser._id,
        category: categoryMap.get("design-systems")._id,
        tags: ["Design Systems", "UI/UX", "Tailwind CSS", "Accessibility"],
        status: "published",
        isFeatured: true,
        views: 1890,
        likes: 247,
        readingTime: 4,
        publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Practical AI Integration: Deploying Autonomous Coding Agents Safely",
        slug: "practical-ai-integration-autonomous-coding-agents",
        excerpt:
          "Discover how modern agentic workflows, deterministic sandboxes, and verification loops are transforming automated software engineering.",
        content: `
## The Era of Agentic Software Construction

The shift from simple conversational chatbots to autonomous software development agents represents one of the most profound leaps in computing history.

Instead of merely generating code snippets, modern agents:
1. Formulate step-by-step implementation plans.
2. Read, search, and parse complex codebases.
3. Run test suites and interpret compiler diagnostics.
4. Self-correct when errors arise.

### The Feedback Loop

\`\`\`mermaid
flowchart TD
    A[User Request] --> B[Implementation Plan]
    B --> C[Execute Code Changes]
    C --> D[Run Compiler & Tests]
    D -->|Pass| E[Completed Solution]
    D -->|Fail| F[Analyze Error & Auto-Fix]
    F --> C
\`\`\`

Deterministic verification is the cornerstone of trust. When agents operate within structured environments with full type-checking and automated tests, velocity multiplies without degrading quality.
`,
        coverImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80",
        author: adminUser._id,
        category: categoryMap.get("ai-machine-learning")._id,
        tags: ["AI", "Agents", "Automation", "Future of Work"],
        status: "published",
        isFeatured: false,
        views: 2310,
        likes: 310,
        readingTime: 5,
        publishedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Securing Modern Web Apps: JWT Sessions vs State-Stored Tokens",
        slug: "securing-modern-web-apps-jwt-vs-sessions",
        excerpt:
          "A comprehensive comparison of stateless JWT cookies and stateful Redis session stores in Next.js applications.",
        content: `
## Authentication Architecture in Next.js

Authentication is the most critical surface area in any web application. Choosing between stateless JSON Web Tokens (JWT) and stateful sessions depends heavily on your scaling requirements, latency targets, and revocation needs.

### Cryptographically Signed httpOnly Cookies

By storing encrypted tokens in \`httpOnly\`, \`secure\`, \`sameSite: "lax"\` cookies, applications gain complete immunity from client-side Cross-Site Scripting (XSS) token theft.

\`\`\`typescript
import { SignJWT, jwtVerify } from "jose";

export async function createSessionToken(payload: object) {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret);
}
\`\`\`

Always enforce rigorous role checks in your middleware to protect administrative surfaces.
`,
        coverImage: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80",
        author: authorUser._id,
        category: categoryMap.get("full-stack-dev")._id,
        tags: ["Security", "JWT", "Authentication", "Full-Stack"],
        status: "published",
        isFeatured: false,
        views: 820,
        likes: 95,
        readingTime: 4,
        publishedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
      },
    ];

    for (const post of postsData) {
      const createdPost: any = await Post.create(post as any);

      // Seed a couple sample comments on featured post
      if (post.isFeatured) {
        await Comment.create({
          post: createdPost._id,
          authorName: "Marcus Sterling",
          authorEmail: "marcus@example.com",
          content: "Fantastic writeup! The explanation of Server Components vs Server Actions clarifies so many nuances.",
          status: "approved",
          likes: 12,
        });

        await Comment.create({
          post: createdPost._id,
          authorName: "Elena Rostova",
          authorEmail: "elena@example.com",
          content: "The Zod validation pattern you demonstrated in the Server Action is clean and practical. Bookmarked!",
          status: "approved",
          likes: 8,
        });
      }
    }
  }

  return { success: true, message: "Database successfully seeded with demo data" };
}
