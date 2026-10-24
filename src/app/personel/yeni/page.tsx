import { PersonelForm } from "@/components/personel-form";
import { PageHead } from "@/components/page-head";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function YeniPersonelPage() {
  const gorevYerleri = await prisma.gorevYeri.findMany({ orderBy: { ad: "asc" } });
  return (
    <div>
      <PageHead kicker="Kadro" title="Yeni personel" desc="Excel kolonlarıyla aynı kart." />
      <PersonelForm gorevYerleri={gorevYerleri} />
    </div>
  );
}
