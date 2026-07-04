import { BUSINESS } from "@/lib/constants";

export function TopBar() {
  return (
    <div className="bg-primary px-4 py-2 text-center text-[0.8rem] text-white">
      📞 Order Now:{" "}
      <a href={`tel:${BUSINESS.phone}`} className="font-semibold text-yellow">
        {BUSINESS.phoneDisplay}
      </a>
      &nbsp;|&nbsp; Licensed Dealer — Mogai, Avadi, Tiruvallur
    </div>
  );
}
