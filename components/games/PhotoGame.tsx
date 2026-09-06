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

export function PhotoGame({ roundId }: { roundId: string }) {
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
      setUploadError("Couldn't read that photo. Try another.");
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
      setUploadError("You've been signed out — sign in and try again.");
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
    <>
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="Your photo" className="aspect-square w-full rounded-[20px] object-cover" />
      ) : (
        <label className="btn-primary w-full cursor-pointer">
          Take a photo
          <input type="file" accept="image/*" capture="environment" onChange={onFileChange} className="hidden" />
        </label>
      )}

      {preview && (
        <div className="flex w-full flex-col gap-2">
          <button onClick={confirm} disabled={uploading || submitting} className="btn-primary w-full">
            {uploading ? "Uploading…" : submitting ? "Posting…" : "Post it"}
          </button>
          <label className="btn-secondary w-full cursor-pointer">
            Retake
            <input type="file" accept="image/*" capture="environment" onChange={onFileChange} className="hidden" />
          </label>
        </div>
      )}

      {uploadError && <p className="text-sm font-bold text-danger">{uploadError}</p>}
      {error && <p className="text-sm font-bold text-danger">{error}</p>}
    </>
  );
}
