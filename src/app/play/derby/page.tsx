import type { Metadata } from "next";
import DeadlineDerby from "@/components/games/derby/DeadlineDerby";
import Practice from "@/components/games/derby/Practice";
export const metadata: Metadata = {
  title: "Deadline Derby · Cosmogov",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export default async function DerbyJoin({
  searchParams,
}: {
  searchParams: Promise<{ room?: string; demo?: string }>;
}) {
  const q = await searchParams;
  return (
    <main id="main-content">
      {q.demo === "1" ? (
        <Practice />
      ) : (
        <DeadlineDerby host={false} initialCode={q.room || ""} />
      )}
    </main>
  );
}
