# Implementation Roadmap — ForgeFlow

This roadmap divides development into 12 structured, learning-oriented phases. Each phase introduces new technologies, concepts, and contains an explicit Definition of Done (DoD) and Manual Testing Checklist.

---

## The 12 Development Phases

### Phase 1: Next.js Application Foundation
- **Objective**: Bootstrap the Next.js app workspace and configure initial styling structures.
- **Features**: A clean, premium responsive landing page with basic navigation headers.
- **Technologies Introduced**: Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui.
- **Learning Concepts**: React Server Components (RSC) vs Client Components, App Router file layouts, Tailwind utility styles.
- **Definition of Done**:
  - `npm run dev` builds successfully without warnings.
  - Zero TypeScript or Lint compilation errors.
- **Manual Testing Checklist**:
  - Open landing page in multiple viewport sizes to test responsive design layout.

### Phase 2: Supabase + PostgreSQL + Prisma
- **Objective**: Configure database connections and schema migration pathways.
- **Features**: Basic local API endpoints to verify DB connections.
- **Technologies Introduced**: Supabase PostgreSQL hosting, Prisma Client, Prisma Migrations.
- **Learning Concepts**: Relational modeling, database connection strings, Prisma schema updates.
- **Definition of Done**:
  - Prisma schema includes initial entity layouts.
  - `npx prisma migrate dev` runs successfully and updates the remote Supabase database.
- **Manual Testing Checklist**:
  - Verify tables show up in the Supabase Table Editor database view.

### Phase 3: Authentication & Authorization
- **Objective**: Implement secure signup, signin, signout, and layout routing.
- **Features**: Register/login pages and server-guarded routes.
- **Technologies Introduced**: Supabase Auth (Server-side middleware integration).
- **Learning Concepts**: Cookies, JWT session validation, Next.js middleware, Authentication vs Authorization.
- **Definition of Done**:
  - Unauthenticated users cannot view the dashboard and are redirected to `/login`.
  - Creating a user in Supabase Auth creates a matching profile in the database.
- **Manual Testing Checklist**:
  - Try accessing dashboard routes directly in browser Incognito window to confirm redirect.

### Phase 4: Projects & Dashboard
- **Objective**: Create the workspace dashboard to manage projects.
- **Features**: Project CRUD operations, Dashboard summary stats.
- **Technologies Introduced**: Next.js Server Actions, Prisma queries with explicit ownership checks.
- **Learning Concepts**: Database foreign keys, server-side permissions checking.
- **Definition of Done**:
  - Project entries are created, read, updated, and deleted successfully.
  - Verification code ensures a user cannot access another user's project ID by pasting the URL.
- **Manual Testing Checklist**:
  - Attempt to update a project ID belonging to "User B" while logged in as "User A" and confirm it fails.

### Phase 5: Milestones & Tasks
- **Objective**: Construct underlying data hierarchies for planning workspaces.
- **Features**: Create milestones, attach tasks, add descriptions, and track task details.
- **Technologies Introduced**: SQL relations, consistent timestamps.
- **Learning Concepts**: Data relationships (One-to-Many), Cascade deletion mechanisms.
- **Definition of Done**:
  - Tasks can be linked to milestones optionally.
  - Deleting a project cascades deletion to all child milestones and tasks.
- **Manual Testing Checklist**:
  - Create milestone ➔ Add task linked to milestone ➔ Delete project ➔ Verify database tables are completely clean of those specific items.

### Phase 6: Kanban Board
- **Objective**: Implement an interactive task tracking interface.
- **Features**: Columns for Todo, In Progress, Done. Drag-and-drop column cards.
- **Technologies Introduced**: HTML5 Drag & Drop API (or lightweight library), Float position indices.
- **Learning Concepts**: Float positions calculations for reordering lists, Optimistic UI state updates.
- **Definition of Done**:
  - Tasks can be dragged across lists, immediately calculating the new task position value and saving it to the server.
- **Manual Testing Checklist**:
  - Drag a card between two cards and verify positions resolve cleanly in the DB without changing other cards.

### Phase 7: Documentation Wiki
- **Objective**: Implement a technical documentation writer.
- **Features**: Markdown formatting editor, directory sidebars.
- **Technologies Introduced**: Markdown renderers.
- **Learning Concepts**: Safe markdown parsing, sanitized HTML formatting.
- **Definition of Done**:
  - Wiki documents are fully editable and render styled headings, lists, and code blocks correctly.
- **Manual Testing Checklist**:
  - Type markdown headers and confirm styling renders immediately.

### Phase 8: AI Project Planner
- **Objective**: Use AI to outline new project milestones from a prompt.
- **Features**: Chat prompts suggesting project scope steps.
- **Technologies Introduced**: Structured JSON schema output, AI Service abstraction client.
- **Learning Concepts**: Prompt engineering, parsing JSON schemas, AI API keys server protection.
- **Definition of Done**:
  - The AI outputs proposed milestones matching a template format, which the user can accept or reject.
- **Manual Testing Checklist**:
  - Submit request, review preview output, click "Generate Milestones" and ensure they populate the project.

### Phase 9: AI Task Assistant
- **Objective**: Add inline AI help to split tasks and write descriptions.
- **Features**: "AI Enhance" buttons in task detail sidebars.
- **Technologies Introduced**: OpenAI/Anthropic SDKs.
- **Learning Concepts**: Contextual prompting, streaming responses.
- **Definition of Done**:
  - Action buttons enhance task titles and descriptions using AI predictions.
- **Manual Testing Checklist**:
  - Click "Refine description" on a short task and confirm expanded suggestions appear.

### Phase 10: GitHub Integration
- **Objective**: Sync project tracking to GitHub activities.
- **Features**: GitHub link buttons, webhook listeners to update board tasks from issues.
- **Technologies Introduced**: GitHub API, Webhook endpoints in Next.js Route Handlers.
- **Learning Concepts**: Webhooks, secure token validation, external API sync.
- **Definition of Done**:
  - Webhooks successfully update local database records on ForgeFlow when issues are closed on GitHub.
- **Manual Testing Checklist**:
  - Trigger webhook payload to simulate a GitHub issue event and inspect local task status.

### Phase 11: Activity Feed & Analytics
- **Objective**: Log major system changes.
- **Features**: Main activity timeline, simple dashboard metrics.
- **Technologies Introduced**: Simple database logs.
- **Learning Concepts**: Audit trail tracking.
- **Definition of Done**:
  - Standard activities (project/task creation) write simple logs without complex event infrastructure.
- **Manual Testing Checklist**:
  - Perform actions, check if activity feed sidebar correctly appends the log description.

### Phase 12: Docker, Testing & Production Hardening
- **Objective**: Prepare application containerization and automated deployments.
- **Features**: Multi-stage Docker builds, automated CI/CD checks.
- **Technologies Introduced**: Docker, Vercel deployments, Unit/E2E testing frameworks.
- **Learning Concepts**: Container configurations, environment isolation, deployment setups.
- **Definition of Done**:
  - Multi-stage Docker builds complete successfully.
  - Deployment pipelines verify compilation and pass testing suites before Vercel release.
- **Manual Testing Checklist**:
  - Spin up the app inside a local Docker container and run test suites.
