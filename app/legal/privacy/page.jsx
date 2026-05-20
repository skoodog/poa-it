import { LegalLayout } from "../../../components/LegalLayout";

export const metadata = {
  title: "Privacy Policy — POA-IT",
  description: "Privacy Policy for POA-IT, compliant with the Texas Data Privacy and Security Act.",
};

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      effectiveDate="To be set at launch"
      lastUpdated="May 2026 (draft, pending Texas counsel review)"
    >
      <div className="callout">
        <strong>Plain-English summary:</strong> We collect what we need to generate
        your power of attorney and deliver it to you. We don't sell your data, we
        don't use it for advertising, and we give you full control to access,
        correct, or delete it under the Texas Data Privacy and Security Act.
      </div>

      <h2>1. Who we are</h2>
      <p>
        POA-IT is operated by POA-IT Inc., based in Austin, Texas. You can contact
        us at <a href="mailto:privacy@poa-it.com">privacy@poa-it.com</a> for any
        questions about this Policy.
      </p>
      <p>This Privacy Policy is governed by the Texas Data Privacy and Security Act ("TDPSA"), <span className="citation">Tex. Bus. & Com. Code Ch. 541</span>.</p>

      <h2>2. What we collect</h2>
      <h3>Identity Information</h3>
      <ul>
        <li>Full legal name, date of birth, home address, email, phone number</li>
        <li>Driver's license or state ID number (for identity verification)</li>
        <li>Biometric identifiers (selfie image for ID-match verification during notarization)</li>
      </ul>
      <h3>Document Information</h3>
      <ul>
        <li>The data you input into the wizard</li>
        <li>The identity of the agent and successor agents you name</li>
        <li>The powers you grant</li>
        <li>Information about the principal's property and accounts</li>
      </ul>
      <h3>Sensitive Personal Data (TDPSA <span className="citation">§ 541.001</span>)</h3>
      <ul>
        <li>Government-issued identification numbers</li>
        <li>Biometric data (selfie images, voice patterns from RON sessions)</li>
        <li>Information revealing physical or mental health condition (in medical-POA workflows)</li>
        <li>Geolocation (precise location during RON sessions)</li>
      </ul>
      <h3>Technical Information</h3>
      <ul>
        <li>IP address, device identifiers, browser type</li>
        <li>Activity within the Service</li>
        <li>Cookies and similar technologies</li>
      </ul>

      <h2>3. How we use your information</h2>
      <p>We use the information we collect to:</p>
      <ul>
        <li>Generate, deliver, and store the documents you request</li>
        <li>Verify your identity during notarization</li>
        <li>Provide customer support</li>
        <li>Process payments</li>
        <li>Send you transactional communications (receipts, confirmations, document updates)</li>
        <li>Send you marketing communications (with your consent; you can opt out at any time)</li>
        <li>Improve and develop the Service</li>
        <li>Detect, prevent, and respond to fraud, security, and legal risks</li>
        <li>Comply with our legal obligations</li>
      </ul>
      <p><strong>We DO NOT use your information for targeted advertising or profiling for decisions producing legal or similarly significant effects without your express consent. We DO NOT sell your personal information.</strong></p>

      <h2>4. Sensitive-data consent notice (TDPSA <span className="citation">§ 541.101</span>)</h2>
      <p>By using the Service, you provide express consent to our processing of Sensitive Personal Data as described above. You may withdraw this consent at any time, although doing so may require us to suspend or terminate your account.</p>

      <h2>5. How we share your information</h2>
      <p>We share your information only with:</p>
      <ul>
        <li><strong>Service Providers:</strong> Stripe (payment), our remote-online-notarization partner, Vercel (hosting), our database provider, Resend (email), our authentication provider, Sentry (error monitoring). Each provider is contractually required to handle your data only on our instructions and consistent with the TDPSA. We have executed Data Processing Agreements (DPAs) with each.</li>
        <li><strong>Attorney Marketplace Partners:</strong> With your express request, we may share contact information with attorneys in our marketplace so they can respond to your inquiry.</li>
        <li><strong>Third Parties Acting on Your Behalf:</strong> We share your document with the agent and any successor agent you designate, at your direction.</li>
        <li><strong>Legal and Compliance Disclosures:</strong> We may disclose your information when required by law, subpoena, or court order, or to respond to fraud, security incidents, or legal claims.</li>
        <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your information may be transferred. Successors will be bound by this Policy.</li>
      </ul>

      <h2>6. Cookies and tracking</h2>
      <p>We use first-party cookies for essential Service operation (login sessions, security, fraud detection). We use analytics services to understand how the Service is used.</p>
      <p>We honor the Global Privacy Control (GPC) and other recognized universal opt-out mechanisms as required by TDPSA <span className="citation">§ 541.055(e)</span>.</p>

      <h2>7. Your rights under TDPSA</h2>
      <p>Texas residents have the following rights:</p>
      <ul>
        <li>Right to confirm whether we process your personal data</li>
        <li>Right to access the personal data we hold about you</li>
        <li>Right to correct inaccurate personal data</li>
        <li>Right to delete your personal data</li>
        <li>Right to obtain a portable copy of your personal data</li>
        <li>Right to opt out of the sale of your personal data (we do not sell), targeted advertising (we do not engage in this), and profiling for legal or similarly significant decisions</li>
        <li>Right to appeal our denial of any of the above</li>
      </ul>

      <h2>8. How to exercise your rights</h2>
      <p>We provide two methods (TDPSA <span className="citation">§ 541.052</span>):</p>
      <ul>
        <li><strong>Account Dashboard:</strong> Log in to your POA-IT account and go to "Privacy & Data" to download, correct, or delete your data.</li>
        <li><strong>Privacy Request Form:</strong> Email <a href="mailto:privacy@poa-it.com">privacy@poa-it.com</a>.</li>
      </ul>
      <p>We will respond to requests within 45 days. We may require you to verify your identity before fulfilling a request.</p>

      <h2>9. Appeals process</h2>
      <p>If we deny your request, we will notify you of the decision and our reasoning within 45 days. You may appeal by emailing <a href="mailto:privacy-appeal@poa-it.com">privacy-appeal@poa-it.com</a> within 60 days. We will respond to appeals within 60 days.</p>
      <p>If we deny your appeal, you may submit a complaint to the Texas Attorney General:</p>
      <p>
        Texas Attorney General — Consumer Protection Division<br />
        <a href="https://www.texasattorneygeneral.gov/consumer-protection" target="_blank" rel="noreferrer">texasattorneygeneral.gov/consumer-protection</a><br />
        1-800-621-0508
      </p>

      <h2>10. Data retention</h2>
      <ul>
        <li>Account information: as long as your account is active</li>
        <li>Generated documents (vault): while your account is active</li>
        <li>Notarization records: 5 years (<span className="citation">Tex. Gov't Code § 406.108</span>)</li>
        <li>Payment records: 7 years (tax law)</li>
        <li>Marketing preferences: until you opt out</li>
        <li>Audit logs: 3 years</li>
      </ul>
      <p>After deletion, residual copies may exist in backups for up to 90 days before being overwritten.</p>

      <h2>11. Data security</h2>
      <p>We maintain reasonable administrative, technical, and physical safeguards consistent with <span className="citation">Tex. Bus. & Com. Code § 521.052</span>, including encryption of data in transit (TLS 1.2+) and at rest (AES-256), multi-factor authentication for staff access, least-privilege access controls, logging and monitoring, regular security testing, and an incident response plan.</p>
      <p>In the event of a data breach, we will notify you and (if applicable) the Texas Attorney General within 60 days, consistent with <span className="citation">Tex. Bus. & Com. Code § 521.053</span>.</p>

      <h2>12. Children</h2>
      <p>The Service is not directed to children under 18. We do not knowingly collect information from anyone under 18.</p>

      <h2>13. Changes to this Policy</h2>
      <p>We may update this Policy from time to time. Material changes will be posted on the Service and emailed to active account holders at least 30 days before the effective date.</p>

      <h2>14. Contact</h2>
      <p>
        <a href="mailto:privacy@poa-it.com">privacy@poa-it.com</a><br />
        POA-IT Inc., Austin, Texas
      </p>
    </LegalLayout>
  );
}
