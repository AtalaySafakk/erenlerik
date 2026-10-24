import { cookies } from "next/headers";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { prisma } from "./prisma";
import { oturumCoz, oturumToken, type Oturum } from "./auth-cookie";

export type { Oturum };

export function sifreHash(sifre: string) {
  const tuz = randomBytes(16).toString("hex");
  const hash = scryptSync(sifre, tuz, 32).toString("hex");
  return `${tuz}:${hash}`;
}

export function sifreDogrula(sifre: string, sakli: string) {
  const [tuz, hash] = sakli.split(":");
  if (!tuz || !hash) return false;
  const gelen = scryptSync(sifre, tuz, 32);
  const hedef = Buffer.from(hash, "hex");
  if (gelen.length !== hedef.length) return false;
  return timingSafeEqual(gelen, hedef);
}

export async function oturumGetir(): Promise<Oturum | null> {
  const jar = await cookies();
  return oturumCoz(jar.get("ik_oturum")?.value);
}

export async function oturumAc(kullaniciAdi: string, sifre: string) {
  const k = await prisma.kullanici.findUnique({ where: { kullaniciAdi } });
  if (!k || !k.aktif || !sifreDogrula(sifre, k.sifre)) return null;
  const token = await oturumToken({ id: k.id, ad: k.ad, rol: k.rol });
  const jar = await cookies();
  jar.set("ik_oturum", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return k;
}

export async function oturumKapat() {
  const jar = await cookies();
  jar.delete("ik_oturum");
}

export function muhasebeMi(rol?: string) {
  return rol === "ADMIN" || rol === "MUHASEBE";
}
