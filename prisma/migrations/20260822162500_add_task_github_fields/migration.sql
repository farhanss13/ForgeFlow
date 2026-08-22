-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "githubIssueId" TEXT,
ADD COLUMN     "githubIssueNumber" INTEGER,
ADD COLUMN     "githubIssueTitle" TEXT,
ADD COLUMN     "githubIssueUrl" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Task_projectId_githubIssueId_key" ON "Task"("projectId", "githubIssueId");
