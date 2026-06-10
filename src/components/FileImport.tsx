import { useRef, useState } from "react";
import { Upload, FileCheck, AlertCircle, X } from "lucide-react";
import { parseGpx } from "../services/gpxParser";
import { parseFit } from "../services/fitParser";
import type { Track } from "../types";

interface Props {
  onImport: (tracks: Track[]) => void;
}

interface ImportResult {
  file: string;
  ok: boolean;
  message?: string;
}

export default function FileImport({ onImport }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [processing, setProcessing] = useState(false);

  const processFiles = async (files: FileList | File[]) => {
    setProcessing(true);
    setResults([]);
    const fileList = Array.from(files);
    const imported: Track[] = [];
    const newResults: ImportResult[] = [];

    for (const file of fileList) {
      const name = file.name;
      const ext = name.split(".").pop()?.toLowerCase();

      try {
        let track: Track | null = null;

        if (ext === "gpx") {
          const text = await file.text();
          track = parseGpx(text, name);
        } else if (ext === "fit") {
          const buffer = await file.arrayBuffer();
          track = await parseFit(buffer, name);
        } else {
          newResults.push({
            file: name,
            ok: false,
            message: "Unsupported format (use .gpx or .fit)",
          });
          continue;
        }

        if (!track) {
          newResults.push({
            file: name,
            ok: false,
            message: "No valid track data found",
          });
        } else {
          imported.push(track);
          newResults.push({ file: name, ok: true });
        }
      } catch (e) {
        newResults.push({
          file: name,
          ok: false,
          message: (e as Error).message,
        });
      }
    }

    setResults(newResults);
    setProcessing(false);
    if (imported.length > 0) {
      onImport(imported);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={() => setDragging(false)}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${
          dragging
            ? "border-blue-400 bg-blue-50"
            : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
        }`}
      >
        <Upload size={24} className="mx-auto mb-2 text-gray-400" />
        <p className="text-sm font-medium text-gray-700">
          {processing ? "Processing…" : "Drop .gpx or .fit files here"}
        </p>
        <p className="text-xs text-gray-400 mt-1">or click to browse</p>
        <input
          ref={inputRef}
          type="file"
          accept=".gpx,.fit"
          multiple
          className="hidden"
          onChange={onFileChange}
        />
      </div>

      {/* How to export hint */}
      <details className="text-xs text-gray-400 cursor-pointer">
        <summary className="hover:text-gray-600">
          How to export from Zepp / Mi Fitness app
        </summary>
        <ol className="mt-2 ml-4 list-decimal space-y-1 text-gray-500">
          <li>
            Open the <strong>Zepp</strong> app on your phone
          </li>
          <li>
            Go to <strong>Workouts</strong> → tap a workout
          </li>
          <li>
            Tap the <strong>share / export</strong> icon
          </li>
          <li>
            Choose <strong>Export GPX</strong> or{" "}
            <strong>Export Original Data (.fit)</strong>
          </li>
          <li>Transfer the file to your computer and drop it here</li>
        </ol>
      </details>

      {/* Import results */}
      {results.length > 0 && (
        <div className="space-y-1">
          {results.map((r) => (
            <div
              key={r.file}
              className={`flex items-start gap-2 text-xs px-3 py-2 rounded-lg ${
                r.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
              }`}
            >
              {r.ok ? (
                <FileCheck size={13} className="mt-0.5 shrink-0" />
              ) : (
                <AlertCircle size={13} className="mt-0.5 shrink-0" />
              )}
              <span className="truncate">{r.file}</span>
              {!r.ok && r.message && (
                <span className="ml-auto shrink-0">{r.message}</span>
              )}
            </div>
          ))}
          <button
            onClick={() => setResults([])}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mt-1"
          >
            <X size={11} /> Clear
          </button>
        </div>
      )}
    </div>
  );
}
