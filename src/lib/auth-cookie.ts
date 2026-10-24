const ANAHTAR = process.env.OTURUM_ANAHTAR || "ikprogram-taslak-anahtar";
const enc = new TextEncoder();

export type Oturum = { id: number; ad: string; rol: string };

export const SAHA_YOLLAR = [
  "/",
  "/personel",
  "/puantaj",
  "/giris-cikis",
  "/izin",
  "/mazeret",
];

export function sahaIzinli(pathname: string) {
  if (pathname.startsWith("/api/export/puantaj")) return true;
  if (pathname.startsWith("/api/belge")) return true;
  return SAHA_YOLLAR.some((y) => (y === "/" ? pathname === "/" : pathname === y || pathname.startsWith(`${y}/`)));
}

async function hmac(metin: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(ANAHTAR),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const imza = await crypto.subtle.sign("HMAC", key, enc.encode(metin));
  return Array.from(new Uint8Array(imza))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function oturumToken(o: Oturum) {
  const exp = Date.now() + 1000 * 60 * 60 * 12;
  const govde = `${o.id}.${encodeURIComponent(o.ad)}.${o.rol}.${exp}`;
  return `${govde}.${await hmac(govde)}`;
}

export async function oturumCoz(token?: string | null): Promise<Oturum | null> {
  if (!token) return null;
  const parca = token.split(".");
  if (parca.length < 5) return null;
  const [id, ad, rol, exp, ...imzaParca] = parca;
  const imza = imzaParca.join(".");
  const govde = `${id}.${ad}.${rol}.${exp}`;
  if (imza !== (await hmac(govde))) return null;
  if (Number(exp) < Date.now()) return null;
  return { id: Number(id), ad: decodeURIComponent(ad), rol };
}
