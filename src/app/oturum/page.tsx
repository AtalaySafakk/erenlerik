import { girisYap } from "@/lib/actions";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function OturumPage({
  searchParams,
}: {
  searchParams: Promise<{ sonra?: string; hata?: string }>;
}) {
  const q = await searchParams;

  async function gir(formData: FormData) {
    "use server";
    const sonuc = await girisYap(formData);
    if (!sonuc.ok) redirect("/oturum?hata=1");
    const sonra = String(formData.get("sonra") ?? "").trim();
    redirect(sonra.startsWith("/") ? sonra : "/");
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-paper px-4">
      <form action={gir} className="sheet w-full max-w-md rounded-2xl p-8">
        <p className="text-[0.7rem] font-bold tracking-[0.18em] text-brass uppercase">İK Program</p>
        <h1 className="mt-2 font-serif text-4xl">Giriş</h1>
        <p className="mt-2 text-sm text-ink-soft/75">
          muhasebe / 1234 · saha / 1234
        </p>
        {q.hata ? <p className="mt-3 text-sm text-[#8a2e22]">Kullanıcı veya şifre hatalı.</p> : null}
        <input type="hidden" name="sonra" value={q.sonra ?? "/"} />
        <div className="mt-6 grid gap-3">
          <label className="field">
            <span>Kullanıcı</span>
            <input name="kullaniciAdi" autoComplete="username" required />
          </label>
          <label className="field">
            <span>Şifre</span>
            <input name="sifre" type="password" autoComplete="current-password" required />
          </label>
          <button className="btn btn-primary" type="submit">
            Giriş yap
          </button>
        </div>
      </form>
    </div>
  );
}
