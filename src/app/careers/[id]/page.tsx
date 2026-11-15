import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import PublicPage from "@/components/PublicPage";
import { areas } from "../areas";

type AreaProps = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return areas.map(({ id }) => ({ id }));
}

export async function generateMetadata({ params }: AreaProps): Promise<Metadata> {
  const { id } = await params;
  const area = areas.find((item) => item.id === id);
  return area
    ? { title: `${area.title} | Cosmogov`, description: area.description }
    : {};
}

export default async function CareerAreaPage({ params }: AreaProps) {
  const { id } = await params;
  const area = areas.find((item) => item.id === id);
  if (!area) notFound();

  return (
    <PublicPage
      title={area.title}
      intro={area.description}
      back={{ href: "/careers", label: "Careers" }}
    >
      <section className="public-card">
        <h2>What the work involves</h2>
        <p>{area.details}</p>
        <Link href="/contact?topic=careers" className="public-link">
          Ask about opportunities <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </section>
    </PublicPage>
  );
}
