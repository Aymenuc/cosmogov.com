import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function WorkspaceHeading({
  title,
  description,
  back,
  children,
}: {
  title: string;
  description: string;
  back?: { href: string; label: string };
  children?: ReactNode;
}) {
  return (
    <header className="workspace-heading">
      {back && (
        <Link href={back.href} className="workspace-back-link">
          <ArrowLeft size={16} aria-hidden="true" /> {back.label}
        </Link>
      )}
      <div className="app-page-heading">
        <div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        {children}
      </div>
    </header>
  );
}
