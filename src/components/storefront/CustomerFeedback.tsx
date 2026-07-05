import { BUSINESS, CUSTOMER_FEEDBACK } from "@/lib/constants";
import { SectionHead } from "./SectionHead";
import { SectionDecor } from "./FestiveDecor";

function Stars({ count }: { count: number }) {
  return (
    <span className="text-yellow" aria-label={`${count} out of 5 stars`}>
      {"★".repeat(count)}
      <span className="text-line">{"★".repeat(5 - count)}</span>
    </span>
  );
}

export function CustomerFeedback() {
  return (
    <section id="reviews" className="relative isolate overflow-hidden bg-brandbg px-4 py-14">
      <SectionDecor variant="sparklers" />
      <div className="mx-auto max-w-6xl">
        <SectionHead
          title="Customer Feedback"
          subtitle={`Trusted by families across Chennai for ${BUSINESS.yearsExperience}+ years — see what our customers say`}
        />
        <div className="mb-8 flex flex-wrap items-center justify-center gap-4 rounded-xl border border-line bg-white px-5 py-4 text-center shadow-sm">
          <div>
            <p className="font-display text-3xl font-extrabold text-primary">
              {BUSINESS.yearsExperience}+
            </p>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Years Experience
            </p>
          </div>
          <div className="hidden h-10 w-px bg-line sm:block" />
          <div>
            <p className="font-display text-3xl font-extrabold text-primary">4.9/5</p>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Customer Rating
            </p>
          </div>
          <div className="hidden h-10 w-px bg-line sm:block" />
          <div>
            <p className="font-display text-3xl font-extrabold text-primary">1000+</p>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Happy Orders
            </p>
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CUSTOMER_FEEDBACK.map((item) => (
            <article
              key={`${item.name}-${item.date}`}
              className="flex flex-col rounded-xl border border-line bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <Stars count={item.rating} />
              <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-muted">
                &ldquo;{item.text}&rdquo;
              </p>
              <div className="mt-4 border-t border-line pt-3">
                <p className="text-sm font-bold text-ink">{item.name}</p>
                <p className="text-xs text-ink-muted">
                  {item.location} · {item.date}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
