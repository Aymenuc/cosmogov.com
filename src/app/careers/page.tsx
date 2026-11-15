import type { Metadata } from "next";
import PublicPage from "@/components/PublicPage";
import StepArt from "@/components/landing/StepArt";

export const metadata: Metadata = {
  title: "Careers | Cosmogov",
  description: "View published job openings at Cosmogov.",
};

export default function CareersPage() {
  return (
    <PublicPage
      title="Careers"
      intro="There are no published openings at Cosmogov right now."
      theme="community"
      art={<span className="public-sticker"><StepArt name="goal" /></span>}
    />
  );
}
