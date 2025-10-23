import "globals";
import { PatientProvider } from "@/context/PatientContext";
import { ThemeProvider } from "next-themes";
import { LanguageProvider } from "@/context/LanguageContext";

export const metadata = {
  title: "PGx Platform",
  description: "Pharmacogenomics Digital Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <PatientProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
          >
            <LanguageProvider>
              {children}
            </LanguageProvider>
          </ThemeProvider>
        </PatientProvider>
      </body>
    </html>
  );
}
