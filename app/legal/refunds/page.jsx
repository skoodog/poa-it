import { LegalLayout } from "../../../components/LegalLayout";

export const metadata = {
  title: "Refund Policy — POA-IT",
  description: "Refund Policy for POA-IT.",
};

export default function RefundsPage() {
  return (
    <LegalLayout
      title="Refund Policy"
      effectiveDate="To be set at launch"
      lastUpdated="May 2026 (draft, pending Texas counsel review)"
    >
      <div className="callout">
        <strong>Plain-English summary:</strong> Full refund within 7 days if you
        haven't generated your document yet. 50% refund if you've generated it but
        haven't gotten it notarized. After notarization, no refund — but if the
        document has a defect we caused, we reissue at no charge.
      </div>

      <h2>Transactional products (one-time POA purchases)</h2>

      <h3>Within 7 days of purchase / before document generated</h3>
      <p><strong>Full refund (100%).</strong> Email refunds@poa-it.com with your order number. We will refund within 5–10 business days.</p>

      <h3>Within 7 days of purchase / document generated, not notarized</h3>
      <p><strong>50% refund.</strong> The remaining 50% reflects the cost of the document generation, which has occurred. You retain your generated document.</p>

      <h3>After notarization</h3>
      <p><strong>No refund.</strong> The notary service has been provided. However, if the document contains a defect (e.g., a typographical error caused by our software, not by your data entry), we will reissue and re-notarize at no charge.</p>

      <h3>After 7 days, before notarization</h3>
      <p>No refund unless the document contains a defect.</p>

      <h2>Subscription products (when launched)</h2>
      <p>You may cancel any subscription at any time through your account dashboard. Cancellation takes effect at the end of your current billing period. No prorated refunds for partial periods.</p>
      <p>If you are charged in error (e.g., we fail to honor a timely cancellation), we will refund the affected charge in full.</p>

      <h2>Defects and errors</h2>
      <p>If a document we generated contains a defect attributable to our software (not to your data entry), we will reissue at no charge. "Defect" means the document does not conform to the Texas statutory form applicable on the date of generation.</p>

      <h2>How to request a refund</h2>
      <p>Email <a href="mailto:refunds@poa-it.com">refunds@poa-it.com</a> with:</p>
      <ul>
        <li>Your order number</li>
        <li>The reason for the refund request</li>
        <li>Whether you have downloaded or used the document</li>
      </ul>
      <p>We respond within 5 business days. Approved refunds appear on your original payment method within 5–10 business days.</p>

      <h2>Exceptions</h2>
      <p>We may decline refunds where we reasonably suspect:</p>
      <ul>
        <li>Fraudulent purchases</li>
        <li>Misuse of the Service in violation of our <a href="/legal/terms">Terms</a></li>
        <li>Excessive refund requests (more than 3 in 12 months)</li>
      </ul>
      <p>Decisions to decline are final unless rebutted under our <a href="/legal/complaints">Complaint Procedure</a>.</p>
    </LegalLayout>
  );
}
