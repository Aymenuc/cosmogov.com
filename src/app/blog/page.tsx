import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import PublicPage from "@/components/PublicPage";
import { posts } from "./posts";

export const metadata: Metadata = {
  title: "Journal | Cosmogov",
  description: "Examples and practical guidance for communities working together in Cosmogov.",
};

export default function BlogPage() {
  return (
    <PublicPage
      title="Journal"
      intro="Examples and practical guidance for gathering input, making decisions, and getting things done together."
    >
      <div className="public-stack">
        {posts.map((post, index) => (
          <article className={index === 0 ? "public-card public-feature" : "public-card"} key={post.slug}>
            <div className="public-meta">
              {post.updated ? (
                <>Updated <time dateTime={post.updated.date}>{post.updated.label}</time></>
              ) : (
                <time dateTime={post.date}>{post.dateLabel}</time>
              )}
            </div>
            <h2>
              <Link href={`/blog/${post.slug}`} className="public-link">
                {post.title} <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            </h2>
            <p>{post.summary}</p>
          </article>
        ))}
      </div>
    </PublicPage>
  );
}
