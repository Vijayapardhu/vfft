"use client";

import { useMemo } from "react";
import { pageDoc } from "@/firebase/collections";
import { isFirebaseConfigured } from "@/firebase/config";
import type { PageContent } from "@/types";
import { useDocumentData } from "./useFirestore";

/** Read an admin-editable page (Rules, About, legal…) by slug. */
export function usePage(slug: string) {
  const ref = useMemo(
    () => (isFirebaseConfigured ? pageDoc(slug) : null),
    [slug],
  );
  return useDocumentData<PageContent>(ref, [slug]);
}
