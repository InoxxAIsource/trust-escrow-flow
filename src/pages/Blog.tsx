import { Link } from "react-router-dom";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Breadcrumbs from "@/components/Breadcrumbs";
import SEOHead from "@/components/SEOHead";
import { blogPosts } from "@/data/blog-posts";

const Blog = () => (
  <>
    <SEOHead title="TrustP2P Blog — Crypto Trading Guides & News" description="Learn about P2P crypto trading, escrow protection, and how to buy and sell cryptocurrency safely. Guides, tips, and industry insights." canonical="https://p2pxbt.com/blog" />

    <div className="container py-12">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Blog", href: "/blog" }]} />

      <div className="text-center mb-12">
        <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground">TrustP2P Blog</h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">Guides, tips, and insights for safe P2P crypto trading.</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {blogPosts.map((post) => (
          <Link key={post.slug} to={`/blog/${post.slug}`}>
            <Card className="h-full hover:shadow-md transition-shadow group">
              <CardContent className="pt-6">
                <Badge variant="secondary" className="mb-3">{post.category}</Badge>
                <h2 className="font-display font-semibold text-foreground group-hover:text-primary transition-colors mb-2">{post.title}</h2>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{post.excerpt}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {post.date}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {post.readTime}</span>
                </div>
                <div className="mt-3 text-sm font-medium text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                  Read more <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  </>
);

export default Blog;
