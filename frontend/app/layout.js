import "./globals.css";

export const metadata = {
  title: "Budgeting App",
  description: "Personal budgeting PWA",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
