export type Vardiya = {
  giris: string;
  cikis: string;
  mola: number;
};

export function vardiyaAl(
  yer?: { varsayilanGiris?: string | null; varsayilanCikis?: string | null; molaSaat?: number | null } | null,
  ayar?: { varsayilanGiris?: string | null; varsayilanCikis?: string | null; molaSaat?: number | null } | null,
): Vardiya {
  return {
    giris: yer?.varsayilanGiris || ayar?.varsayilanGiris || "08:00",
    cikis: yer?.varsayilanCikis || ayar?.varsayilanCikis || "16:30",
    mola: yer?.molaSaat && yer.molaSaat > 0 ? yer.molaSaat : (ayar?.molaSaat ?? 1),
  };
}
