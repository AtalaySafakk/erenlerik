import Link from "next/link";
import { PageHead } from "@/components/page-head";
import { prisma } from "@/lib/prisma";
import { AYLAR, paraTl } from "@/lib/format";
import { muhasebeMi, oturumGetir } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const simdi = new Date();
  const yil = simdi.getFullYear();
  const ay = simdi.getMonth() + 1;

  const oturum = await oturumGetir();
  const [personelSayisi, icraSayisi, puantajSayisi, bordrolar, ayar] = await Promise.all([
    prisma.personel.count({ where: { durum: { not: "PASIF" } } }),
    prisma.icra.count({ where: { aktif: true } }),
    prisma.puantaj.count({ where: { yil, ay } }),
    prisma.bordro.findMany({ where: { yil, ay } }),
    prisma.ayar.findUnique({ where: { id: 1 } }),
  ]);

  const personeller = await prisma.personel.findMany({
    include: { izinler: true, puantajlar: { where: { yil, ay }, include: { gunler: true } } },
  });
  const kalanIzin = personeller.reduce((t, p) => {
    const kullanilan = p.izinler
      .filter((i) => i.tip === "YILLIK" && i.durum === "ONAYLANDI")
      .reduce((x, i) => x + i.gun, 0);
    return t + Math.max(0, p.yillikIzinHakki - kullanilan);
  }, 0);

  const bankaya = bordrolar.reduce((t, b) => t + b.bankayaYatacak, 0);
  const elden = bordrolar.reduce((t, b) => t + b.eldenOdenecek, 0);
  const bugun = simdi.toISOString().slice(0, 10);
  const sinir = new Date(simdi);
  sinir.setDate(sinir.getDate() + 30);
  const sinirStr = sinir.toISOString().slice(0, 10);
  const alarmlar = personeller
    .filter((p) => p.durum !== "PASIF")
    .flatMap((p) => {
      const liste: string[] = [];
      if (p.denemeBitis && p.denemeBitis >= bugun && p.denemeBitis <= sinirStr) {
        liste.push(`${p.adi} ${p.soyadi} · deneme ${p.denemeBitis}`);
      }
      if (p.sozlesmeBitis && p.sozlesmeBitis >= bugun && p.sozlesmeBitis <= sinirStr) {
        liste.push(`${p.adi} ${p.soyadi} · sözleşme ${p.sozlesmeBitis}`);
      }
      const eksikSaat = (p.puantajlar[0]?.gunler ?? []).filter((g) => g.kod === "C" && (!g.giris || !g.cikis));
      if (eksikSaat.length) liste.push(`${p.adi} ${p.soyadi} · ${eksikSaat.length} gün eksik giriş-çıkış`);
      return liste;
    });

  return (
    <div>
      <PageHead
        kicker="Özet"
        title="Personel defteri"
        desc="Görev yeri esaslı puantaj, yıllık izin, icra ve mazeret/rapor takibi. Resmi bodro bankaya, fark ve fazla mesai elden."
      />
      {alarmlar.length ? (
        <div className="sheet mb-5 rounded-2xl p-4">
          <p className="mb-2 text-xs font-bold tracking-[0.14em] text-brass uppercase">Alarmlar (30 gün)</p>
          <ul className="space-y-1 text-sm">
            {alarmlar.slice(0, 8).map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Kart etiket="Aktif personel" deger={String(personelSayisi)} />
        <Kart etiket={`${AYLAR[ay - 1]} puantaj`} deger={String(puantajSayisi)} />
        <Kart etiket="Açık icra" deger={String(icraSayisi)} />
        <Kart etiket="Kalan izin günü" deger={String(kalanIzin)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="sheet rounded-2xl p-5 lg:col-span-2">
          <h2 className="font-serif text-2xl">Bu ay ödeme özeti</h2>
          <p className="mt-1 text-sm text-ink-soft/70">
            {AYLAR[ay - 1]} {yil} · resmi taban {paraTl(ayar?.resmiUcret ?? 28075.5)} · 180 saat üzeri mesai
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-paper p-4">
              <p className="text-xs font-bold tracking-[0.14em] text-ink-soft uppercase">Bankaya yatacak</p>
              <p className="mt-2 font-serif text-3xl">{paraTl(bankaya)}</p>
            </div>
            <div className="rounded-xl bg-paper p-4">
              <p className="text-xs font-bold tracking-[0.14em] text-ink-soft uppercase">Elden ödenecek</p>
              <p className="mt-2 font-serif text-3xl">{paraTl(elden)}</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-ink-soft/80">
            Örnek: net 40.000, resmi 30.000. Bankaya 30.000. Elden 10.000 + (15 saat × 30.000 / 180 × 1,5).
          </p>
        </section>

        <section className="sheet rounded-2xl p-5">
          <h2 className="font-serif text-2xl">Hızlı iş</h2>
          <div className="mt-4 flex flex-col gap-2">
            <Link className="btn btn-brass" href="/puantaj">
              Puantajı aç
            </Link>
            <Link className="btn btn-ghost" href="/giris-cikis">
              Giriş-çıkış
            </Link>
            {muhasebeMi(oturum?.rol) ? (
              <>
                <Link className="btn btn-primary" href="/bordro">
                  Bordro hesapla
                </Link>
                <Link className="btn btn-ghost" href="/kasa">
                  Elden kasa
                </Link>
                <Link className="btn btn-ghost" href="/avans">
                  Avans
                </Link>
                <Link className="btn btn-ghost" href="/raporlar">
                  Excel raporlar
                </Link>
              </>
            ) : null}
            <Link className="btn btn-ghost" href="/personel/yeni">
              Yeni personel
            </Link>
            <Link className="btn btn-ghost" href="/personel/ice-aktar">
              Excel içe aktar
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

function Kart({ etiket, deger }: { etiket: string; deger: string }) {
  return (
    <div className="sheet rounded-2xl p-5">
      <p className="text-xs font-bold tracking-[0.14em] text-ink-soft uppercase">{etiket}</p>
      <p className="mt-2 font-serif text-4xl">{deger}</p>
    </div>
  );
}
