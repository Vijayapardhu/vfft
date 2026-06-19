import { LegalDoc, LegalSection } from "@/components/legal/LegalDoc";

export const metadata = { title: "Community Guidelines" };

export default function CommunityGuidelinesPage() {
  return (
    <LegalDoc title="Community Guidelines" updated="June 2026">
      <p>
        VFFT is built for village gamers to enjoy a professional, friendly
        esports experience. Keep it that way.
      </p>

      <LegalSection heading="Respect everyone">
        <p>
          Treat players, team leaders, franchise owners and admins with respect.
          No harassment, hate speech, slurs or personal attacks.
        </p>
      </LegalSection>

      <LegalSection heading="Play fair">
        <p>
          No cheating, hacking, teaming or exploiting bugs. Submit honest
          results with valid evidence. Suspected foul play goes through the
          dispute process.
        </p>
      </LegalSection>

      <LegalSection heading="Show up">
        <p>
          Submit your match-day lineup on time, join the room before it starts,
          and use emergency substitutions only when genuinely needed.
        </p>
      </LegalSection>

      <LegalSection heading="Follow room rules">
        <p>
          Keep room IDs and passwords within your team. Don’t share them
          publicly or invite outsiders.
        </p>
      </LegalSection>

      <LegalSection heading="Consequences">
        <p>
          Breaking these guidelines can result in warnings, point deductions,
          suspension or removal from the tournament — at the admins’ discretion.
        </p>
      </LegalSection>
    </LegalDoc>
  );
}
