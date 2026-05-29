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
  title: "Terms of Service — Tomcrest",
  description: "Terms governing your use of Tomcrest.",
};

export default function TermsPage() {
  return (
    <PublicMarketingPageShell>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-accent-strong">
        Legal
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
        Terms of Service
      </h1>

      <LegalDocumentIntro
        lastUpdated={LEGAL_LAST_UPDATED}
        className="mt-4"
        summary={
          <>
            These Terms of Service (&quot;Terms&quot;) are a binding agreement between you
            and {LEGAL_OPERATOR_NAME} (&quot;Tomcrest,&quot; &quot;we,&quot; &quot;us&quot;) for use of the
            Tomcrest website and application. By accessing or using Tomcrest, you
            agree to these Terms and our{" "}
            <Link href="/privacy" className="font-medium text-accent-strong hover:underline">
              Privacy Policy
            </Link>
            .
          </>
        }
      />

      <div className="mt-10 space-y-6">
        <LegalSection title="1. Eligibility">
          <LegalParagraph>
            You must be at least 18 years old (or the age of majority where you live)
            and able to form a binding contract. You are responsible for ensuring your
            use of Tomcrest complies with applicable laws and with Schwab&apos;s and
            Google&apos;s terms.
          </LegalParagraph>
        </LegalSection>

        <LegalSection title="2. The service">
          <LegalParagraph>
            Tomcrest offers portfolio-aware research, alerts, AI chat, and related
            tools for individual investors. Features may change, be added, or removed.
            Some features (such as advanced AI news analysis, income snowball, or wheel
            backtest) may require a paid &quot;Pro&quot; plan when billing is enabled.
          </LegalParagraph>
          <LegalParagraph>
            {SCHWAB_READ_ONLY_LINE} Tomcrest does not execute trades, move funds, or
            act as your broker, investment adviser, or fiduciary.
          </LegalParagraph>
        </LegalSection>

        <LegalSection title="3. Not financial advice">
          <LegalList>
            <li>
              Tomcrest provides informational tools and AI-generated content only. It
              is not personalized financial, tax, legal, or investment advice.
            </li>
            <li>
              You are solely responsible for your investment decisions and for verifying
              information before acting on it.
            </li>
            <li>
              Market and company data come from third parties; we do not guarantee
              accuracy, completeness, or timeliness.
            </li>
            <li>
              Past performance, backtests, and projections are not guarantees of future
              results.
            </li>
          </LegalList>
        </LegalSection>

        <LegalSection title="4. Your account">
          <LegalParagraph>
            You sign in with Google and are responsible for activity under your account.
            Keep your Google account secure.
          </LegalParagraph>
          <LegalParagraph>
            If you suspect unauthorized access, contact{" "}
            <SupportEmailLink subject="Tomcrest account security" /> promptly.
          </LegalParagraph>
        </LegalSection>

        <LegalSection title="5. Schwab connection">
          <LegalParagraph>
            Connecting Schwab is optional. You authorize Tomcrest to access read-only
            data via Schwab&apos;s OAuth process. You may disconnect at any time. Schwab
            is a third party; we are not responsible for Schwab&apos;s availability,
            policies, or actions.
          </LegalParagraph>
        </LegalSection>

        <LegalSection title="6. Acceptable use">
          <LegalParagraph>You agree not to:</LegalParagraph>
          <LegalList>
            <li>Use Tomcrest for unlawful purposes or in violation of these Terms</li>
            <li>Attempt to gain unauthorized access to systems, data, or accounts</li>
            <li>Scrape, reverse engineer, or overload the service without permission</li>
            <li>Interfere with other users or misrepresent your identity</li>
            <li>Use the service to provide regulated advice to third parties without proper licensing</li>
          </LegalList>
        </LegalSection>

        <LegalSection title="7. AI features">
          <LegalParagraph>
            AI responses are generated automatically and may be wrong, biased, or
            incomplete. Do not rely on them as the sole basis for investment decisions.
            You grant us permission to process inputs you provide and context needed to
            generate outputs, as described in our Privacy Policy.
          </LegalParagraph>
        </LegalSection>

        <LegalSection title="8. Intellectual property">
          <LegalParagraph>
            Tomcrest and its branding, software, and content are owned by us or our
            licensors. We grant you a limited, non-exclusive, revocable license to use
            the service for personal, non-commercial purposes. You retain rights in
            content you submit; you grant us a license to use it to operate and improve
            Tomcrest.
          </LegalParagraph>
        </LegalSection>

        <LegalSection title="9. Third-party services">
          <LegalParagraph>
            Tomcrest integrates with Google, Schwab, AI providers, analytics, and data
            vendors. Your use of those services is subject to their terms. We are not
            responsible for third-party products or sites linked from Tomcrest.
          </LegalParagraph>
        </LegalSection>

        <LegalSection title="10. Disclaimers">
          <LegalParagraph>
            THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF
            ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING IMPLIED WARRANTIES OF
            MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT,
            TO THE MAXIMUM EXTENT PERMITTED BY LAW.
          </LegalParagraph>
        </LegalSection>

        <LegalSection title="11. Limitation of liability">
          <LegalParagraph>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, TOMCREST AND ITS AFFILIATES,
            OFFICERS, EMPLOYEES, AND SUPPLIERS WILL NOT BE LIABLE FOR ANY INDIRECT,
            INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF
            PROFITS, DATA, OR GOODWILL, ARISING FROM YOUR USE OF THE SERVICE. OUR TOTAL
            LIABILITY FOR ANY CLAIM RELATING TO THE SERVICE IS LIMITED TO THE GREATER
            OF (A) AMOUNTS YOU PAID US FOR THE SERVICE IN THE TWELVE MONTHS BEFORE THE
            CLAIM OR (B) ONE HUNDRED U.S. DOLLARS ($100), EXCEPT WHERE LIABILITY CANNOT
            BE LIMITED BY LAW.
          </LegalParagraph>
        </LegalSection>

        <LegalSection title="12. Indemnification">
          <LegalParagraph>
            You agree to indemnify and hold harmless Tomcrest from claims, damages, and
            expenses (including reasonable attorneys&apos; fees) arising from your misuse of
            the service, violation of these Terms, or violation of third-party rights.
          </LegalParagraph>
        </LegalSection>

        <LegalSection title="13. Suspension and termination">
          <LegalParagraph>
            You may stop using Tomcrest at any time. We may suspend or terminate access
            if you violate these Terms, pose a security risk, or where required by law.
            Provisions that by nature should survive termination (including disclaimers,
            limitations of liability, and indemnity) will survive.
          </LegalParagraph>
        </LegalSection>

        <LegalSection title="14. Billing">
          <LegalParagraph>
            Paid plans, when offered, will be described at purchase. Billing terms may
            be updated before charges apply. Today, Pro access may be granted manually
            while billing is in beta.
          </LegalParagraph>
        </LegalSection>

        <LegalSection title="15. Changes">
          <LegalParagraph>
            We may modify these Terms. We will post the updated Terms with a new
            &quot;Last updated&quot; date. Continued use after changes become effective constitutes
            acceptance, except where applicable law requires additional notice or
            consent.
          </LegalParagraph>
        </LegalSection>

        <LegalSection title="16. Governing law">
          <LegalParagraph>
            These Terms are governed by the laws of the State of Delaware, United
            States, without regard to conflict-of-law rules, except where mandatory local
            law applies. Disputes will be resolved in the state or federal courts located
            in Delaware, unless applicable law requires otherwise.
          </LegalParagraph>
        </LegalSection>

        <LegalSection title="17. Contact">
          <LegalParagraph>
            Questions about these Terms:{" "}
            <SupportEmailLink subject="Tomcrest Terms of Service" />.
          </LegalParagraph>
        </LegalSection>
      </div>

      <p className="mt-8 text-sm text-muted">
        See also{" "}
        <Link href="/privacy" className="font-medium text-accent-strong hover:underline">
          Privacy Policy
        </Link>{" "}
        and{" "}
        <Link href="/security" className="font-medium text-accent-strong hover:underline">
          security overview
        </Link>
        .
      </p>
    </PublicMarketingPageShell>
  );
}
