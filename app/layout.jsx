import { ClerkProvider } from "@clerk/nextjs";

export const metadata = {
  title: "POA-IT — Power of attorney, on demand",
  description:
    "State-specific power of attorney. Notarized online in eleven minutes. Revocable in one click. Verifiable by banks and hospitals in real time.",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#0A0A0A",
          colorText: "#0A0A0A",
          colorTextSecondary: "#52525B",
          colorBackground: "#FFFFFF",
          colorInputBackground: "#FAFAFA",
          colorInputText: "#0A0A0A",
          borderRadius: "8px",
          fontFamily: "'Geist', 'Inter', -apple-system, system-ui, sans-serif",
        },
      }}
    >
      <html lang="en">
        <body style={{ margin: 0 }}>{children}</body>
      </html>
    </ClerkProvider>
  );
}
