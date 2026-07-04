import { SectionHead } from "./SectionHead";

const STEPS = [
  { num: 1, title: "Select Products", desc: "Open category · add quantity · check total in bottom bar" },
  { num: 2, title: "Your Details", desc: "Fill name, phone, address when you click Place Order" },
  { num: 3, title: "Pay via GPay", desc: "Scan QR code · pay exact amount shown" },
  { num: 4, title: "Share Screenshot", desc: "Upload payment screenshot · share on WhatsApp · track order status" },
];

export function HowToOrder() {
  return (
    <section id="how" className="bg-white px-4 py-14">
      <div className="mx-auto max-w-6xl">
        <SectionHead title="How to Order" subtitle="Simple 4-step ordering process" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <div
              key={step.num}
              className="rounded-xl border border-line bg-brandbg p-6 text-center transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-white">
                {step.num}
              </div>
              <h4 className="mt-4 font-display text-lg font-semibold text-ink">{step.title}</h4>
              <p className="mt-2 text-sm text-ink-muted">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
