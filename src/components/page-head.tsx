export function PageHead({
  kicker,
  title,
  desc,
  actions,
}: {
  kicker?: string;
  title: string;
  desc?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {kicker ? (
          <p className="mb-1 text-[0.7rem] font-bold tracking-[0.18em] text-brass uppercase">
            {kicker}
          </p>
        ) : null}
        <h1 className="font-serif text-4xl tracking-tight text-ink">{title}</h1>
        {desc ? <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft/80">{desc}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
