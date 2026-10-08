import { Star } from "lucide-react";

export function TestimonialCard({ initials, name, role, quote, rating = 5 }) {
  return (
    <article className="mx-4 w-[85vw] max-w-[360px] shrink-0 rounded-2xl border border-white/60 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5 sm:w-[70vw] sm:max-w-[400px] lg:w-[400px]">
      <div className="flex items-center gap-1 text-[#e0a45d]">
        {Array.from({ length: rating }).map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-current" />
        ))}
      </div>
      <p className="mt-4 leading-relaxed text-[#52625a] dark:text-stone-300">“{quote}”</p>
      <div className="mt-6 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-[#1c614f] text-xs font-extrabold text-white">
          {initials}
        </span>
        <span>
          <strong className="block text-sm">{name}</strong>
          <small className="text-xs text-[#718078]">{role}</small>
        </span>
      </div>
    </article>
  );
}
