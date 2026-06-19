import { LegalDoc, LegalSection } from "@/components/legal/LegalDoc";
import { PageView } from "@/components/legal/PageView";

export const metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <PageView slug="terms" title="Terms of Service" fallback={
    <LegalDoc title="Terms of Service" updated="June 2026">
      <p>
        By using VFFT you agree to these terms. They keep the tournament fair
        and fun for everyone.
      </p>

      <LegalSection heading="Accounts">
        <p>
          You sign in with Google. You are responsible for the activity on your
          account and for providing accurate registration details.
        </p>
      </LegalSection>

      <LegalSection heading="Virtual currency only">
        <p>
          Auction budgets and bids use virtual coins with no monetary value.
          VFFT does not support real-money transactions, gambling or betting of
          any kind.
        </p>
      </LegalSection>

      <LegalSection heading="Fair play">
        <p>
          Cheating, hacking, account sharing, smurfing or any form of
          match-fixing is prohibited and may result in suspension or removal.
          All statistics require screenshot evidence.
        </p>
      </LegalSection>

      <LegalSection heading="Admin decisions">
        <p>
          Tournament admins manage approvals, auctions, results and disputes.
          Disputes follow the published process (open → under review → resolved
          → closed) and admin resolutions are final.
        </p>
      </LegalSection>

      <LegalSection heading="Conduct">
        <p>
          Follow the Community Guidelines. Harassment, abuse or disruptive
          behaviour can lead to removal from the league.
        </p>
      </LegalSection>

      <LegalSection heading="Liability">
        <p>
          VFFT is a community platform provided “as is”, without warranty. We
          are not liable for in-game outcomes, downtime or data loss beyond our
          reasonable control.
        </p>
      </LegalSection>
    </LegalDoc>
    } />
  );
}
