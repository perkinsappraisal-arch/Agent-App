export default function Marquee({ items }) {
  const doubled = [...items, ...items];
  return (
    <div
      data-testid="editorial-marquee"
      className="overflow-hidden border-y border-hairline bg-surface/40"
    >
      <div className="flex whitespace-nowrap animate-marquee py-3 gap-12">
        {doubled.map((t, i) => (
          <span
            key={i}
            className="overline text-gold/80 flex items-center gap-3"
          >
            <span className="h-1 w-1 rounded-full bg-gold/60" />
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
