"use client";

import { useMemo } from "react";
import { galleryCol } from "@/firebase/collections";
import { isFirebaseConfigured } from "@/firebase/config";
import type { GalleryItem, GalleryType } from "@/types";
import { orderBy, query, where } from "firebase/firestore";
import { useCollectionData } from "./useFirestore";

export function useGalleryItems(type?: GalleryType | null) {
  const q = useMemo(() => {
    if (!isFirebaseConfigured) return null;
    const base = type ? query(galleryCol(), where("type", "==", type)) : galleryCol();
    return query(base, orderBy("uploadedAt", "desc"));
  }, [type]);
  return useCollectionData<GalleryItem>(q, [type]);
}
