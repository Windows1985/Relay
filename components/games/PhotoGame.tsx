"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSubmitRound } from "./useSubmitRound";

// Compresses to at most 1200px on the long edge, JPEG — no image library,
// just a canvas.
function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, 1200 / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas unsupported"));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Compression failed"))), "image/jpeg", 0.85);
    };
    img.onerror = reject;
    img.src = url;
  });
}

export function PhotoGame({ roundId, promptText }: { roundId: string; promptText: string }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null);
  const { submit, submitting, error } = useSubmitRound(roundId);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    try {
      const blob = await compressImage(file);
      setPendingBlob(blob);
      setPreview(URL.createObjectURL(blob));
    } catch {
      setUploadError("Couldn't process that photo.");
    }
  }

  async function confirm() {
    if (!pendingBlob) return;
    setUploading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setUploadError("Not signed in.");
      setUploading(false);
      return;
    }
    const path = `${roundId}/${user.id}.jpg`;
    const { error: uploadErr } = await supabase.storage
      .from("photos")
      .upload(path, pendingBlob, { contentType: "image/jpeg", upsert: true });
    setUploading(false);
    if (uploadErr) {
      setUploadError(uploadErr.message);
      return;
    }
    submit({}, path);
  }

  return (
    <div className="bezel flex w-full max-w-sm flex-col items-center gap-4 px-6 py-10 text-center">
      <div className="font-mono led-text text-lg font-bold uppercase tracking-widest">{promptText}</div>

      {!preview && (
        <label className="btn-tactile w-full cursor-pointer py-4 text-lg font-bold uppercase tracking-wide">
          Take photo
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={onFileChange}
            className="hidden"
          />
        </label>
      )}

      {preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="Your submission preview" className="bezel-inset w-full object-cover" />
      )}

      {preview && (
        <button
          onClick={confirm}
          disabled={uploading || submitting}
          className="btn-tactile w-full py-4 text-lg font-bold uppercase tracking-wide disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Transmit"}
        </button>
      )}

      {uploadError && <p className="text-sm text-danger">{uploadError}</p>}
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
