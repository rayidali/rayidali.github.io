import type { Metadata, Viewport } from "next";
import { Instrument_Serif, VT323, Courier_Prime, Caveat } from "next/font/google";
import Analytics from "@/components/Analytics";
import "./globals.css";

const serif = Instrument_Serif({ weight: "400", style: ["normal", "italic"], subsets: ["latin"], variable: "--font-serif", display: "swap" });
const vt = VT323({ weight: "400", subsets: ["latin"], variable: "--font-vt", display: "swap" });
const mono = Courier_Prime({ weight: ["400", "700"], style: ["normal", "italic"], subsets: ["latin"], variable: "--font-mono", display: "swap" });
const hand = Caveat({ weight: ["500", "600", "700"], subsets: ["latin"], variable: "--font-hand", display: "swap" });

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://rayidali.com";
const TITLE = "Rayid Ali · RAYID.EXE";
const DESC = "Rayid Ali is an AI engineer in New York City who builds AI products end to end and ships them: Cinechrony, iEdit, pdf2video. Full-stack, product, forward deployed.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: TITLE, template: "%s · Rayid Ali" },
  description: DESC,
  applicationName: "RAYID.EXE",
  authors: [{ name: "Rayid Ali", url: SITE }],
  creator: "Rayid Ali",
  keywords: ["Rayid Ali", "AI engineer", "New York", "full-stack engineer", "product engineer", "forward deployed engineer", "LLM", "RAG", "Next.js", "Swift", "Cinechrony", "iEdit", "pdf2video", "Clemson", "portfolio"],
  alternates: { canonical: "/" },
  openGraph: { type: "profile", url: SITE, title: TITLE, description: DESC, siteName: "Rayid Ali", locale: "en_US", firstName: "Rayid", lastName: "Ali" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESC },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  icons: { icon: "/icon.svg", shortcut: "/favicon.svg" },
  category: "technology",
};

export const viewport: Viewport = { themeColor: "#070c22", colorScheme: "dark", width: "device-width", initialScale: 1 };

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person", "@id": `${SITE}/#person`, name: "Rayid Ali", url: SITE, jobTitle: "AI Engineer",
      description: DESC, image: `${SITE}/opengraph-image`,
      address: { "@type": "PostalAddress", addressLocality: "New York", addressRegion: "NY", addressCountry: "US" },
      alumniOf: { "@type": "CollegeOrUniversity", name: "Clemson University" },
      sameAs: ["https://github.com/rayidali", "https://www.linkedin.com/in/rayidali", "https://ieeexplore.ieee.org/document/9921383", "https://www.cinechrony.com", "https://iedit.dev"],
      knowsAbout: ["Artificial Intelligence", "Large Language Models", "Retrieval Augmented Generation", "Computer Vision", "Full-stack Development", "Next.js", "Swift", "Python", "TypeScript", "Reinforcement Learning", "Graph Neural Networks"],
    },
    { "@type": "WebSite", "@id": `${SITE}/#website`, url: SITE, name: "Rayid Ali", publisher: { "@id": `${SITE}/#person` }, inLanguage: "en-US" },
    { "@type": "ProfilePage", "@id": `${SITE}/#profile`, url: SITE, mainEntity: { "@id": `${SITE}/#person` }, isPartOf: { "@id": `${SITE}/#website` } },
    { "@type": "SoftwareApplication", name: "Cinechrony", url: "https://www.cinechrony.com", applicationCategory: "EntertainmentApplication", operatingSystem: "iOS, Web", author: { "@id": `${SITE}/#person` }, description: "Keep the films you find scrolling. Share a reel and it pulls out every film into a watchlist you share with friends." },
    { "@type": "SoftwareApplication", name: "iEdit", url: "https://iedit.dev", applicationCategory: "MultimediaApplication", operatingSystem: "iMessage", author: { "@id": `${SITE}/#person` }, description: "An AI video editor that lives in iMessage." },
    { "@type": "SoftwareSourceCode", name: "pdf2video", codeRepository: "https://github.com/rayidali/pdf2video", programmingLanguage: "Python", author: { "@id": `${SITE}/#person` }, description: "Turns a research paper into a narrated, animated video presentation." },
    { "@type": "ScholarlyArticle", headline: "Leveraging Network Similarity Measures for Recommendation Systems", author: { "@id": `${SITE}/#person` }, url: "https://ieeexplore.ieee.org/document/9921383", datePublished: "2022", publisher: { "@type": "Organization", name: "IEEE" }, isPartOf: { "@type": "PublicationEvent", name: "IEEE ICETCI 2022" } },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${vt.variable} ${mono.variable} ${hand.variable}`}>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
