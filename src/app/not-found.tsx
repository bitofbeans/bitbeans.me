import { type Metadata } from "next";
import { NotFoundScene } from "~/components/not-found-scene";

export const metadata: Metadata = {
  title: "404",
  description: "Page not found on bitbeans.me.",
};

export default function NotFound() {
  return <NotFoundScene />;
}
