import { type Metadata } from "next";
import { NotFoundScene } from "./not-found-scene";

export const metadata: Metadata = {
  title: "404",
  description: "Signal lost — route not found on bitbeans.me.",
};

export default function NotFound() {
  return <NotFoundScene />;
}
