import { PortfolioScene } from "~/components/portfolio-scene";
import { getBlogPosts } from "~/lib/blog";

export default async function HomePage() {
  const blogPosts = await getBlogPosts();
  return <PortfolioScene blogPosts={blogPosts} />;
}
