"use client";
import { useEffect, useState } from "react";
import { ArrowUpRight, BookOpen } from "lucide-react";
export type SavedTemplate = {
  id: string;
  name: string;
  goal: string;
  authorName: string;
  organizationId: string | null;
  organization?: { name: string } | null;
};
export default function TemplateGallery({
  onChoose,
}: {
  onChoose: (template: SavedTemplate) => void;
}) {
  const [templates, setTemplates] = useState<SavedTemplate[]>([]),
    [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/mission-templates", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setTemplates(Array.isArray(data) ? data : []);
      })
      .catch((error) => setError(error.message));
  }, []);
  return (
    <section className="mission-template-gallery">
      <div className="mission-panel-heading">
        <div>
          <div className="eyebrow">A GOOD IDEA CAN TRAVEL</div>
          <h2>Start with something your people made.</h2>
          <p>
            Saved plans and forms, credited to their authors. Review and adapt
            every draft for your new mission.
          </p>
        </div>
        <BookOpen size={25} />
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="mission-list-grid">
        {templates.map((template) => (
          <article className="mission-template-card" key={template.id}>
            <span>{template.organization?.name || "Personal template"}</span>
            <h3>{template.name}</h3>
            <p>{template.goal}</p>
            <small>Shared by {template.authorName}</small>
            <button
              className="civic-button outline"
              onClick={() => onChoose(template)}
            >
              Start from this <ArrowUpRight size={15} />
            </button>
          </article>
        ))}
      </div>
      {!templates.length && !error ? (
        <div className="template-empty">
          <strong>No saved templates yet</strong>
          <p>
            When a plan or form works well, save it from its mission so other
            groups can start from it. Responses and source excerpts are never copied.
          </p>
        </div>
      ) : (
        <p className="mission-small">
          Showing up to 50 templates you can access.
        </p>
      )}
    </section>
  );
}
