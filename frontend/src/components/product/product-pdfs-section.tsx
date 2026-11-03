"use client";

import { useEffect, useState } from "react";
import { Download, FileText, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { showError } from "@/lib/toast";
import type { PublicProductPdf } from "@/types/product";

type ProductPdfsSectionProps = {
  productName: string;
  pdfs: PublicProductPdf[];
};

function pdfDownloadName(name: string): string {
  const trimmed = name.trim() || "document";
  return trimmed.toLowerCase().endsWith(".pdf") ? trimmed : `${trimmed}.pdf`;
}

/**
 * Cloudinary raw URLs often omit Content-Type / `.pdf`, so iframes download
 * instead of previewing. Force an application/pdf blob for inline display.
 */
async function fetchPdfBlob(url: string): Promise<Blob> {
  const response = await fetch(url, { mode: "cors" });
  if (!response.ok) {
    throw new Error("Could not load PDF");
  }
  const buffer = await response.arrayBuffer();
  return new Blob([buffer], { type: "application/pdf" });
}

export function ProductPdfsSection({
  productName,
  pdfs,
}: ProductPdfsSectionProps) {
  const [activePdf, setActivePdf] = useState<PublicProductPdf | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const rows = [...pdfs].sort((a, b) => a.sortOrder - b.sortOrder);

  useEffect(() => {
    if (!activePdf) {
      setPreviewUrl(null);
      setPreviewError(null);
      setPreviewLoading(false);
      return;
    }

    let cancelled = false;
    let objectUrl: string | null = null;

    setPreviewLoading(true);
    setPreviewError(null);
    setPreviewUrl(null);

    void (async () => {
      try {
        const blob = await fetchPdfBlob(activePdf.pdfUrl);
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setPreviewUrl(objectUrl);
      } catch {
        if (!cancelled) {
          setPreviewError(
            "Preview could not be loaded in the browser. You can still download the PDF.",
          );
        }
      } finally {
        if (!cancelled) {
          setPreviewLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [activePdf]);

  const handleDownload = async () => {
    if (!activePdf || downloading) return;
    setDownloading(true);
    try {
      const blob =
        previewUrl != null
          ? await fetch(previewUrl).then((response) => response.blob())
          : await fetchPdfBlob(activePdf.pdfUrl);
      const objectUrl = URL.createObjectURL(
        new Blob([blob], { type: "application/pdf" }),
      );
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = pdfDownloadName(activePdf.name);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      showError("Could not download this PDF. Try again.");
    } finally {
      setDownloading(false);
    }
  };

  if (rows.length === 0) {
    return null;
  }

  return (
    <section
      className="w-full bg-[#f7f3eb] py-14 sm:py-16 lg:py-20"
      aria-labelledby="product-pdfs-heading"
    >
      <div className="container-page">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold tracking-[0.18em] text-[#a8735d] uppercase">
            Documents
          </p>
          <h2
            id="product-pdfs-heading"
              className="mt-2 max-w-xl font-serif text-4xl leading-[0.98] tracking-[-0.04em] text-[#1c2a2e] sm:text-5xl"
          >
            Product PDFs
          </h2>
          <div className="mt-2 h-1 w-20 rounded-full bg-gradient-to-r from-[#ef6a24] to-[#f0d8c9]" />
        </div>

        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((pdf) => (
            <li key={pdf.id}>
              <button
                type="button"
                onClick={() => setActivePdf(pdf)}
                className="group flex w-full items-center gap-3 rounded-2xl border border-[#eadfce] bg-white px-4 py-4 text-left shadow-[0_8px_24px_rgba(40,30,20,0.04)] transition-colors hover:border-[#c97852] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c97852] cursor-pointer"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#f4ebe1] text-[#c97852]">
                  <FileText className="size-5" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-[#1c2a2e] group-hover:text-[#c97852]">
                    {pdf.name}
                  </span>
                  <span className="mt-0.5 block text-xs text-[#6c7a7d]">
                    Click to preview
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <Dialog
        open={Boolean(activePdf)}
        onOpenChange={(open) => {
          if (!open) setActivePdf(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-4xl">
          {activePdf ? (
            <>
              <DialogHeader>
                <DialogTitle>{activePdf.name}</DialogTitle>
                <DialogDescription>
                  Preview for {productName}
                </DialogDescription>
              </DialogHeader>
              <div className="overflow-hidden rounded-lg border bg-muted">
                {previewLoading ? (
                  <div className="flex h-[60vh] items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Loading preview…
                  </div>
                ) : previewUrl ? (
                  <iframe
                    title={activePdf.name}
                    src={`${previewUrl}#toolbar=1&navpanes=0`}
                    className="h-[60vh] w-full bg-white"
                  />
                ) : (
                  <div className="flex h-[60vh] items-center justify-center px-6 text-center text-sm text-muted-foreground">
                    {previewError ?? "Preview unavailable."}
                  </div>
                )}
              </div>
              <DialogFooter className="gap-2 sm:gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActivePdf(null)}
                >
                  <X className="mr-2 size-4" aria-hidden />
                  Close
                </Button>
                <Button
                  type="button"
                  disabled={downloading}
                  onClick={() => void handleDownload()}
                >
                  {downloading ? (
                    <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                  ) : (
                    <Download className="mr-2 size-4" aria-hidden />
                  )}
                  {downloading ? "Downloading…" : "Download PDF"}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
