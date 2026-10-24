import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AYLAR, adSoyad, paraTl } from "@/lib/format";
import Link from "next/link";
import { PrintButton } from "@/components/print-button";

export const dynamic = "force-dynamic";

export default async function PusulaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = await prisma.bordro.findUnique({
    where: { id: Number(id) },
    include: { personel: { include: { gorevYeri: true } } },
  });
  if (!b) notFound();
  const ayar = await prisma.ayar.findUnique({ where: { id: 1 } });

  const satirlar = [
    ["Çalışma günü", String(b.calismaGun)],
    ["Çalışma saati", String(b.calismaSaat)],
    ["Fazla mesai saati", String(b.fazlaMesaiSaat)],
    ["Tatil mesai saati", String(b.tatilMesaiSaat)],
    ["Eksik gün oranı", `${Math.round(b.eksikOran * 100)}%`],
    ["Net maaş (dönem)", paraTl(b.netMaas)],
    ["Resmi maaş", paraTl(b.resmiUcret)],
    ["Ek ödeme / mesai", paraTl(b.ekOdeme)],
    ["Yemek", paraTl(b.yemek)],
    ["Yol", paraTl(b.yol)],
    ["Prim", paraTl(b.prim)],
    ["Avans", paraTl(b.avans)],
    ["Otom. katılım", paraTl(b.otomKatilim)],
    ["İcra kesinti", paraTl(b.icraKesinti)],
    ["BES kesinti", paraTl(b.besKesinti)],
    ["Bankaya yatacak", paraTl(b.bankayaYatacak)],
    ["Elden ödenecek", paraTl(b.eldenOdenecek)],
  ];

  return (
    <div>
      <div className="mb-4 flex gap-2 print:hidden">
        <Link className="btn btn-ghost" href="/bordro">
          Geri
        </Link>
        <PrintButton />
      </div>
      <article className="sheet mx-auto max-w-xl rounded-2xl p-8">
        <p className="text-[0.7rem] font-bold tracking-[0.18em] text-brass uppercase">
          {ayar?.firmaAdi ?? "İK"} · ücret pusulası
        </p>
        <h1 className="mt-2 font-serif text-3xl">{adSoyad(b.personel)}</h1>
        <p className="mt-1 text-sm text-ink-soft/80">
          {b.personel.gorevYeri.ad} · {b.personel.gorevi} · {AYLAR[b.ay - 1]} {b.yil}
        </p>
        <p className="mt-1 text-sm">Hesap: {b.personel.hesapNo || "—"}</p>
        <table className="mt-6 w-full text-sm">
          <tbody>
            {satirlar.map(([k, v]) => (
              <tr key={k} className="border-b border-line">
                <td className="py-2 text-ink-soft/80">{k}</td>
                <td className="py-2 text-right font-semibold">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    </div>
  );
}
