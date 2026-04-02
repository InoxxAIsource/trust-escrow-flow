import { useParams, Link } from "react-router-dom";
import { Calendar, Clock, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Breadcrumbs from "@/components/Breadcrumbs";
import SEOHead from "@/components/SEOHead";
import { blogPosts } from "@/data/blog-posts";

const BlogPost = () => {
  const { slug } = useParams();
  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) {
    return (
      <div className="container py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-foreground mb-4">Post Not Found</h1>
        <Button asChild><Link to="/blog">Back to Blog</Link></Button>
      </div>
    );
  }

  return (
    <>
      <SEOHead title={post.metaTitle} description={post.metaDescription} canonical={`https://buysusdtp2p.com/blog/${post.slug}`} />

      <div className="container py-12">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Blog", href: "/blog" }, { label: post.title, href: `/blog/${post.slug}` }]} />

        <article className="max-w-3xl mx-auto">
          <Button variant="ghost" size="sm" className="mb-6" asChild>
            <Link to="/blog"><ArrowLeft className="h-4 w-4 mr-1" /> Back to Blog</Link>
          </Button>

          <Badge variant="secondary" className="mb-3">{post.category}</Badge>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">{post.title}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8">
            <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {post.date}</span>
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {post.readTime}</span>
          </div>

          <div className="prose prose-sm max-w-none text-foreground
            [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-3
            [&_h3]:font-display [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2
            [&_p]:text-muted-foreground [&_p]:mb-4 [&_p]:leading-relaxed
            [&_ul]:text-muted-foreground [&_ul]:space-y-1 [&_ul]:mb-4
            [&_ol]:text-muted-foreground [&_ol]:space-y-1 [&_ol]:mb-4
            [&_li]:text-muted-foreground
            [&_strong]:text-foreground
          ">
            {post.content.split("\n").map((line, i) => {
              if (line.startsWith("## ")) return <h2 key={i}>{line.replace("## ", "")}</h2>;
              if (line.startsWith("### ")) return <h3 key={i}>{line.replace("### ", "")}</h3>;
              if (line.startsWith("- **")) {
                const match = line.match(/- \*\*(.+?)\*\*\s*[—–-]\s*(.*)/);
                if (match) return <li key={i}><strong>{match[1]}</strong> — {match[2]}</li>;
              }
              if (line.startsWith("- ")) return <li key={i}>{line.replace("- ", "")}</li>;
              if (line.match(/^\d+\. /)) return <li key={i}>{line.replace(/^\d+\. /, "")}</li>;
              if (line.trim() === "") return null;
              return <p key={i}>{line}</p>;
            })}
          </div>

          {/* Related Links */}
          {post.relatedLinks.length > 0 && (
            <Card className="mt-10">
              <CardContent className="py-6">
                <h3 className="font-display font-semibold text-foreground mb-3">Related Reading</h3>
                <div className="flex flex-wrap gap-2">
                  {post.relatedLinks.map((link) => (
                    <Button key={link.href} variant="outline" size="sm" asChild>
                      <Link to={link.href}>{link.label}</Link>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </article>
      </div>
    </>
  );
};

export default BlogPost;
