import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Trash2,
  UploadCloud,
  FileText,
  FileType2,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import AppLayout from "@/components/app/AppLayout";
import { api, type DocumentRow } from "@/lib/api";
import { cn } from "@/lib/utils";

const COMING_SOON = [
  { name: "Google Drive", color: "from-yellow-400 to-green-500" },
  { name: "Notion", color: "from-neutral-700 to-neutral-900" },
  { name: "SharePoint", color: "from-sky-500 to-blue-700" },
];

function StatusBadge({ status }: { status: DocumentRow["status"] }) {
  const map = {
    indexing: {
      label: "Indexing",
      cls: "bg-amber-50 text-amber-700",
      icon: Loader2,
      spin: true,
    },
    ready: {
      label: "Ready",
      cls: "bg-emerald-50 text-emerald-700",
      icon: CheckCircle2,
      spin: false,
    },
    failed: {
      label: "Failed",
      cls: "bg-red-50 text-red-700",
      icon: AlertCircle,
      spin: false,
    },
  }[status];
  const Icon = map.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        map.cls,
      )}
    >
      <Icon className={cn("h-3.5 w-3.5", map.spin && "animate-spin")} />
      {map.label}
    </span>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Sources() {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [accept, setAccept] = useState(".pdf,.docx");
  const [dragging, setDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { data: documents = [] } = useQuery({
    queryKey: ["documents"],
    queryFn: api.listDocuments,
    // Keep polling while anything is still indexing so the badge flips live.
    refetchInterval: (query) =>
      (query.state.data ?? []).some((d) => d.status === "indexing") ? 2000 : false,
  });

  async function uploadFiles(files: FileList | File[]) {
    setUploadError(null);
    for (const file of Array.from(files)) {
      try {
        await api.uploadDocument(file);
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : "Upload failed.");
      }
    }
    queryClient.invalidateQueries({ queryKey: ["documents"] });
  }

  function pick(acceptType: string) {
    setAccept(acceptType);
    // let state apply before opening the dialog
    requestAnimationFrame(() => inputRef.current?.click());
  }

  async function handleDelete(id: string) {
    await api.deleteDocument(id);
    queryClient.invalidateQueries({ queryKey: ["documents"] });
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl px-8 py-8">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Sources</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Connect a source or upload documents to index them for Q&amp;A.
          </p>
        </header>

        {/* Source grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {COMING_SOON.map((s) => (
            <div
              key={s.name}
              className="relative rounded-xl border border-neutral-200 bg-white p-5 opacity-90"
            >
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br text-white",
                  s.color,
                )}
              >
                <span className="text-sm font-bold">{s.name.charAt(0)}</span>
              </div>
              <h3 className="mt-3 font-medium text-neutral-900">{s.name}</h3>
              <p className="mt-1 text-sm text-neutral-500">
                Sync documents automatically.
              </p>
              <span className="mt-4 inline-block rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-500">
                Coming soon
              </span>
            </div>
          ))}

          {/* PDF Upload */}
          <button
            onClick={() => pick(".pdf")}
            className="rounded-xl border border-neutral-200 bg-white p-5 text-left transition-colors hover:border-indigo-300 hover:bg-indigo-50/40"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-red-600 text-white">
              <FileText className="h-5 w-5" />
            </div>
            <h3 className="mt-3 font-medium text-neutral-900">PDF Upload</h3>
            <p className="mt-1 text-sm text-neutral-500">
              Upload a .pdf to index it.
            </p>
            <span className="mt-4 inline-block rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
              Active
            </span>
          </button>

          {/* Word Upload */}
          <button
            onClick={() => pick(".docx")}
            className="rounded-xl border border-neutral-200 bg-white p-5 text-left transition-colors hover:border-indigo-300 hover:bg-indigo-50/40"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
              <FileType2 className="h-5 w-5" />
            </div>
            <h3 className="mt-3 font-medium text-neutral-900">Word Upload</h3>
            <p className="mt-1 text-sm text-neutral-500">
              Upload a .docx to index it.
            </p>
            <span className="mt-4 inline-block rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
              Active
            </span>
          </button>
        </div>

        {/* Drag & drop zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (e.dataTransfer.files.length) {
              setAccept(".pdf,.docx");
              uploadFiles(e.dataTransfer.files);
            }
          }}
          onClick={() => pick(".pdf,.docx")}
          className={cn(
            "mt-6 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors",
            dragging
              ? "border-indigo-400 bg-indigo-50"
              : "border-neutral-300 bg-white hover:border-indigo-300",
          )}
        >
          <UploadCloud className="h-8 w-8 text-neutral-400" />
          <p className="mt-3 text-sm font-medium text-neutral-700">
            Drag &amp; drop PDF or Word files here
          </p>
          <p className="mt-1 text-xs text-neutral-400">or click to browse</p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) uploadFiles(e.target.files);
            e.target.value = "";
          }}
        />

        {uploadError && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {uploadError}
          </p>
        )}

        {/* Document list */}
        <section className="mt-8 rounded-xl border border-neutral-200 bg-white">
          <div className="border-b border-neutral-200 px-5 py-4">
            <h2 className="text-sm font-semibold text-neutral-900">
              Documents{" "}
              <span className="ml-1 text-neutral-400">({documents.length})</span>
            </h2>
          </div>
          {documents.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-neutral-400">
              No documents yet. Upload a PDF or Word file to get started.
            </p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {documents.map((doc) => (
                <li
                  key={doc.id}
                  className="flex items-center gap-4 px-5 py-3.5"
                >
                  <FileText className="h-5 w-5 shrink-0 text-neutral-400" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-neutral-900">
                      {doc.name}
                    </p>
                    <p className="text-xs text-neutral-400">
                      {formatSize(doc.size)} ·{" "}
                      {new Date(doc.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <StatusBadge status={doc.status} />
                  <button
                    onClick={() => handleDelete(doc.id)}
                    title="Delete"
                    className="rounded-md p-2 text-neutral-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppLayout>
  );
}
