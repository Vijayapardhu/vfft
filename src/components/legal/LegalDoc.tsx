export function LegalDoc({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="text-4xl">{title}</h1>
      <p className="mb-6 mt-1 text-sm font-bold uppercase tracking-wide text-ink/50">
        Last updated: {updated}
      </p>
      <div className="space-y-6 font-medium leading-relaxed text-ink/80">
        {children}
      </div>
    </div>
  );
}

export function LegalSection({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-2 text-xl">{heading}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
