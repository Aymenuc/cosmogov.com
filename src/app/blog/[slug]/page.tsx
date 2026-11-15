import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import PublicPage from "@/components/PublicPage";
import { posts } from "../posts";

type ArticleProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return posts.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: ArticleProps): Promise<Metadata> {
  const { slug } = await params;
  const post = posts.find((article) => article.slug === slug);
  return post
    ? { title: `${post.title} | Cosmogov`, description: post.summary }
    : {};
}

export default async function ArticlePage({ params }: ArticleProps) {
  const { slug } = await params;
  const post = posts.find((article) => article.slug === slug);
  if (!post) notFound();

  return (
    <PublicPage
      title={post.title}
      intro={post.summary}
      back={{ href: "/blog", label: "Journal" }}
      meta={
        <>
          <time dateTime={post.date}>{post.dateLabel}</time>
          {post.updated && (
            <> · Updated <time dateTime={post.updated.date}>{post.updated.label}</time></>
          )}
        </>
      }
    >
      <article className="public-reading public-article">
        {post.sections.map((section) => (
          <section key={section.heading}>
            <h2>{section.heading}</h2>
            {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </section>
        ))}
        <div className="public-card public-feature">
          <h2>See how a mission works</h2>
          <p>Try the repair café example or open the guides to start your own.</p>
          <p><Link href="/missions/demo">Explore the example</Link> · <Link href="/docs">Read the documentation</Link></p>
        </div>
      </article>
    </PublicPage>
  );
}
