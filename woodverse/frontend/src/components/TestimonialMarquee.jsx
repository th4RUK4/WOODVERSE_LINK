import { useMemo } from "react";
import { TestimonialCard } from "./TestimonialCard";

const testimonials = [
  { initials: "AJ", name: "Amara Jayawardena", role: "Customer", quote: "WoodVerse made it easy to see whether my table was in stock or being made. The updates kept me confident throughout the order." },
  { initials: "HP", name: "Harini Perera", role: "Vendor", quote: "The production workflow gives my team a clear handoff from customer approval to workshop floor." },
  { initials: "SL", name: "Saman Loggers Ltd", role: "Supplier", quote: "We can finally see which materials are needed and respond to vendor requests without losing context." },
  { initials: "RK", name: "Ravi Kulasekara", role: "Customer", quote: "From ordering to delivery, the tracking was transparent. I knew exactly when my furniture would arrive." },
  { initials: "NP", name: "Nimali Peris", role: "Vendor", quote: "Managing quotations and orders in one place saved us hours every week. Highly recommended for small workshops." },
  { initials: "DT", name: "Dilan Thilakarathne", role: "Supplier", quote: "The supplier portal connects us directly to real demand. No more guessing what vendors need." },
];

export function TestimonialMarquee() {
  const doubled = useMemo(() => [...testimonials, ...testimonials], []);

  return (
    <section className="bg-[#edf3ee] py-20 dark:bg-[#14221d]">
      <div className="page-shell">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-extrabold sm:text-4xl">Trusted by woodcraft teams</h2>
          <p className="mt-3 text-[#5b6b64] dark:text-stone-300">Hear from the people who use WoodVerse every day.</p>
        </div>
        <div className="relative overflow-hidden">
          <div className="flex animate-marquee-slow">
            {doubled.map((item, index) => (
              <TestimonialCard key={index} {...item} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
