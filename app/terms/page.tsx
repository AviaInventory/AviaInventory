import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { type LegalSection } from "@/components/legal/LegalPage";
import { SITE, SITE_ADDRESS } from "@/lib/site-config";

// DRAFT WORDING: must be reviewed and approved by Upgear Aviation (ideally with a Kenyan
// advocate) before going live.

export const metadata: Metadata = {
  title: "Terms & Conditions | AviaInventory",
  description: "The terms that apply to buying, selling and subscribing on the AviaInventory aviation parts marketplace, governed by the laws of Kenya.",
};

const link = "text-aviation-primary underline";
const email = <a className={link} href={`mailto:${SITE.emails.support}`}>{SITE.emails.support}</a>;
const billingEmail = <a className={link} href={`mailto:${SITE.emails.billing}`}>{SITE.emails.billing}</a>;

const sections: LegalSection[] = [
  {
    id: "agreement",
    heading: "About these Terms",
    body: (
      <>
        <p>
          These Terms govern your use of {SITE.name}, an online marketplace for aircraft parts operated by {SITE.legalEntity},
          {" "}{SITE_ADDRESS} (&quot;we&quot;, &quot;us&quot;). By creating an account, or by using the marketplace, you
          accept these Terms for yourself and for the company you represent, and you confirm that you are at least 18 and
          authorised to bind that company.
        </p>
        <p>
          Accepting these Terms electronically is binding under the Kenya Information and Communications Act (Cap. 411A),
          which recognises electronic records and signatures.
        </p>
      </>
    ),
  },
  {
    id: "accounts",
    heading: "Accounts",
    body: (
      <ul>
        <li>You must give accurate company and contact information and keep it up to date.</li>
        <li>You are responsible for all activity under your account and for keeping your password secure. Tell us immediately at {SITE.emails.support} if you suspect unauthorised use.</li>
        <li>Each account belongs to one company. You may invite colleagues as team members, but you must not share login details.</li>
        <li>A Buyer account can buy. A Buyer &amp; Supplier account can also list parts and answer RFQs.</li>
      </ul>
    ),
  },
  {
    id: "our-role",
    heading: "Our role",
    body: (
      <>
        <p>
          {SITE.name} connects buyers and suppliers. Unless we expressly agree otherwise in writing, we are <strong>not a
          party</strong> to sales between users, we do not own, inspect, store or ship the parts, and we do not act as agent
          for either side.
        </p>
        <p>
          Each sale is a contract between the buyer and the supplier. They are responsible for agreeing price, delivery,
          warranty, payment, customs and import or export duties, and for meeting their obligations to each other.
        </p>
      </>
    ),
  },
  {
    id: "supplier-obligations",
    heading: "Listings and parts compliance",
    body: (
      <>
        <p>Suppliers must:</p>
        <ul>
          <li>list only parts they own or are authorised to sell;</li>
          <li>describe part numbers, condition (for example new, overhauled, serviceable or as removed), quantity and price accurately;</li>
          <li>hold genuine, current certification and traceability for each part, such as an FAA 8130-3, EASA Form 1 or certificate of conformity, matching the part offered;</li>
          <li>comply with the Civil Aviation Act, 2013, the regulations of the Kenya Civil Aviation Authority (KCAA), and the aviation rules of every country they sell into; and</li>
          <li>comply with applicable export-control and sanctions laws for aircraft parts and dual-use items.</li>
        </ul>
        <p>
          Listing counterfeit, stolen, unapproved or falsely documented parts is strictly prohibited. We will remove such
          listings, suspend the account and may report the matter to the KCAA or other authorities.
        </p>
      </>
    ),
  },
  {
    id: "verification",
    heading: "Verification and airworthiness",
    body: (
      <p>
        &quot;Verified&quot; badges mean we reviewed the documents a supplier gave us at that time. They are{" "}
        <strong>not</strong> a guarantee of airworthiness, authenticity or fitness for a particular aircraft. Buyers remain
        responsible for their own receiving inspection, airworthiness checks and compliance with the regulations that apply to
        their aircraft and organisation.
      </p>
    ),
  },
  {
    id: "rfqs-orders",
    heading: "RFQs, quotations and orders",
    body: (
      <ul>
        <li>A quotation is an offer from the supplier on the terms it states, including validity period, lead time, condition and warranty.</li>
        <li>An order is formed when a buyer accepts a quotation. Changes or cancellations are agreed between the buyer and the supplier.</li>
        <li>Records of RFQs, quotations, orders and messages on {SITE.name} may be used as evidence of what was agreed.</li>
      </ul>
    ),
  },
  {
    id: "subscriptions",
    heading: "Subscriptions, fees and payment",
    body: (
      <ul>
        <li>New accounts receive a <strong>90-day free trial</strong>. No payment is taken automatically when the trial ends.</li>
        <li>Paid plans are billed in advance for the chosen period (monthly or annual) at the prices on our <Link className={link} href="/pricing">Pricing</Link> page. Prices are in US dollars, and payment in Kenya shillings is converted at the payment provider&apos;s rate on the day of payment.</li>
        <li>Prices include applicable taxes unless stated otherwise. We issue invoices in line with the VAT Act, 2013 and the Tax Procedures Act, 2015.</li>
        <li>Payments are processed by Paystack. You can pay by card or M-Pesa. Card payments renew automatically until cancelled; M-Pesa payments are made each period and you will be asked to approve each one on your phone.</li>
        <li>Questions about invoices, receipts or charges: {billingEmail}.</li>
        <li>You can cancel at any time. Access continues until the end of the period you paid for. Fees already paid are not refundable, except where the Consumer Protection Act, 2012 or other law requires a refund.</li>
        <li>If a payment fails, we may limit paid features after a grace period. Your data is never deleted because of a failed payment.</li>
        <li>We will give at least 30 days&apos; notice of any price change, which applies from your next billing period.</li>
      </ul>
    ),
  },
  {
    id: "communications",
    heading: "Notifications and communications",
    body: (
      <ul>
        <li>By using {SITE.name} you agree to receive service messages by email and WhatsApp, such as new RFQ alerts, quotation notifications, order updates and billing receipts. They are part of the service.</li>
        <li>We send promotions only if you opt in, and you can opt out at any time by replying STOP on WhatsApp, using the unsubscribe link, or changing your notification settings.</li>
        <li>Your mobile network may charge for data used to receive WhatsApp messages.</li>
      </ul>
    ),
  },
  {
    id: "acceptable-use",
    heading: "Acceptable use",
    body: (
      <>
        <p>You must not:</p>
        <ul>
          <li>post false, misleading or fake reviews, listings or company information;</li>
          <li>access, or try to access, other users&apos; accounts or data, or interfere with the security of the platform;</li>
          <li>copy, scrape or harvest data from {SITE.name} by automated means;</li>
          <li>send spam, or use contact details from the marketplace for anything other than the RFQ, quotation or order concerned;</li>
          <li>upload malware, or use the platform for fraud, money laundering or any unlawful purpose; or</li>
          <li>arrange transactions with users you met on {SITE.name} in a way intended to avoid these Terms.</li>
        </ul>
        <p>
          Some of these acts are offences under the Computer Misuse and Cybercrimes Act, 2018 and the Proceeds of Crime and
          Anti-Money Laundering Act, 2009. We may report them to the authorities.
        </p>
      </>
    ),
  },
  {
    id: "content",
    heading: "Your content and our intellectual property",
    body: (
      <>
        <p>
          You keep ownership of the listings, photographs and documents you upload. You give us a non-exclusive, royalty-free
          licence to host, display and process that content to run the marketplace, including showing listings to buyers and
          showing your company profile publicly.
        </p>
        <p>
          The {SITE.name} name, logo, software and design belong to {SITE.legalEntity}. You may not copy or reuse them without
          our written permission.
        </p>
      </>
    ),
  },
  {
    id: "suspension",
    heading: "Suspension and termination",
    body: (
      <ul>
        <li>You can close your account at any time from your account settings or by emailing {SITE.emails.support}.</li>
        <li>We may suspend or close an account, or remove content, if we reasonably believe the user has breached these Terms or the law, or puts other users at risk. Where appropriate we will tell you why and give you an opportunity to respond.</li>
        <li>On closure we keep the records the law requires, as explained in our <Link className={link} href="/privacy">Privacy Policy</Link>.</li>
      </ul>
    ),
  },
  {
    id: "liability",
    heading: "Liability",
    body: (
      <>
        <p>
          We provide the marketplace with reasonable skill and care, but we do not guarantee it will be uninterrupted or
          error-free. Because we are not a party to sales between users, we are not liable for the quality, safety, legality or
          delivery of parts, or for a buyer&apos;s or supplier&apos;s failure to perform.
        </p>
        <p>
          To the extent the law allows, we are not liable for indirect or consequential loss, or for loss of profit, revenue or
          data, and our total liability to you in any 12-month period is limited to the subscription fees you paid us in that
          period. Nothing in these Terms limits liability that cannot be limited under Kenyan law, including your rights under
          the Consumer Protection Act, 2012.
        </p>
        <p>You agree to compensate us for losses caused by your breach of these Terms or of the law.</p>
      </>
    ),
  },
  {
    id: "privacy",
    heading: "Privacy",
    body: (
      <p>
        We handle personal data as explained in our <Link className={link} href="/privacy">Privacy Policy</Link> and{" "}
        <Link className={link} href="/cookies">Cookie Policy</Link>, in line with the Data Protection Act, 2019.
      </p>
    ),
  },
  {
    id: "disputes",
    heading: "Disputes and governing law",
    body: (
      <>
        <p>These Terms are governed by the laws of the Republic of Kenya.</p>
        <p>
          If you have a complaint, please contact us first at {email}; we will try to resolve it within 30 days. If it is not
          resolved, either party may refer the dispute to arbitration in Nairobi under the Arbitration Act, 1995, by a single
          arbitrator appointed by agreement or, failing agreement, by the Nairobi Centre for International Arbitration. This
          does not stop either party seeking urgent relief from the courts of Kenya, or a consumer from using rights they
          cannot give up by law.
        </p>
        <p>Disputes between buyers and suppliers are for them to resolve. We may help, but we are not obliged to.</p>
      </>
    ),
  },
  {
    id: "changes",
    heading: "Changes and contact",
    body: (
      <>
        <p>
          We may update these Terms. We will publish changes on this page and, for significant changes, notify account holders
          at least 14 days before they take effect. Continuing to use {SITE.name} after that means you accept the updated
          Terms.
        </p>
        <p>
          If any part of these Terms is found unenforceable, the rest remains in force. Questions: {email}, {SITE.phone},{" "}
          {SITE.legalEntity}, {SITE_ADDRESS}.
        </p>
      </>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms & Conditions"
      intro={
        <p>
          Please read these Terms carefully before using {SITE.name}. They explain your rights and obligations as a buyer,
          supplier or subscriber, and they are governed by the laws of Kenya.
        </p>
      }
      sections={sections}
    />
  );
}
