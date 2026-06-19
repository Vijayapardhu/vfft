import { orderBy, query, where } from "firebase/firestore";
import { marqueeCol, newsCol, sponsorsCol } from "@/firebase/collections";

export function publishedNewsQuery() {
  // Composite index not guaranteed — filter only, sort client-side in useNews()
  return query(newsCol(), where("isPublished", "==", true));
}

export function newsBySlugQuery(slug: string) {
  return query(newsCol(), where("slug", "==", slug));
}

export function allNewsQuery() {
  return query(newsCol(), orderBy("createdAt", "desc"));
}

export function activeSponsorsQuery() {
  return query(
    sponsorsCol(),
    where("isActive", "==", true),
    orderBy("priority", "asc"),
  );
}

export function allSponsorsQuery() {
  return query(sponsorsCol(), orderBy("priority", "asc"));
}

export function activeMarqueeQuery() {
  return query(
    marqueeCol(),
    where("isActive", "==", true),
    orderBy("order", "asc"),
  );
}

export function allMarqueeQuery() {
  return query(marqueeCol(), orderBy("order", "asc"));
}
