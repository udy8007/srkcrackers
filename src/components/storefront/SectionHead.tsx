export function SectionHead({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-8 text-center">
      <h3 className="font-display text-2xl font-bold text-primary sm:text-3xl">{title}</h3>
      {subtitle && <p className="mt-2 text-sm text-ink-muted">{subtitle}</p>}
    </div>
  );
}
