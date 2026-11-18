import DeadlineDerby from "@/components/games/derby/DeadlineDerby";
export default async function DerbyHost({
  searchParams,
}: {
  searchParams: Promise<{ room?: string }>;
}) {
  return <DeadlineDerby host initialCode={(await searchParams).room || ""} />;
}
