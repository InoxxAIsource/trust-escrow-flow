import { LegalPage, type LegalSection } from "@/components/legal/LegalPage";

/**
 * Terms of service.
 *
 * Section 01 states the nature of the platform in full. This is the one place
 * on the site where that must be unambiguous and complete, because everything
 * downstream depends on the reader understanding it: a user who believes the
 * counterparties are real will read the rest of these terms as a live venue's.
 *
 * JURISDICTION is left as an explicit placeholder rather than invented.
 */

const CONTACT_EMAIL = "support@p2pxbt.com";

const sections: LegalSection[] = [
  {
    heading: "What P2PxBT is",
    body: [
      "P2PxBT is a product demonstration of a peer-to-peer cryptocurrency marketplace. Read this section before any other.",
      [
        "The counterparties listed in the marketplace are simulated. They are not real people and do not hold assets.",
        "Payment details issued during a trade are non-functional placeholders. The accounts do not exist and cannot receive a transfer.",
        "No cryptocurrency, fiat currency or bank transfer is processed at any point.",
        "Completing a trade does not transfer an asset to you. No blockchain transaction is created.",
        "P2PxBT holds no customer funds and provides no custody, escrow, brokerage or settlement service.",
      ],
      "Do not send money to any account detail shown anywhere on this platform. No transfer can be received and no funds can be returned.",
    ],
  },
  {
    heading: "Eligibility",
    body: [
      "You must be at least 18 to create an account. By registering you confirm that you are, and that you are not barred from using a service of this kind where you live.",
      "One account per person. You are responsible for everything done under your account and for keeping your password to yourself.",
    ],
  },
  {
    heading: "Verification",
    body: [
      "Opening a trade requires identity verification to be approved by an operator. Submitting an application does not guarantee approval, and an application may be rejected without a detailed reason.",
      "Because this is a demonstration, you should submit placeholder or redacted documents rather than genuine identity documents. Verification here is a review of a submitted file by an operator; it is not a regulated identity check and confers no legal status.",
      "You may not submit documents belonging to another person, or alter a document before submitting it.",
    ],
  },
  {
    heading: "Using the platform",
    body: [
      "You agree not to:",
      [
        "Present the platform to anyone else as a live exchange, or as a service capable of moving money.",
        "Solicit payment from another user, or attempt to move a conversation to an outside channel to do so.",
        "Attempt to access another user's trades, conversations or documents.",
        "Probe, scan or attempt to defeat the platform's authorisation rules.",
        "Automate access in a way that degrades the service for others.",
      ],
      "We may suspend or remove an account that does any of these, without notice.",
    ],
  },
  {
    heading: "Prices and figures",
    body: [
      "Reference cryptocurrency prices are supplied by a third-party feed and may be delayed, interrupted or wrong. Prices shown by counterparties are derived from that feed and are illustrative.",
      "Counterparty ratings, completion rates and trade counts are seeded values that populate the marketplace. They do not describe real trading history.",
      "Nothing on this platform is financial, investment, tax or legal advice, and no figure shown here should be relied on for a real decision.",
    ],
  },
  {
    heading: "Availability",
    body: [
      "The service is provided as-is and as-available. It may be interrupted, changed or withdrawn at any time without notice, and data created during a demonstration may be reset.",
      "We do not guarantee that the platform will be available, uninterrupted or free of errors.",
    ],
  },
  {
    heading: "Liability",
    body: [
      "To the fullest extent permitted by law, P2PxBT is not liable for any loss arising from use of this platform, including any loss resulting from treating the platform as a live financial service.",
      "Nothing in these terms limits liability for fraud, or for anything else that cannot lawfully be limited.",
    ],
  },
  {
    heading: "Your account",
    body: [
      "You can stop using the platform at any time and ask us to delete your account and its data. We may suspend or close an account that breaches these terms.",
      `To close your account, write to ${CONTACT_EMAIL}.`,
    ],
  },
  {
    heading: "Changes and governing law",
    body: [
      "We may update these terms. Material changes will be reflected in the date at the top of this page, and continued use after that date means you accept them.",
      "These terms are governed by the laws of the operator's jurisdiction. [JURISDICTION: to be completed before public launch.]",
      `Questions about these terms can be sent to ${CONTACT_EMAIL}.`,
    ],
  },
];

export default function Terms() {
  return (
    <LegalPage
      title="Terms of Service"
      description="The terms that apply to using P2PxBT, including what the platform is and is not."
      path="/terms"
      updated="15 August 2026"
      intro="These terms govern your use of P2PxBT. Section 01 describes what the platform actually is, and everything else depends on it, so please read that section first."
      sections={sections}
    />
  );
}
