# Technology Decisions — ForgeFlow

This document captures the technological choices made for ForgeFlow. It explains why each tool was selected, what problems they solve, and provides simple, beginner-friendly explanations alongside technical details.

---

## 1. Summary of Technology Stack

| Technology | Role in Stack | Chosen Solution | Key Alternative | Migration Authority |
| :--- | :--- | :--- | :--- | :--- |
| **Framework** | Frontend + Server | **Next.js (App Router)** | Vite + Express.js | N/A |
| **Language** | Type safety | **TypeScript** | JavaScript | N/A |
| **Database** | Core data persistence | **PostgreSQL (Supabase)** | MySQL / MongoDB | **Prisma Migrations Only** |
| **Backend services**| Auth & file storage | **Supabase** | Firebase / Custom Auth | N/A |
| **ORM** | DB query engine | **Prisma** | Drizzle / SQL queries | **Prisma Schema (Truth)** |
| **Styling** | Layout & UI classes | **Tailwind CSS** | CSS Modules | N/A |
| **Components** | UI component base | **shadcn/ui** | MUI / Chakra UI | N/A |
| **Containerization**| Dev/Prod consistency | **Docker (Deferred)** | Dev server local execution | N/A |

---

## 2. In-Depth Decisions & Explanations

### Next.js
- **Beginner-Friendly**: Instead of having a separate folder for frontend screens and another folder for backend APIs, Next.js merges them. It automatically serves our site pages and handles server-side operations under one roof.
- **Technical**: Utilizes React Server Components (RSC) to render pages on the server, drastically lowering bundle sizes, and leverages Server Actions for direct, secure server mutations.
- **Why ForgeFlow**: Eliminates API boilerplate code and keeps routing consistent.

### Supabase & PostgreSQL (Migration Authority)
- **Beginner-Friendly**: PostgreSQL is our digital filing cabinet. Supabase hosts this cabinet on the web, gives us a simple dashboard to see our tables, and provides user login controls (Auth) and file storage tools.
- **Technical**: Supabase hosts our relational PostgreSQL database. However, to keep migrations organized and simple, **we will only use Prisma Migrations** to change table layouts. We will *not* write Supabase SQL migration files. Supabase is strictly the host.
- **Why ForgeFlow**: Avoids configuration overhead for auth and storage services, allowing us to build standard relational projects securely.

### Prisma (ORM)
- **Beginner-Friendly**: Prisma reads a single text file (`schema.prisma`) where we list our tables, and automatically creates the tables in PostgreSQL and builds TypeScript helpers so we can query database items easily without writing raw SQL code.
- **Technical**: Acts as the single source of truth for the database schema. All schema changes must be declared in `schema.prisma` and deployed via `npx prisma migrate dev`.
- **Why ForgeFlow**: Provides autocompletion and safety, protecting us from database typos and schema mismatch bugs.

### TypeScript
- **Beginner-Friendly**: TypeScript adds strict rules to JavaScript. If we try to pass a string where a number is expected (or access a database field that doesn't exist), our editor highlights it in red before we run the code.
- **Technical**: Static analysis checks data structures at compile time, eliminating a large category of common runtime bugs.

### Tailwind CSS & shadcn/ui
- **Beginner-Friendly**: Tailwind lets us style buttons directly inside the HTML using tiny utility names. shadcn/ui provides pre-designed copy-paste components (like dialog modals, buttons, or inputs) that we own completely.
- **Why ForgeFlow**: Gives us high design customizability without bloated component libraries.

### Docker (Deferred to Phase 12)
- **Beginner-Friendly**: Docker packages the application so it runs identically on any computer.
- **Why ForgeFlow**: To keep early learning simple, we run the app using local Node/npm dev tools. Docker is deferred to Phase 12 (Production Hardening) once the application code is functional.
