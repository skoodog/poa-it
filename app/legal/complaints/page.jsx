import { LegalLayout } from "../../../components/LegalLayout";

export const metadata = {
  title: "Complaint Procedure — POA-IT",
  description: "How to file a complaint with POA-IT.",
};

export default function ComplaintsPage() {
  return (
    <LegalLayout
      title="Complaint Procedure"
      effectiveDate="To be set at launch"
      lastUpdated="May 2026 (draft, pending Texas counsel review)"
    >
      <div className="callout">
        <strong>Plain-English summary:</strong> Three steps: email support; escalate
        to management if not resolved; arbitration if still not resolved. You can
        also file complaints directly with the Texas Attorney General or the Texas
        Unauthorized Practice of Law Committee at any time. We won't retaliate.
      </div>

      <p>We take complaints seriously and aim to resolve them quickly. This procedure applies to disputes about the Service, our refund decisions, our data practices, and our customer service.</p>

      <h2>Step 1 — Contact support</h2>
      <p>Email <a href="mailto:support@poa-it.com">support@poa-it.com</a> with:</p>
      <ul>
        <li>The nature of your complaint</li>
        <li>Your order number (if applicable)</li>
        <li>What resolution you are seeking</li>
      </ul>
      <p>We respond within 2 business days and aim to resolve most issues within 5 business days.</p>

      <h2>Step 2 — Escalate to management</h2>
      <p>If Step 1 does not resolve your complaint, email <a href="mailto:complaints@poa-it.com">complaints@poa-it.com</a> requesting management escalation. A Customer Success Manager will review your case and respond within 5 business days.</p>

      <h2>Step 3 — Arbitration</h2>
      <p>If Step 2 does not resolve your complaint, you may initiate arbitration under Section 12 of our <a href="/legal/terms">Terms of Service</a>. We use the American Arbitration Association (AAA) Consumer Arbitration Rules.</p>
      <p><strong>Note:</strong> Texas law requires 60 days' notice before bringing a DTPA arbitration claim (<span className="citation">Tex. Bus. & Com. Code § 17.505</span>). Your complaint to us (Steps 1 and 2) satisfies this notice requirement if the complaint identifies a DTPA violation.</p>

      <h2>Regulatory complaints</h2>
      <p>You may also submit complaints to:</p>

      <h3>Texas Attorney General — Consumer Protection Division</h3>
      <p>
        1-800-621-0508<br />
        <a href="https://www.texasattorneygeneral.gov/consumer-protection" target="_blank" rel="noreferrer">texasattorneygeneral.gov/consumer-protection</a>
      </p>

      <h3>Privacy complaints under the TDPSA</h3>
      <p>
        <a href="https://www.texasattorneygeneral.gov/consumer-protection/file-consumer-complaint/consumer-privacy-rights" target="_blank" rel="noreferrer">texasattorneygeneral.gov/consumer-protection/file-consumer-complaint/consumer-privacy-rights</a>
      </p>

      <h3>Concerns about unauthorized practice of law</h3>
      <p>
        Texas Unauthorized Practice of Law Committee<br />
        <a href="http://www.txuplc.org" target="_blank" rel="noreferrer">txuplc.org</a>
      </p>

      <p><strong>We will not retaliate against any customer for submitting a regulatory complaint.</strong></p>

      <h2>Attorney-related complaints</h2>
      <p>If your complaint concerns an attorney you engaged through our Marketplace, that is a separate matter between you and that attorney. You may submit a grievance to the State Bar of Texas at <a href="https://www.texasbar.com/AM/Template.cfm?Section=Grievance_Info" target="_blank" rel="noreferrer">texasbar.com</a>.</p>
      <p>POA-IT does not employ marketplace attorneys and has no authority over them.</p>
    </LegalLayout>
  );
}
