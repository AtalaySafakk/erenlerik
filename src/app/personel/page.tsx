import Link from "next/link";
import { PageHead } from "@/components/page-head";
import { PersonelListesi } from "@/components/personel-listesi";
import { prisma } from "@/lib/prisma";
import { adSoyad, durumEtiket, paraTl } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PersonelPage() {
  const liste = await prisma.personel.findMany({
    include: { gorevYeri: true, izinler: true, icralar: true },
    orderBy: [{ durum: "asc" }, { adi: "asc" }],
  });

  const satirlar = liste.map((p) => {
    const kullanilan = p.izinler
      .filter((i) => i.tip === "YILLIK" && i.durum === "ONAYLANDI")
      .reduce((t, i) => t + i.gun, 0);
    return {
      id: p.id,
      ad: adSoyad(p),
      yer: p.gorevYeri.ad,
      gorevi: p.gorevi,
      gsm: p.gsm,
      maas: paraTl(p.netMaas),
      resmi: paraTl(p.resmiMaas),
      bes: p.besDurum === "VAR",
      icra: p.icralar.some((i) => i.aktif),
      izin: `${p.yillikIzinHakki - kullanilan} / ${p.yillikIzinHakki}`,
      durum: durumEtiket(p.durum),
      pasif: p.durum === "PASIF",
    };
  });

  return (
    <div>
      <PageHead
        kicker="Kadro"
        title="Personel"
        desc="Excel’deki personel kartı alanları. Puantaj, izin ve bordro bu tabloya bağlı çalışır."
        actions={
          <>
            <Link className="btn btn-ghost" href="/personel/ice-aktar">
              Excel içe aktar
            </Link>
            <Link className="btn btn-primary" href="/personel/yeni">
              Yeni personel
            </Link>
          </>
        }
      />
      <PersonelListesi satirlar={satirlar} />
    </div>
  );
}
