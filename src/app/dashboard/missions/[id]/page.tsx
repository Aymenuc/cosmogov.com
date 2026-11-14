import MissionRoom from "@/components/missions/MissionRoom";
export default async function MissionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MissionRoom key={id} missionId={id} />;
}
