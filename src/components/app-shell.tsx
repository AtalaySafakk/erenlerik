import { Nav } from "./nav";
import { cikisYap } from "@/lib/actions";
import type { Oturum } from "@/lib/auth";
import { redirect } from "next/navigation";

export function AppShell({
  children,
  oturum,
}: {
  children: React.ReactNode;
  oturum: Oturum;
}) {
  async function cikis() {
    "use server";
    await cikisYap();
    redirect("/oturum");
  }

  return (
    <div className="ledger flex min-h-full w-full">
      <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col bg-ink px-4 py-6 text-cream">
        <div className="mb-8 px-2">
          <p className="font-serif text-3xl leading-none tracking-tight">Puantaj</p>
          <p className="mt-2 text-[0.7rem] font-semibold tracking-[0.22em] text-brass-2 uppercase">
            İK · Bordro
          </p>
        </div>
        <Nav rol={oturum.rol} />
        <form action={cikis} className="mt-auto px-2">
          <p className="text-[0.75rem] text-white/55">{oturum.ad}</p>
          <p className="text-[0.65rem] tracking-wide text-white/35 uppercase">{oturum.rol}</p>
          <button className="mt-3 text-left text-[0.75rem] text-brass-2 underline" type="submit">
            Çıkış
          </button>
        </form>
      </aside>
      <main className="min-w-0 flex-1 px-8 py-8">{children}</main>
    </div>
  );
}
