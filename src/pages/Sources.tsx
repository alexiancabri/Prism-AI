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
  { name: "Notion", color: "from-neutral-500 to-neutral-700" },
  { name: "SharePoint", color: "from-sky-500 to-blue-700" },
];

function StatusBadge({ status }: { status: DocumentRow["status"] }) {
  const map = {
    indexing: {
      label: "Indexing",
      cls: "bg-amber-500/10 text-amber-300 border-amber-500/20",
      icon: Loader2,
      spin: true,
    },
    ready: {
      label: "Ready",
      cls: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
      icon: CheckCircle2,
      spin: false,
    },
    failed: {
      label: "Failed",
      cls: "bg-red-500/10 text-red-300 border-red-500/20",
      icon: AlertCircle,
      spin: false,
    },
  }[status];
  const Icon = map.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
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
    requestAnimationFrame(() => inputRef.current?.click());
  }

  async function handleDelete(id: string) {
    await api.deleteDocument(id);
    queryClient.invalidateQueries({ queryKey: ["documents"] });
  }

  const liveCardCls =
    "rounded-xl border border-white/10 bg-white/[0.02] p-5 text-left transition-colors hover:border-[#3b82f6]/40 hover:bg-[#3b82f6]/[0.04]";

  return (
    <AppLayout>
      <div className="relative z-10 mx-auto max-w-5xl px-8 py-8">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-100">
            Sources
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            Connect a source or upload documents to index them for Q&amp;A.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {COMING_SOON.map((s) => (
            <div
              key={s.name}
              className="rounded-xl border border-white/10 bg-white/[0.02] p-5 opacity-80"
            >
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br text-white",
                  s.color,
                )}
              >
                <span className="text-sm font-bold">{s.name.charAt(0)}</span>
              </div>
              <h3 className="mt-3 font-medium text-neutral-100">{s.name}</h3>
              <p className="mt-1 text-sm text-neutral-500">
                Sync documents automatically.
              </p>
              <span className="mt-4 inline-block rounded-full bg-white/5 px-2.5 py-1 text-xs font-medium text-neutral-500">
                Coming soon
              </span>
            </div>
          ))}

          {/* PDF Upload */}
          <button onClick={() => pick(".pdf")} className={liveCardCls}>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-red-600 text-white">
              <FileText className="h-5 w-5" />
            </div>
            <h3 className="mt-3 font-medium text-neutral-100">PDF Upload</h3>
            <p className="mt-1 text-sm text-neutral-500">Upload a .pdf to index it.</p>
            <span className="mt-4 inline-block rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
              Active
            </span>
          </button>

          {/* Word Upload */}
          <button onClick={() => pick(".docx")} className={liveCardCls}>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
              <FileType2 className="h-5 w-5" />
            </div>
            <h3 className="mt-3 font-medium text-neutral-100">Word Upload</h3>
            <p className="mt-1 text-sm text-neutral-500">Upload a .docx to index it.</p>
            <span className="mt-4 inline-block rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
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
              ? "border-[#3b82f6] bg-[#3b82f6]/10"
              : "border-white/15 bg-white/[0.01] hover:border-[#3b82f6]/40",
          )}
        >
          <UploadCloud className="h-8 w-8 text-neutral-500" />
          <p className="mt-3 text-sm font-medium text-neutral-300">
            Drag &amp; drop PDF or Word files here
          </p>
          <p className="mt-1 text-xs text-neutral-600">or click to browse</p>
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
          <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {uploadError}
          </p>
        )}

        {/* Document list */}
        <section className="mt-8 rounded-xl border border-white/10 bg-white/[0.02]">
          <div className="border-b border-white/10 px-5 py-4">
            <h2 className="text-sm font-semibold text-neutral-100">
              Documents{" "}
              <span className="ml-1 text-neutral-600">({documents.length})</span>
            </h2>
          </div>
          {documents.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-neutral-500">
              No documents yet. Upload a PDF or Word file to get started.
            </p>
          ) : (
            <ul className="divide-y divide-white/5">
              {documents.map((doc) => (
                <li key={doc.id} className="flex items-center gap-4 px-5 py-3.5">
                  <FileText className="h-5 w-5 shrink-0 text-neutral-500" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-neutral-100">
                      {doc.name}
                    </p>
                    <p className="text-xs text-neutral-600">
                      {formatSize(doc.size)} ·{" "}
                      {new Date(doc.created_at).toLocaleDateString()}
                    </p>
                    {doc.status === "failed" && doc.error && (
                      <p
                        className="mt-1 truncate text-xs text-red-400"
                        title={doc.error}
                      >
                        {doc.error}
                      </p>
                    )}
                  </div>
                  <StatusBadge status={doc.status} />
                  <button
                    onClick={() => handleDelete(doc.id)}
                    title="Delete"
                    className="rounded-md p-2 text-neutral-500 hover:bg-red-500/10 hover:text-red-400"
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
