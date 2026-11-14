import MissionRoom from "@/components/missions/MissionRoom";
import SiteHeader from "@/components/SiteHeader";
export const metadata = {
  title: "Try a community mission — Cosmogov",
  description:
    "Explore an interactive example of people and AI researching, planning, and building useful community tools together.",
};
export default function MissionDemoPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="mission-demo-page">
        <MissionRoom missionId="repair-cafe-demo" demo />
      </main>
    </>
  );
}
