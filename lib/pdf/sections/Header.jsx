/**
 * Header section: title + statutory NOTICE + home equity warning.
 *
 * Text comes verbatim from Tex. Est. Code § 752.051. Do NOT modify the
 * wording without explicit attorney sign-off — the statute requires
 * "substantially the wording" of the form (§ 752.004), so deviations
 * could be cited in a challenge.
 */

import { View, Text } from "@react-pdf/renderer";
import { styles } from "../styles";

const NOTICE_TEXT =
  "NOTICE: THE POWERS GRANTED BY THIS DOCUMENT ARE BROAD AND SWEEPING. " +
  "THEY ARE EXPLAINED IN THE DURABLE POWER OF ATTORNEY ACT, SUBTITLE P, " +
  "TITLE 2, ESTATES CODE. IF YOU HAVE ANY QUESTIONS ABOUT THESE POWERS, " +
  "OBTAIN COMPETENT LEGAL ADVICE. THIS DOCUMENT DOES NOT AUTHORIZE ANYONE " +
  "TO MAKE MEDICAL AND OTHER HEALTH-CARE DECISIONS FOR YOU. YOU MAY REVOKE " +
  "THIS POWER OF ATTORNEY IF YOU LATER WISH TO DO SO.";

const HOME_EQUITY_WARNING =
  "IF YOU WANT YOUR AGENT TO HAVE THE AUTHORITY TO SIGN HOME EQUITY LOAN " +
  "DOCUMENTS ON YOUR BEHALF, THIS POWER OF ATTORNEY MUST BE SIGNED BY YOU " +
  "AT THE OFFICE OF THE LENDER, AN ATTORNEY AT LAW, OR A TITLE COMPANY.";

const AGENT_SELECTION_GUIDANCE =
  "You should select someone you trust to serve as your agent. Unless you " +
  "specify otherwise, generally the agent's authority will continue until you " +
  "die or revoke the power of attorney or the agent resigns or is unable to act for you.";

export function Header() {
  return (
    <View>
      <Text style={styles.title}>Statutory Durable Power of Attorney</Text>

      <Text style={styles.notice}>{NOTICE_TEXT}</Text>

      <Text style={styles.notice}>{HOME_EQUITY_WARNING}</Text>

      <Text style={styles.body}>{AGENT_SELECTION_GUIDANCE}</Text>
    </View>
  );
}
