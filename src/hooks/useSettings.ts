"use client";

import { useMemo } from "react";
import { settingsDoc } from "@/firebase/collections";
import { isFirebaseConfigured } from "@/firebase/config";
import type { WebsiteSettings } from "@/types";
import { useDocumentData } from "./useFirestore";

export function useSettings() {
  const ref = useMemo(
    () => (isFirebaseConfigured ? settingsDoc() : null),
    [],
  );
  return useDocumentData<WebsiteSettings>(ref, []);
}
