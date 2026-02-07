import "./globals.css";

export const metadata = {
  title: "Budgeting App",
  description: "Personal budgeting PWA",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-100 min-h-screen text-gray-800 antialiased">
        {children}
      </body>
    </html>
  );
}
