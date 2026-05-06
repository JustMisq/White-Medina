"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface ImageLightboxProps {
  src: string | null;
  alt?: string;
  onClose: () => void;
}

export function ImageLightbox({ src, alt = "image", onClose }: ImageLightboxProps) {
  if (!src) return null;

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="p-1 sm:max-w-4xl bg-black ring-0 border-0 gap-0">
        <DialogTitle className="sr-only">{alt}</DialogTitle>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="max-h-[88vh] w-full object-contain rounded"
        />
      </DialogContent>
    </Dialog>
  );
}
