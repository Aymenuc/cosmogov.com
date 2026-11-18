import type { Metadata } from "next";
import SparkCup from "@/components/games/spark/SparkCup";

export const metadata: Metadata = {
  title: "Join Spark Cup · Cosmogov",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export default async function JoinSpark({
  searchParams,
}: {
  searchParams: Promise<{ room?: string }>;
}) {
  return (
    <main id="main-content">
      <SparkCup host={false} initialCode={(await searchParams).room || ""} />
    </main>
  );
}
