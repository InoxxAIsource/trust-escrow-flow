import { LegalPage, type LegalSection } from "@/components/legal/LegalPage";

/**
 * Privacy policy.
 *
 * Written against what the application actually does rather than from a
 * template: the data listed here is the data the schema really stores, and the
 * access rules described are the ones row-level security really enforces.
 *
 * Two placeholders are deliberately left for the operator to complete, marked
 * CONTACT_EMAIL and JURISDICTION. Inventing a registered entity or a governing
 * law would be worse than an obvious blank.
 */

const CONTACT_EMAIL = "privacy@p2pxbt.com";

const sections: LegalSection[] = [
  {
    heading: "Who this applies to",
    body: [
      "This policy covers everyone who visits P2PxBT or creates an account. It describes what we collect, why, where it is stored, and who can reach it.",
      "P2PxBT is a product demonstration. Counterparties on the platform are simulated and no payment is processed, but the account and verification data you submit is real data and is handled as described here.",
    ],
  },
  {
    heading: "What we collect",
    body: [
      "Account data, when you register:",
      ["Email address", "Username", "A password, stored only as a hash"],
      "Verification data, if you choose to submit it:",
      [
        "Full name, date of birth and residential address",
        "A government ID or passport image",
        "A proof of address document",
        "A photograph of your face",
      ],
      "Activity data, generated as you use the platform:",
      [
        "Trades you open, including asset, amount, price and payment method",
        "Messages you send in a trade conversation",
        "A timeline of actions taken on each of your trades",
      ],
      "We do not collect payment card details, bank credentials or wallet private keys, and no part of the platform will ever ask you for them.",
    ],
  },
  {
    heading: "Why we collect it",
    body: [
      "Account data identifies you and secures your session. Verification data exists so an operator can review an application before an account is permitted to trade. Activity data is what makes a trade auditable by the people involved in it.",
      "We do not sell personal data, and we do not use it for advertising or profiling.",
    ],
  },
  {
    heading: "Where it is stored and who can reach it",
    body: [
      "Data is held in a managed Postgres database and object store operated by Supabase. Access is enforced at the database layer by row-level security rather than by the interface, so the rules below hold for any client, not just this website.",
      [
        "Your trades and conversations are readable by you and by an authorised operator. No other account can read them.",
        "Verification documents are stored in a private bucket. They are never on a public URL and are retrieved only through short-lived signed links.",
        "Verification documents are readable by you and by an authorised operator, and by nobody else.",
        "Submitted verification evidence is immutable. There is no route to alter a document after it has been filed.",
        "You cannot change your own verification status, and neither can any other ordinary account.",
      ],
    ],
  },
  {
    heading: "Third parties",
    body: [
      "We use a small number of processors, and no others:",
      [
        "Supabase, for database, authentication, file storage and server functions.",
        "Vercel, for website hosting and delivery.",
        "CoinGecko, for reference cryptocurrency prices. This is a read-only request for public market data and carries no information about you.",
      ],
      "No third-party identity verification provider is contacted. Verification is reviewed internally by an operator.",
    ],
  },
  {
    heading: "Cookies and tracking",
    body: [
      "We use a single browser storage entry to keep you signed in between visits. It is strictly necessary for the service to function and is removed when you sign out.",
      "We run no advertising trackers, no third-party analytics and no cross-site tracking, so there is nothing here to opt out of.",
    ],
  },
  {
    heading: "How long we keep it",
    body: [
      "Account and activity data is retained while your account exists. Verification documents are retained while the account they belong to exists, so a decision can be re-examined if it is disputed.",
      "When an account is deleted, its profile, trades, conversations and verification records are deleted along with it.",
    ],
  },
  {
    heading: "Your rights",
    body: [
      "You can ask us to give you a copy of your data, correct it, or delete your account and everything attached to it. Depending on where you live you may also have the right to object to processing or to complain to a data protection authority.",
      `To make any of these requests, write to ${CONTACT_EMAIL}. We will respond within 30 days.`,
    ],
  },
  {
    heading: "Security",
    body: [
      "Passwords are hashed and never stored in readable form. Traffic is encrypted in transit. Authorisation is enforced in the database rather than in the browser, so a modified client cannot reach data it should not.",
      "No system is perfectly secure. If we discover a breach affecting your data, we will tell you.",
    ],
  },
  {
    heading: "A note on demonstration data",
    body: [
      "Because this is a demonstration, please do not upload real identity documents. Placeholder or redacted images are sufficient to complete the verification step, and they carry none of the risk of a genuine passport scan.",
    ],
  },
  {
    heading: "Changes and contact",
    body: [
      "If this policy changes materially we will update the date at the top of this page.",
      `Questions about this policy can be sent to ${CONTACT_EMAIL}.`,
    ],
  },
];

export default function Privacy() {
  return (
    <LegalPage
      title="Privacy Policy"
      description="What data P2PxBT collects, why, where it is stored, who can access it and how to have it removed."
      path="/privacy"
      updated="15 August 2026"
      intro="This policy explains what we collect and what we do with it, in plain terms. It describes the platform as it actually works rather than as a template imagines it."
      sections={sections}
    />
  );
}
