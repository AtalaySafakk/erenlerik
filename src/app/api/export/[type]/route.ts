import { NextRequest } from "next/server";
import {
  bankaExcel,
  bordroExcel,
  eldenExcel,
  icraExcel,
  izinExcel,
  masterExcel,
  personelExcel,
  puantajExcel,
  sgkExcel,
} from "@/lib/excel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ type: string }> },
) {
  const { type } = await params;
  const yil = Number(req.nextUrl.searchParams.get("yil")) || new Date().getFullYear();
  const ay = Number(req.nextUrl.searchParams.get("ay")) || new Date().getMonth() + 1;
  const yer = Number(req.nextUrl.searchParams.get("yer")) || undefined;

  let data: Buffer;
  let ad = type;

  if (type === "personel") {
    data = await personelExcel();
    ad = "personel-listesi";
  } else if (type === "puantaj") {
    data = await puantajExcel(yil, ay, yer);
    ad = `puantaj-${yil}-${String(ay).padStart(2, "0")}`;
  } else if (type === "bordro") {
    data = await bordroExcel(yil, ay);
    ad = `bordro-${yil}-${String(ay).padStart(2, "0")}`;
  } else if (type === "izin") {
    data = await izinExcel();
    ad = "izin-takip";
  } else if (type === "icra") {
    data = await icraExcel();
    ad = "icra-takip";
  } else if (type === "banka") {
    data = await bankaExcel(yil, ay);
    ad = `banka-${yil}-${String(ay).padStart(2, "0")}`;
  } else if (type === "master") {
    data = await masterExcel(yil, ay);
    ad = `master-${yil}-${String(ay).padStart(2, "0")}`;
  } else if (type === "sgk") {
    data = await sgkExcel(yil, ay);
    ad = `sgk-${yil}-${String(ay).padStart(2, "0")}`;
  } else if (type === "elden") {
    data = await eldenExcel(yil, ay);
    ad = `elden-kasa-${yil}-${String(ay).padStart(2, "0")}`;
  } else {
    return new Response("Bilinmeyen rapor", { status: 404 });
  }

  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${ad}.xlsx"`,
    },
  });
}
