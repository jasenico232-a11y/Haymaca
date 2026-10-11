import { notFound } from "next/navigation";

// Any path under a locale that no route claims lands here, so it renders the
// localized not-found page inside the site layout instead of the bare default.
export const dynamicParams = true;

export default function CatchAll() {
  notFound();
}
