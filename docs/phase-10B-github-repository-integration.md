# Phase 10B: GitHub Repository Integration

This document outlines the details, architecture, security decisions, and verification results for Phase 10B of ForgeFlow: GitHub Repository Integration.

---

## 1. What was Implemented
- **GitHub Repository Model**: Added `GitHubRepository` mapping database records uniquely to ForgeFlow `Project` records.
- **Escalated OAuth Scope**: Changed authorization scope from `read:user` to `read:user public_repo` in order to read metadata of public repositories.
- **Server-Side API Client**: Implemented helper functions to fetch available repositories and verify ownership via the REST API before connection persistence.
- **Connection CRUD Actions**: Created Server Actions (`getGitHubRepositories`, `connectRepository`, `disconnectRepository`) that perform server-side session checks, project ownership checks, and API validation checks.
- **Project Board UI Card**: Rendered the connection state card inside the project workspace Overview tab.
- **Interactive Repository Selector**: Built a responsive search and connect modal listing public repositories.

---

## 2. Database Relationship & Cascade Constraints
Each ForgeFlow project connects to at most one GitHub repository (one-to-one relationship). Deleting a ForgeFlow project triggers a cascade delete, wiping the connection automatically.

```prisma
model GitHubRepository {
  id                 String   @id @default(uuid()) @db.Uuid
  projectId          String   @unique @db.Uuid
  project            Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  githubRepositoryId String
  name               String
  fullName           String
  ownerLogin         String
  htmlUrl            String
  description        String?
  defaultBranch      String
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  @@index([projectId])
}
```

---

## 3. GitHub API Flow
1. **Repository Retrieval**:
   - URL called: `GET https://api.github.com/user/repos`
   - Params: `per_page=100`, `sort=updated`
   - Access token sent strictly in `Authorization: Bearer <token>` header.
2. **Access Verification**:
   - URL called: `GET https://api.github.com/repos/{owner}/{repoName}`
   - Guarantees the repository is accessible to the current connection token, preventing metadata spoofing.

---

## 4. Security Considerations
- **AccessToken Isolation**: Access tokens are kept strictly inside the `GitHubConnection` table and never copied to `GitHubRepository` or returned to client components.
- **Spoofing Prevention**: The server queries the GitHub API directly to verify access before saving repository metadata.
- **Granular Scope**: Escales permission strictly to `public_repo`. Private repositories are omitted from listings and connection validations by design.

---

## 5. Known Limitations & Phase 10C Recommendations
- **Public Scope**: Only public repositories are connectable. Private repositories require the broader `repo` scope.
- **Recommendations for 10C**: Transition to a GitHub App for fine-grained metadata permission, and implement issues/webhook integrations.
