import Link from "next/link";
import type { Metadata } from "next";
import {
  LegalDocumentIntro,
  LegalList,
  LegalParagraph,
  LegalSection,
} from "@/components/legal/LegalDocument";
import {
  PublicMarketingPageShell,
  SupportEmailLink,
} from "@/components/PublicMarketingChrome";
import { LEGAL_LAST_UPDATED, LEGAL_OPERATOR_NAME } from "@/lib/legal";
import { SCHWAB_READ_ONLY_LINE } from "@/lib/schwabTrustCopy";

export const metadata: Metadata = {
  title: "Privacy Policy — Tomcrest",
  description: "How Tomcrest collects, uses, and protects your information.",
};

export default function PrivacyPage() {
  return (
    <PublicMarketingPageShell>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-accent-strong">
        Legal
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
        Privacy Policy
      </h1>

      <LegalDocumentIntro
        lastUpdated={LEGAL_LAST_UPDATED}
        className="mt-4"
        summary={
          <>
            This Privacy Policy explains how {LEGAL_OPERATOR_NAME} (&quot;Tomcrest,&quot;
            &quot;we,&quot; &quot;us&quot;) handles information when you use our website and
            application. It applies to visitors and signed-in users. For a shorter,
            product-focused overview, see our{" "}
            <Link href="/security" className="font-medium text-accent-strong hover:underline">
              security &amp; privacy overview
            </Link>
            .
          </>
        }
      />

      <div className="mt-10 space-y-6">
        <LegalSection title="1. Who we are">
          <LegalParagraph>
            Tomcrest provides AI-assisted portfolio intelligence for individual
            investors. We operate the Tomcrest web application and related services.
          </LegalParagraph>
          <LegalParagraph>
            Privacy questions and requests:{" "}
            <SupportEmailLink subject="Tomcrest privacy request" />.
          </LegalParagraph>
        </LegalSection>

        <LegalSection title="2. Information we collect">
          <LegalParagraph>Depending on how you use Tomcrest, we may collect:</LegalParagraph>
          <LegalList>
            <li>
              <strong className="text-foreground">Account information</strong> — When
              you sign in with Google, we receive identifiers and profile details
              Google shares with us (such as your email address and name) to create
              and maintain your Tomcrest account.
            </li>
            <li>
              <strong className="text-foreground">Brokerage data (optional)</strong> — If
              you connect Charles Schwab, we receive read-only data Schwab makes
              available through OAuth, such as account identifiers, holdings, cash
              balances, open options, and recent orders. We do not receive your Schwab
              password.
            </li>
            <li>
              <strong className="text-foreground">Product usage data</strong> — Strategy
              preferences, watchlists, chat history, settings, and similar in-app
              content you create or save.
            </li>
            <li>
              <strong className="text-foreground">AI interactions</strong> — Prompts and
              context we send to our AI providers to generate responses (for example,
              portfolio summaries, research answers, and news analysis for Pro users).
            </li>
            <li>
              <strong className="text-foreground">Technical data</strong> — Log data,
              device/browser type, IP address, and analytics events that help us
              operate, secure, and improve the service.
            </li>
            <li>
              <strong className="text-foreground">Communications</strong> — Information
              you send when you contact support.
            </li>
          </LegalList>
        </LegalSection>

        <LegalSection title="3. How we use information">
          <LegalList>
            <li>Provide, maintain, and personalize the Tomcrest service</li>
            <li>Sync and display your portfolio, research, and alerts</li>
            <li>Generate AI-powered insights grounded in your context</li>
            <li>Authenticate you and protect against abuse or fraud</li>
            <li>Respond to support requests and communicate about the product</li>
            <li>Understand usage and improve features (including analytics)</li>
            <li>Comply with law and enforce our Terms of Service</li>
          </LegalList>
          <LegalParagraph>
            We do not sell your brokerage holdings or Schwab account data.
          </LegalParagraph>
        </LegalSection>

        <LegalSection title="4. Schwab and Google">
          <LegalParagraph>{SCHWAB_READ_ONLY_LINE}</LegalParagraph>
          <LegalParagraph>
            Schwab and Google process your information under their own policies when
            you use their sign-in or authorization flows. Tomcrest only receives data
            you authorize through those flows. You can disconnect Schwab in Tomcrest
            Settings or revoke Tomcrest in your Schwab account settings.
          </LegalParagraph>
        </LegalSection>

        <LegalSection title="5. AI and market data providers">
          <LegalParagraph>
            We use third-party services to power AI features and market/company data
            (for example, large language model providers and market data APIs). Those
            providers process data on our behalf according to their agreements with us
            and only as needed to deliver the feature you request.
          </LegalParagraph>
          <LegalParagraph>
            AI output may be inaccurate or incomplete. Do not treat it as financial,
            tax, or legal advice.
          </LegalParagraph>
        </LegalSection>

        <LegalSection title="6. Analytics and cookies">
          <LegalParagraph>
            We may use analytics tools (such as product analytics) to understand how
            features are used. These tools may use cookies or similar technologies. You
            can limit cookies through your browser settings; some features may not work
            correctly if essential cookies are disabled.
          </LegalParagraph>
        </LegalSection>

        <LegalSection title="7. How we share information">
          <LegalParagraph>We may share information:</LegalParagraph>
          <LegalList>
            <li>
              With service providers that help us run Tomcrest (hosting, authentication,
              AI, analytics, email)
            </li>
            <li>When required by law, regulation, or legal process</li>
            <li>
              To protect the rights, safety, and security of Tomcrest, our users, or
              others
            </li>
            <li>
              In connection with a merger, acquisition, or sale of assets, subject to
              appropriate confidentiality obligations
            </li>
          </LegalList>
          <LegalParagraph>We do not sell personal information for money.</LegalParagraph>
        </LegalSection>

        <LegalSection title="8. Retention">
          <LegalParagraph>
            We retain information for as long as your account is active or as needed to
            provide the service, comply with legal obligations, resolve disputes, and
            enforce agreements. When you disconnect Schwab, we stop syncing new
            brokerage data. Chat history and preferences may remain until you delete
            your account or ask us to delete eligible data.
          </LegalParagraph>
        </LegalSection>

        <LegalSection title="9. Security">
          <LegalParagraph>
            We use reasonable administrative, technical, and organizational measures to
            protect information. No method of transmission or storage is completely
            secure. See our{" "}
            <Link href="/security" className="font-medium text-accent-strong hover:underline">
              security overview
            </Link>{" "}
            for more detail.
          </LegalParagraph>
        </LegalSection>

        <LegalSection title="10. Your choices and rights">
          <LegalList>
            <li>Disconnect Schwab or sign out of Tomcrest at any time</li>
            <li>Revoke Google access to Tomcrest from your Google account settings</li>
            <li>
              Email us to request access, correction, or deletion of account data where
              applicable law provides those rights
            </li>
          </LegalList>
          <LegalParagraph>
            If you are a California resident, you may have additional rights under
            applicable privacy laws. Contact{" "}
            <SupportEmailLink subject="Tomcrest privacy rights" /> to exercise them.
          </LegalParagraph>
        </LegalSection>

        <LegalSection title="11. Children">
          <LegalParagraph>
            Tomcrest is not directed to children under 13 (or the minimum age required
            in your jurisdiction), and we do not knowingly collect their personal
            information.
          </LegalParagraph>
        </LegalSection>

        <LegalSection title="12. International users">
          <LegalParagraph>
            Tomcrest is operated from the United States. If you access the service from
            other regions, your information may be processed in the U.S. and other
            countries where our providers operate.
          </LegalParagraph>
        </LegalSection>

        <LegalSection title="13. Changes to this policy">
          <LegalParagraph>
            We may update this Privacy Policy from time to time. We will post the
            revised version with a new &quot;Last updated&quot; date. Material changes may
            be communicated in the app or by email where appropriate.
          </LegalParagraph>
        </LegalSection>

        <LegalSection title="14. Contact">
          <LegalParagraph>
            <SupportEmailLink subject="Tomcrest privacy" />
          </LegalParagraph>
          <LegalParagraph>
            Include the Google email you use to sign in so we can locate your account.
          </LegalParagraph>
        </LegalSection>
      </div>

      <p className="mt-8 text-sm text-muted">
        See also{" "}
        <Link href="/terms" className="font-medium text-accent-strong hover:underline">
          Terms of Service
        </Link>
        .
      </p>
    </PublicMarketingPageShell>
  );
}
