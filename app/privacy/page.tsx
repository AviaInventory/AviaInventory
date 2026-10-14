import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { type LegalSection } from "@/components/legal/LegalPage";
import { SITE, SITE_ADDRESS } from "@/lib/site-config";

// DRAFT WORDING: must be reviewed and approved by Upgear Aviation (ideally with a Kenyan
// advocate) before going live.

export const metadata: Metadata = {
  title: "Privacy Policy | AviaInventory",
  description: "How AviaInventory collects, uses, shares and protects personal data under the Kenya Data Protection Act, 2019.",
};

const link = "text-aviation-primary underline";
const email = <a className={link} href={`mailto:${SITE.emails.general}`}>{SITE.emails.general}</a>;

const sections: LegalSection[] = [
  {
    id: "who-we-are",
    heading: "Who we are",
    body: (
      <>
        <p>
          {SITE.name} is an online marketplace for aircraft parts operated by {SITE.legalEntity}, a company registered in
          Kenya with its office at {SITE_ADDRESS} (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;).
        </p>
        <p>
          For the personal data described in this policy we are the <strong>data controller</strong> under the Data
          Protection Act, 2019 (the &quot;Act&quot;) and the Data Protection (General) Regulations, 2021. We are registered,
          or will register, with the Office of the Data Protection Commissioner (ODPC) as required by the Data Protection
          (Registration of Data Controllers and Data Processors) Regulations, 2021.
        </p>
      </>
    ),
  },
  {
    id: "scope",
    heading: "Who this policy covers",
    body: (
      <p>
        This policy applies to buyers, suppliers and visitors who use {SITE.name}, including the people who act for a
        company account (for example procurement, sales, quality and finance staff). {SITE.name} is a business-to-business
        service and is not intended for anyone under 18. We do not knowingly collect personal data about children.
      </p>
    ),
  },
  {
    id: "data-we-collect",
    heading: "Personal data we collect",
    body: (
      <>
        <p><strong>Information you give us</strong></p>
        <ul>
          <li><strong>Account details:</strong> name, business email, phone number, country, job title and password. Passwords are stored only in hashed form and nobody at {SITE.name} can read them.</li>
          <li><strong>Company details:</strong> company name, organisation type, registration number, address, city, website, and buying or selling preferences.</li>
          <li><strong>Verification and compliance documents:</strong> certificates of incorporation, approvals (for example KCAA, EASA or FAA approvals) and part certification documents such as FAA 8130-3 or EASA Form 1. These can contain the names and signatures of individuals.</li>
          <li><strong>Marketplace activity:</strong> listings, requests for quotation (RFQs), quotations, orders, shipments, invoices, messages and reviews.</li>
          <li><strong>Billing records:</strong> plan, billing period, payment status, invoices and receipts. Card and M-Pesa details are collected directly by our payment provider, Paystack, and are never stored by us. We receive only the payment reference, amount and status.</li>
          <li><strong>Communications:</strong> messages you send to our support team.</li>
        </ul>
        <p><strong>Information collected automatically</strong></p>
        <ul>
          <li>IP address, browser and device type, pages visited, and the date and time of access, held in our hosting provider&apos;s security logs.</li>
          <li>The cookies and browser storage described in our <Link className={link} href="/cookies">Cookie Policy</Link>.</li>
        </ul>
        <p>We do not intentionally collect sensitive personal data as defined in the Act (for example health, ethnic or biometric data). Please do not include it in documents or messages.</p>
      </>
    ),
  },
  {
    id: "lawful-basis",
    heading: "Why we use your data and our lawful basis",
    body: (
      <>
        <p>Section 30 of the Act requires a lawful basis for each use of personal data. We rely on the following:</p>
        <ul>
          <li><strong>To perform our contract with you:</strong> creating and securing your account, showing your listings and company profile, passing RFQs, quotations and orders between buyers and suppliers, and providing your subscription.</li>
          <li><strong>To comply with the law:</strong> keeping financial and tax records, responding to lawful requests from authorities, and anti-fraud and anti-money-laundering checks.</li>
          <li><strong>For our legitimate interests:</strong> verifying suppliers and certification documents to keep the marketplace safe, preventing misuse, securing the platform, and improving our service. We balance these interests against your rights.</li>
          <li><strong>With your consent:</strong> product news and marketing messages. You can withdraw consent at any time, without affecting anything done before.</li>
        </ul>
      </>
    ),
  },
  {
    id: "messages",
    heading: "Emails and WhatsApp messages we send",
    body: (
      <>
        <p>We contact you by email and, if you give us a WhatsApp number, through the WhatsApp Business Platform from {SITE.phone}.</p>
        <ul>
          <li><strong>Service messages</strong> (part of providing the marketplace, so no separate consent is needed): account confirmation and password reset (from {SITE.emails.noReply}), new RFQ alerts, quotation notifications, order and shipment updates, and billing receipts.</li>
          <li><strong>Promotions</strong> (marketplace news, offers and featured-supplier campaigns from {SITE.emails.sales} or WhatsApp): sent <strong>only if you opt in</strong>, as section 37 of the Act requires for commercial use of personal data. You can opt out at any time by replying STOP on WhatsApp, using the unsubscribe link in any email, or changing your notification settings.</li>
        </ul>
        <p>WhatsApp messages are delivered by Meta Platforms, which processes your phone number and message content under its own terms and privacy policy.</p>
      </>
    ),
  },
  {
    id: "sharing",
    heading: "Who we share your data with",
    body: (
      <>
        <p>We do not sell personal data. We share it only where needed:</p>
        <ul>
          <li><strong>Other marketplace users:</strong> your company profile, listings and verification status are public. Your contact details are shared with a buyer or supplier only as needed for an RFQ, quotation or order you take part in.</li>
          <li><strong>Service providers acting as our data processors,</strong> under written contracts that require them to protect your data: hosting and database (Vercel, Supabase), payments (Paystack, for card and M-Pesa), WhatsApp messages (Meta Platforms, through the WhatsApp Business Platform), and our email delivery provider.</li>
          <li><strong>Professional advisers</strong> such as auditors and lawyers, under duties of confidentiality.</li>
          <li><strong>Authorities</strong> such as the Kenya Revenue Authority, the Kenya Civil Aviation Authority or law enforcement, where the law requires it.</li>
          <li><strong>A buyer or successor</strong> if our business is sold or reorganised, under the same protections.</li>
        </ul>
      </>
    ),
  },
  {
    id: "transfers",
    heading: "Transfers outside Kenya",
    body: (
      <p>
        Some of our service providers store or process data outside Kenya (for example in the European Union or the United
        States). Where this happens we transfer data only as permitted by Part VI of the Act, relying on appropriate
        safeguards such as contractual data protection terms, and only to providers that keep the data secure.
      </p>
    ),
  },
  {
    id: "retention",
    heading: "How long we keep your data",
    body: (
      <ul>
        <li><strong>Account and company data:</strong> while your account is active, then deleted or anonymised within 12 months of closure, unless we need it for an open dispute.</li>
        <li><strong>Transaction, billing and tax records:</strong> at least five years, as required by the Tax Procedures Act, 2015.</li>
        <li><strong>Verification and certification documents:</strong> for as long as the related supplier account or listing is active and for any period required for traceability, then deleted.</li>
        <li><strong>Security logs:</strong> for a limited period set by our hosting provider, usually a few weeks.</li>
      </ul>
    ),
  },
  {
    id: "your-rights",
    heading: "Your rights",
    body: (
      <>
        <p>Under section 26 and Part IV of the Act you have the right to:</p>
        <ul>
          <li>be informed of how your personal data is used (this policy);</li>
          <li>access the personal data we hold about you;</li>
          <li>object to processing of all or part of your data;</li>
          <li>have false or misleading data corrected;</li>
          <li>have false, misleading or unlawfully held data deleted;</li>
          <li>receive your data in a portable format; and</li>
          <li>withdraw consent where we rely on it, including for marketing.</li>
        </ul>
        <p>
          To use any of these rights, email {email}. We may ask you to confirm your identity, and we will respond within the
          time limits set by the Data Protection (General) Regulations, 2021. You can also update most account details
          yourself from your account settings.
        </p>
        <p>
          If you are unhappy with how we handle your data, please contact us first. You also have the right to complain to
          the <strong>Office of the Data Protection Commissioner</strong> (www.odpc.go.ke).
        </p>
      </>
    ),
  },
  {
    id: "security",
    heading: "How we protect your data",
    body: (
      <>
        <p>
          Data is encrypted in transit. Access to each account&apos;s data is restricted by database security rules, and
          verification documents are kept in private storage that only the owning supplier and authorised AviaInventory staff
          can open. Passwords are hashed and never stored in plain text.
        </p>
        <p>
          If a personal data breach is likely to put your rights at risk, we will notify the Data Protection Commissioner
          within 72 hours of becoming aware of it and inform affected users without undue delay, as section 43 of the Act
          requires. No system is perfectly secure, so please use a strong, unique password and keep it private.
        </p>
      </>
    ),
  },
  {
    id: "cookies",
    heading: "Cookies",
    body: (
      <p>
        We use only essential cookies and browser storage, needed to keep you signed in and to save unfinished forms. See
        our <Link className={link} href="/cookies">Cookie Policy</Link> for the full list.
      </p>
    ),
  },
  {
    id: "contact",
    heading: "Changes and contact",
    body: (
      <p>
        We may update this policy, for example when we add new features or the law changes. We will publish the new version on
        this page and tell account holders about significant changes by email or in the app. Privacy questions and requests:{" "}
        {email}, {SITE.phone}, or write to {SITE.legalEntity}, {SITE_ADDRESS}.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro={
        <p>
          This policy explains what personal data {SITE.name} collects, why we collect it, who we share it with, and the
          rights you have under the Kenya Data Protection Act, 2019.
        </p>
      }
      sections={sections}
    />
  );
}
