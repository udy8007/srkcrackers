import { SectionHead } from "./SectionHead";
import { BUSINESS, LICENSE_INFO } from "@/lib/constants";

const INFO_ROWS: { label: string; value: string }[] = [
  { label: "Name of Licence", value: LICENSE_INFO.name },
  { label: "Licence No", value: LICENSE_INFO.licenceNo },
  { label: "Door No", value: LICENSE_INFO.doorNo },
  { label: "Nagar / Street", value: LICENSE_INFO.nagar },
  { label: "Village", value: LICENSE_INFO.village },
  { label: "Taluk", value: LICENSE_INFO.taluk },
  { label: "District", value: LICENSE_INFO.district },
  { label: "Pincode", value: LICENSE_INFO.pincode },
  { label: "Issued On", value: LICENSE_INFO.issuedOn },
  { label: "Valid Up To", value: LICENSE_INFO.validUpTo },
  { label: "Capacity", value: LICENSE_INFO.capacity },
  { label: "Working", value: LICENSE_INFO.working },
];

export function LicenseInfo() {
  return (
    <section id="about" className="bg-brandbg px-4 py-14">
      <div className="mx-auto max-w-4xl">
        <SectionHead title="Licensed Dealer Information" subtitle="Government approved fireworks retailer" />
        <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
          <div className="flex items-center gap-4 bg-gradient-to-r from-primary to-primary-dark p-6 text-white">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/15 text-3xl">
              🏛️
            </span>
            <div>
              <h4 className="font-display text-xl font-bold">{LICENSE_INFO.name}</h4>
              <p className="text-sm text-white/90">{BUSINESS.addressLine}</p>
            </div>
          </div>

          <div className="grid gap-px bg-line sm:grid-cols-2">
            {INFO_ROWS.map((row) => (
              <div key={row.label} className="flex flex-col gap-0.5 bg-white p-4">
                <span className="text-[0.7rem] font-semibold uppercase tracking-wide text-ink-muted">
                  {row.label}
                </span>
                <span className="text-sm font-medium text-ink">{row.value}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-line bg-yellow/10 px-6 py-4 text-center text-sm text-ink">
            ⚠️ Fireworks for adult use only. Burst in open areas. Follow all safety guidelines.
          </div>
          <div className="bg-primary px-6 py-4 text-center text-white">
            📞 Call to Order:{" "}
            <a href={`tel:${BUSINESS.phone}`} className="font-bold text-yellow">
              {BUSINESS.phoneDisplay}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
