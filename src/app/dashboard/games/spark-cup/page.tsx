import SparkCup from "@/components/games/spark/SparkCup";

export default async function HostSpark({
  searchParams,
}: {
  searchParams: Promise<{ room?: string }>;
}) {
  return <SparkCup host initialCode={(await searchParams).room || ""} />;
}
