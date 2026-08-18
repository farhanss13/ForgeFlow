"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { 
  FileText, Plus, Search, Edit3, Eye, Save, Trash2, 
  ArrowLeft, FileCode, CheckCircle, AlertCircle, Clock 
} from "lucide-react";
import { createDocument, updateDocument, deleteDocument } from "@/app/actions/document-actions";
import { Button } from "@/components/ui/button";

interface DocumentItem {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

interface DocumentsWorkspaceProps {
  projectId: string;
  projectName: string;
  documents: DocumentItem[];
}

export function DocumentsWorkspace({ projectId, projectName, documents }: DocumentsWorkspaceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Search parameters state
  const activeDocId = searchParams.get("docId");
  const mode = searchParams.get("mode") || "preview"; // "preview" or "edit"
  const isCreating = searchParams.get("new") === "true";

  // Client states
  const [searchTerm, setSearchTerm] = React.useState("");
  const [titleInput, setTitleInput] = React.useState("");
  const [contentInput, setContentInput] = React.useState("");
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = React.useState<string | null>(null);
  const [isPending, setIsPending] = React.useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = React.useState(false);

  // Active document resolution
  const activeDoc = documents.find((doc) => doc.id === activeDocId) || documents[0];

  // Sync inputs when active doc or mode changes
  React.useEffect(() => {
    if (isCreating) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTitleInput("");
      setContentInput("");
    } else if (activeDoc) {
      setTitleInput(activeDoc.title);
      setContentInput(activeDoc.content);
    } else {
      setTitleInput("");
      setContentInput("");
    }
    setActionError(null);
    setActionSuccess(null);
  }, [activeDocId, isCreating, activeDoc]);

