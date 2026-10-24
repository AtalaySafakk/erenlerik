import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { readFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = await prisma.belge.findUnique({ where: { id: Number(id) } });
  if (!b) return new Response("Yok", { status: 404 });
  const buf = await readFile(path.join(process.cwd(), "uploads", "belgeler", b.yol)).catch(() => null);
  if (!buf) return new Response("Dosya yok", { status: 404 });
  return new Response(buf, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(b.ad)}"`,
    },
  });
}
