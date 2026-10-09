import Image from "next/image";
import Link from "next/link";

export default function Logo({
  compact = false,
  tone = "dark",
}: {
  compact?: boolean;
  tone?: "dark" | "light";
}) {
  return (
    <Link href="/" className="group flex w-fit items-center gap-2.5">
      <span className="transition duration-300 group-hover:rotate-6 group-hover:scale-105">
        <Image
          src="/assets/images/logo.png"
          alt="NextStep logo"
          width={36}
          height={36}
          className="h-9 w-9 rounded-xl shadow-sm"
          priority
        />
      </span>
      {!compact && (
        <span
          className={`text-lg font-bold tracking-tight transition ${
            tone === "light" ? "text-white" : "text-slate-900"
          }`}
        >
          NextStep
        </span>
      )}
    </Link>
  );
}
