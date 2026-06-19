import "server-only";
import { adminDb, adminRtdb } from "./firebaseAdmin";

export async function syncHomeContentToRTDB(): Promise<void> {
  const homeDoc = await adminDb().collection("homeContent").doc("site").get();
  if (!homeDoc.exists) return;
  const data = homeDoc.data()!;
  await adminRtdb().ref("featuredContent").set({
    heroTitle: data.heroTitle ?? "",
    heroSubtitle: data.heroSubtitle ?? "",
    heroImage: data.heroImage ?? "",
    featuredMatchId: data.featuredMatchId ?? null,
    featuredPlayerIds: data.featuredPlayerIds ?? [],
    featuredTeamIds: data.featuredTeamIds ?? [],
    marqueeText: data.marqueeText ?? "",
  });
}

export async function syncSettingsToRTDB(): Promise<void> {
  const settingsDoc = await adminDb().collection("settings").doc("site").get();
  if (!settingsDoc.exists) return;
  const data = settingsDoc.data()!;
  await adminRtdb().ref("settings").set({
    seasonName: data.seasonName ?? "",
    prizePool: data.prizePool ?? "",
    socialLinks: data.socialLinks ?? {},
    primaryColor: (data.themeColors as Record<string, string> | undefined)?.primary ?? "",
  });
}
