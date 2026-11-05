import { PrismaClient } from "@prisma/client";
import { cloudinary } from "./src/lib/cloudinary/cloudinary.config";

async function probe(label: string, url: string) {
  const response = await fetch(url);
  const text = await response.text();
  let message = text.startsWith("%PDF") ? "pdf-bytes" : text.slice(0, 80);
  try {
    const parsed = JSON.parse(text) as { error?: { message?: string } };
    message = parsed.error?.message ?? message;
  } catch {
    // not json
  }
  console.log(
    JSON.stringify({
      label,
      status: response.status,
      contentType: response.headers.get("content-type"),
      bytes: text.length,
      message,
    }),
  );
}

async function main() {
  const prisma = new PrismaClient();
  const rows = await prisma.productPdf.findMany({
    select: { name: true, pdfUrl: true, pdfPublicId: true },
  });
  console.log(
    JSON.stringify(
      rows.map((row) => ({
        name: row.name,
        hasPublicId: Boolean(row.pdfPublicId),
        publicId: row.pdfPublicId,
        hostPath: (() => {
          try {
            const url = new URL(row.pdfUrl);
            return `${url.hostname}${url.pathname}`;
          } catch {
            return "invalid";
          }
        })(),
      })),
      null,
      2,
    ),
  );

  const row = rows[0];
  if (!row) {
    await prisma.$disconnect();
    return;
  }

  await probe("stored", row.pdfUrl);
  if (row.pdfPublicId) {
    const version = Number(row.pdfUrl.match(/\/v(\d+)\//)?.[1] ?? 0) || undefined;
    const info = await cloudinary.api.resource(row.pdfPublicId, {
      resource_type: "raw",
      type: "upload",
    });
    console.log(
      JSON.stringify({
        type: info.type,
        accessMode: info.access_mode,
        resourceType: info.resource_type,
        bytes: info.bytes,
      }),
    );

    const signed = cloudinary.url(row.pdfPublicId, {
      resource_type: "raw",
      type: "upload",
      sign_url: true,
      secure: true,
      version,
    });
    await probe("signed-version", signed);

    const download = cloudinary.utils.private_download_url(row.pdfPublicId, "pdf", {
      resource_type: "raw",
      type: "upload",
      attachment: true,
    });
    await probe("private-download", download);

    const downloadNoFormat = cloudinary.utils.private_download_url(row.pdfPublicId, "", {
      resource_type: "raw",
      type: "upload",
    });
    await probe("private-download-empty-format", downloadNoFormat);
  }

  await prisma.$disconnect();
}

void main();
