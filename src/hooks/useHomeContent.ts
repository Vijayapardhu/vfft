"use client";

import { useMemo } from "react";
import { homeContentDoc } from "@/firebase/collections";
import { isFirebaseConfigured } from "@/firebase/config";
import type { HomeContent } from "@/types";
import { useDocumentData } from "./useFirestore";

export function useHomeContent() {
  const ref = useMemo(
    () => (isFirebaseConfigured ? homeContentDoc() : null),
    [],
  );
  return useDocumentData<HomeContent>(ref, []);
}
