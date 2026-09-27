import Link from "next/link";

const LETTERS = [
  { char: "J", className: "text-brand-blue" },
  { char: "e", className: "text-brand-red" },
  { char: "v", className: "text-brand-yellow" },
];

export function Logo({ size }: { size: "large" | "small" }) {
  return (
    <Link
      href="/"
      aria-label="Jev Search home"
      className={`font-semibold tracking-tight select-none ${
        size === "large" ? "text-7xl sm:text-8xl" : "text-3xl"
      }`}
    >
      {LETTERS.map(({ char, className }) => (
        <span key={char} className={className}>
          {char}
        </span>
      ))}
    </Link>
  );
}
