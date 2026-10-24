"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Özet", roller: ["ADMIN", "MUHASEBE", "SAHA"] },
  { href: "/personel", label: "Personel", roller: ["ADMIN", "MUHASEBE", "SAHA"] },
  { href: "/puantaj", label: "Puantaj", oncelik: true, roller: ["ADMIN", "MUHASEBE", "SAHA"] },
  { href: "/giris-cikis", label: "Giriş-çıkış", roller: ["ADMIN", "MUHASEBE", "SAHA"] },
  { href: "/bordro", label: "Bordro", roller: ["ADMIN", "MUHASEBE"] },
  { href: "/kasa", label: "Elden kasa", roller: ["ADMIN", "MUHASEBE"] },
  { href: "/avans", label: "Avans", roller: ["ADMIN", "MUHASEBE"] },
  { href: "/izin", label: "Yıllık izin", roller: ["ADMIN", "MUHASEBE", "SAHA"] },
  { href: "/icra", label: "İcra", roller: ["ADMIN", "MUHASEBE"] },
  { href: "/mazeret", label: "Mazeret / Rapor", roller: ["ADMIN", "MUHASEBE", "SAHA"] },
  { href: "/raporlar", label: "Excel raporlar", roller: ["ADMIN", "MUHASEBE"] },
  { href: "/ayarlar", label: "Ayarlar", roller: ["ADMIN", "MUHASEBE"] },
];

export function Nav({ rol }: { rol: string }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {LINKS.filter((l) => l.roller.includes(rol)).map((l) => {
        const aktif = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-[0.92rem] transition ${
              aktif ? "bg-white/10 text-brass-2" : "text-white/75 hover:bg-white/5 hover:text-white"
            }`}
          >
            <span>{l.label}</span>
            {l.oncelik ? (
              <span className="rounded-full bg-brass px-2 py-0.5 text-[0.62rem] font-bold tracking-wide text-ink">
                ÖNCELİK
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
