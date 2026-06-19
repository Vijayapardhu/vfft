import { LegalDoc, LegalSection } from "@/components/legal/LegalDoc";

export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <LegalDoc title="Privacy Policy" updated="June 2026">
      <p>
        VFFT (Velangi Free Fire Tournament) respects your privacy. This policy
        explains what we collect and how we use it.
      </p>

      <LegalSection heading="What we collect">
        <p>
          When you sign in with Google we receive your name, email and profile
          photo. If you register as a player you also provide your in-game name
          (IGN), real name, Free Fire UID, WhatsApp number, device and a photo.
        </p>
      </LegalSection>

      <LegalSection heading="How we use it">
        <p>
          Your data is used solely to run the tournament — registration,
          auctions, team formation, fixtures, results and coordinating matches.
          We never sell your data or use it for advertising.
        </p>
      </LegalSection>

      <LegalSection heading="What is public vs. private">
        <p>
          Your <strong>public profile</strong> (IGN, photo, role, statistics) is
          visible to everyone. Your <strong>contact details</strong> (real name,
          Free Fire UID, WhatsApp number) are private — visible only to you and
          tournament admins.
        </p>
      </LegalSection>

      <LegalSection heading="Storage">
        <p>
          Data is stored in Google Firebase (Cloud Firestore) and images in
          Cloudinary, both industry-standard secure providers.
        </p>
      </LegalSection>

      <LegalSection heading="Data retention">
        <p>
          Rejected player registrations are deleted after 30 days. Inactive
          player data is deleted after 90 days.
        </p>
      </LegalSection>

      <LegalSection heading="No real money">
        <p>
          VFFT uses virtual coins only. We never collect payment information and
          there is no real-money gaming, gambling or betting.
        </p>
      </LegalSection>

      <LegalSection heading="Contact">
        <p>
          Questions about your data? Reach out to the tournament administrators.
        </p>
      </LegalSection>
    </LegalDoc>
  );
}