  // Handle document creation
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPending) return;

    setIsPending(true);
    setActionError(null);
    setActionSuccess(null);

    const formData = new FormData();
    formData.append("title", titleInput);
    formData.append("content", contentInput);

    const res = await createDocument(projectId, null, formData);

    if (res.error) {
      setActionError(res.error);
      setIsPending(false);
    } else if (res.success) {
      // res.success returns the newly created document's ID
      setActionSuccess("Document created successfully!");
      router.push(`/projects/${projectId}/documents?docId=${res.success}&mode=preview`);
      setIsPending(false);
    }
  };

  // Handle document update
  const handleUpdateSubmit = async () => {
    if (!activeDoc || isPending) return;

    setIsPending(true);
    setActionError(null);
    setActionSuccess(null);

    const formData = new FormData();
    formData.append("title", titleInput);
    formData.append("content", contentInput);

    const res = await updateDocument(activeDoc.id, null, formData);

    if (res.error) {
      setActionError(res.error);
      setIsPending(false);
    } else if (res.success) {
      setActionSuccess("Changes saved successfully!");
      // Switch back to preview mode
      router.push(`/projects/${projectId}/documents?docId=${activeDoc.id}&mode=preview`);
      setIsPending(false);
    }
  };

  // Handle document deletion
  const handleDeleteConfirm = async () => {
    if (!activeDoc || isPending) return;

    setIsPending(true);
    setActionError(null);

    const res = await deleteDocument(activeDoc.id);

    if (res && res.error) {
      setActionError(res.error);
      setIsPending(false);
      setIsConfirmDeleteOpen(false);
    } else {
      setIsConfirmDeleteOpen(false);
      setIsPending(false);
      // Redirect to documents main root (which will resolve to first available doc or empty list)
      router.push(`/projects/${projectId}/documents`);
    }
  };

  // Filter list
  const filteredDocs = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
            <Link href={`/projects/${projectId}`} className="hover:text-foreground flex items-center gap-1 transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to workspace
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-foreground mt-2">{projectName} / Technical Wiki</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Maintain setup guides, schemas, and API references.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* LEFT COLUMN: Sidebar (collapses/scrolls nicely) */}
        <div className="md:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Documents</span>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs flex items-center gap-1 px-2.5 cursor-pointer"
              onClick={() => router.push(`/projects/${projectId}/documents?new=true`)}
            >
              <Plus className="h-3.5 w-3.5" /> Add Doc
            </Button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-background/50 border border-input rounded-lg text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {/* Document list items */}
          <div className="space-y-1 max-h-[350px] md:max-h-[550px] overflow-y-auto pr-1">
            {filteredDocs.length === 0 ? (
              <p className="text-xs text-muted-foreground/60 py-4 text-center">No documents found.</p>
            ) : (
              filteredDocs.map((doc) => {
                const isActive = doc.id === activeDoc?.id && !isCreating;
                return (
                  <Link
                    key={doc.id}
                    href={`/projects/${projectId}/documents?docId=${doc.id}&mode=preview`}
                    className={`flex items-start gap-2.5 p-3 rounded-lg text-left transition-colors border ${
                      isActive
                        ? "bg-primary/5 border-primary/20 text-foreground"
                        : "border-transparent text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                    }`}
                  >
                    <FileText className={`h-4 w-4 mt-0.5 shrink-0 ${isActive ? "text-primary" : "text-muted-foreground/75"}`} />
                    <div className="space-y-0.5 overflow-hidden">
                      <p className="text-xs font-bold leading-snug truncate">{doc.title}</p>
                      <p className="text-[10px] text-muted-foreground/60 flex items-center gap-1 font-medium">
                        <Clock className="h-2.5 w-2.5" />
                        {new Date(doc.updatedAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Document View/Edit Workspace */}
        <div className="md:col-span-3 min-h-[500px] border border-border/80 bg-card/20 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between">
          
          {/* Notification status bar */}
          {(actionError || actionSuccess) && (
            <div className={`px-5 py-3 text-xs border-b font-medium flex items-center gap-2 ${
              actionError 
                ? "bg-destructive/10 border-destructive/20 text-destructive" 
                : "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400"
            }`}>
              {actionError ? <AlertCircle className="h-4 w-4 shrink-0" /> : <CheckCircle className="h-4 w-4 shrink-0" />}
              <span>{actionError || actionSuccess}</span>
            </div>
          )}

          {/* Core Content Area */}
          {isCreating ? (
            /* ==================== CREATION FORM ==================== */
            <form onSubmit={handleCreateSubmit} className="flex-1 flex flex-col p-6 space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="title" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Document Title
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  required
                  placeholder="e.g. Database Design"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  disabled={isPending}
                  className="w-full px-3 py-2 bg-background/50 border border-input rounded-lg text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="flex-1 flex flex-col space-y-1.5 min-h-[300px]">
                <div className="flex items-center justify-between">
                  <label htmlFor="content" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Content (Markdown)
                  </label>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <FileCode className="h-3 w-3" /> Monospace Editor Active
                  </span>
                </div>
                <textarea
                  id="content"
                  name="content"
                  placeholder="# Enter your markdown text here..."
                  value={contentInput}
                  onChange={(e) => setContentInput(e.target.value)}
                  disabled={isPending}
                  className="flex-1 w-full p-4 bg-background/30 border border-input rounded-lg text-sm font-mono text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none min-h-[320px]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/40">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => {
                    if (activeDoc) {
                      router.push(`/projects/${projectId}/documents?docId=${activeDoc.id}&mode=preview`);
                    } else {
                      router.push(`/projects/${projectId}/documents`);
                    }
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Creating..." : "Create Document"}
                </Button>
              </div>
            </form>
          ) : !activeDoc ? (
            /* ==================== EMPTY STATE ==================== */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-16">
              <FileText className="h-14 w-14 text-muted-foreground/35 mb-4" />
              <h3 className="text-lg font-bold text-foreground">Your project has no documentation yet</h3>
              <p className="text-sm text-muted-foreground/80 mt-1.5 max-w-sm leading-relaxed">
                Create your first technical document to keep important project architectural schemas and setup files in one place.
              </p>
              <Button
                className="mt-6 flex items-center gap-1.5 cursor-pointer"
                onClick={() => router.push(`/projects/${projectId}/documents?new=true`)}
              >
                <Plus className="h-4 w-4" /> Create Document
              </Button>
            </div>
          ) : (
            /* ==================== ACTIVE DOCUMENT (VIEW or EDIT) ==================== */
            <div className="flex-1 flex flex-col justify-between">
              
              {/* Document Toolbar header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 bg-muted/10">
                <h2 className="font-bold text-foreground text-base truncate pr-4">{activeDoc.title}</h2>
                
                <div className="flex items-center gap-2">
                  {mode === "preview" ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs flex items-center gap-1 cursor-pointer"
                        onClick={() => router.push(`/projects/${projectId}/documents?docId=${activeDoc.id}&mode=edit`)}
                      >
                        <Edit3 className="h-3.5 w-3.5" /> Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                        onClick={() => setIsConfirmDeleteOpen(true)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs flex items-center gap-1 cursor-pointer"
                        onClick={() => router.push(`/projects/${projectId}/documents?docId=${activeDoc.id}&mode=preview`)}
                      >
                        <Eye className="h-3.5 w-3.5" /> Preview
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 text-xs flex items-center gap-1 cursor-pointer"
                        onClick={handleUpdateSubmit}
                        disabled={isPending}
                      >
                        <Save className="h-3.5 w-3.5" /> {isPending ? "Saving..." : "Save"}
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* View/Edit Area */}
              <div className="flex-1 p-6">
                {mode === "edit" ? (
                  <div className="space-y-4 h-full flex flex-col">
                    <div className="space-y-1.5">
                      <label htmlFor="edit-title" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Title
                      </label>
                      <input
                        id="edit-title"
                        type="text"
                        required
                        value={titleInput}
                        onChange={(e) => setTitleInput(e.target.value)}
                        disabled={isPending}
                        className="w-full px-3 py-2 bg-background/50 border border-input rounded-lg text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>
                    <div className="flex-1 flex flex-col space-y-1.5 min-h-[300px]">
                      <label htmlFor="edit-content" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Markdown Content
                      </label>
                      <textarea
                        id="edit-content"
                        value={contentInput}
                        onChange={(e) => setContentInput(e.target.value)}
                        disabled={isPending}
                        className="flex-1 w-full p-4 bg-background/30 border border-input rounded-lg text-sm font-mono text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none min-h-[300px]"
                      />
                    </div>
                  </div>
                ) : (
                  /* ==================== MARKDOWN PREVIEW DISPLAY ==================== */
                  <div className="prose dark:prose-invert max-w-none break-words min-h-[350px]">
                    {contentInput.trim() === "" ? (
                      <p className="italic text-xs text-muted-foreground/60">This document has no content. Click edit to add text.</p>
                    ) : (
                      <ReactMarkdown
                        components={{
                          h1: ({ ...props }) => <h1 className="text-2xl font-bold border-b border-border/40 pb-1.5 mt-6 mb-3 text-foreground" {...props} />,
                          h2: ({ ...props }) => <h2 className="text-xl font-bold mt-5 mb-2 text-foreground" {...props} />,
                          h3: ({ ...props }) => <h3 className="text-lg font-bold mt-4 mb-2 text-foreground" {...props} />,
                          p: ({ ...props }) => <p className="text-sm leading-relaxed text-muted-foreground my-2.5" {...props} />,
                          ul: ({ ...props }) => <ul className="list-disc pl-5 my-3 space-y-1.5 text-sm text-muted-foreground" {...props} />,
                          ol: ({ ...props }) => <ol className="list-decimal pl-5 my-3 space-y-1.5 text-sm text-muted-foreground" {...props} />,
                          li: ({ ...props }) => <li className="leading-relaxed" {...props} />,
                          code: ({ inline, ...props }: React.ComponentPropsWithoutRef<"code"> & { inline?: boolean }) => 
                            inline ? (
                              <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-foreground border border-border/40" {...props} />
                            ) : (
                              <pre className="bg-muted/50 p-4 rounded-lg overflow-x-auto border border-border my-4">
                                <code className="text-xs font-mono text-foreground block whitespace-pre" {...props} />
                              </pre>
                            ),
                          blockquote: ({ ...props }) => <blockquote className="border-l-4 border-primary/40 pl-4 italic text-muted-foreground my-4" {...props} />,
                          table: ({ ...props }) => <table className="w-full text-left border-collapse border border-border my-4 text-sm" {...props} />,
                          th: ({ ...props }) => <th className="border border-border p-2 bg-muted/30 font-bold" {...props} />,
                          td: ({ ...props }) => <td className="border border-border p-2 text-muted-foreground" {...props} />,
                          a: ({ ...props }) => <a className="text-primary hover:underline" {...props} />,
                        }}
                      >
                        {contentInput}
                      </ReactMarkdown>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isConfirmDeleteOpen && activeDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md p-6 rounded-xl border border-border shadow-2xl relative space-y-4">
            <h3 className="text-lg font-bold text-foreground">Delete Document?</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Are you sure you want to delete <strong className="text-foreground">{activeDoc.title}</strong>? 
              This will permanently delete this wiki file and cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsConfirmDeleteOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={isPending}
              >
                {isPending ? "Deleting..." : "Confirm Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
