"use client";

import { useMemo } from "react";
import { isFirebaseConfigured } from "@/firebase/config";
import { newsDoc } from "@/firebase/collections";
import {
  allNewsQuery,
  newsBySlugQuery,
  publishedNewsQuery,
} from "@/services/contentService";
import type { NewsArticle } from "@/types";
import { useCollectionData, useDocumentData } from "./useFirestore";

export function useNews() {
  const q = useMemo(
    () => (isFirebaseConfigured ? publishedNewsQuery() : null),
    [],
  );
  return useCollectionData<NewsArticle>(q, []);
}

export function useAllNews() {
  const q = useMemo(
    () => (isFirebaseConfigured ? allNewsQuery() : null),
    [],
  );
  return useCollectionData<NewsArticle>(q, []);
}

export function useNewsArticle(slug: string | null) {
  const q = useMemo(
    () => (isFirebaseConfigured && slug ? newsBySlugQuery(slug) : null),
    [slug],
  );
  const { data, loading, error } = useCollectionData<NewsArticle>(q, [slug]);
  return { data: data[0] ?? null, loading, error };
}

export function useNewsArticleById(id: string | null) {
  const ref = useMemo(
    () => (isFirebaseConfigured && id ? newsDoc(id) : null),
    [id],
  );
  return useDocumentData<NewsArticle>(ref, [id]);
}
