export const metadata = {
  title: "POA-IT — Power of attorney, on demand",
  description: "State-specific power of attorney. Notarized online in eleven minutes. Revocable in one click. Verifiable by banks and hospitals in real time.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
