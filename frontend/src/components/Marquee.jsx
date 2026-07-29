export default function Marquee({ items }) {
  const doubled = [...items, ...items];
  return (
    <div
      data-testid="editorial-marquee"
      className="overflow-hidden border-y border-hairline bg-butter"
    >
      <div className="flex whitespace-nowrap animate-marquee py-3 gap-12">
        {doubled.map((t, i) => (
          <span
            key={i}
            className="overline flex items-center gap-3"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-sage" />
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
