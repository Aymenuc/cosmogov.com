import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import PublicPage from "@/components/PublicPage";
import CommonsStreet from "@/components/landing/CommonsStreet";
import { posts } from "./posts";

export const metadata: Metadata = {
  title: "Journal | Cosmogov",
  description: "Examples and practical guidance for communities working together in Cosmogov.",
};

export default function BlogPage() {
  const [featured, ...archive] = posts;

  return (
    <PublicPage
      title="Journal"
      intro="Examples and practical guidance for gathering input, making decisions, and getting things done together."
      theme="journal"
    >
      <div className="public-stack">
        <article className="public-card public-journal-cover">
          <div>
            <div className="public-meta">
              <time dateTime={featured.date}>{featured.dateLabel}</time>
            </div>
            <h2>{featured.title}</h2>
            <p>{featured.summary}</p>
            <a href={`/blog/${featured.slug}`} className="public-link">
              Read the story <ArrowUpRight size={17} aria-hidden="true" />
            </a>
          </div>
          <CommonsStreet />
        </article>
        <div className="public-reading public-journal-archive">
          {archive.map((post) => (
            <article key={post.slug}>
              <div className="public-meta">
                {post.updated ? (
                  <>Updated <time dateTime={post.updated.date}>{post.updated.label}</time></>
                ) : (
                  <time dateTime={post.date}>{post.dateLabel}</time>
                )}
              </div>
              <h2>
                <a href={`/blog/${post.slug}`} className="public-link">
                  {post.title} <ArrowUpRight size={16} aria-hidden="true" />
                </a>
              </h2>
              <p>{post.summary}</p>
            </article>
          ))}
        </div>
      </div>
    </PublicPage>
  );
}
