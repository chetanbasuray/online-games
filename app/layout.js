import "./globals.css";
import NavBar from "./components/NavBar";
import CosmicBackground from "./components/CosmicBackground";
import SiteFooter from "./components/SiteFooter";

export const metadata = {
  title: "Online Games",
  description: "Play Wordle and Sudoku in your browser!",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="cosmic-body">
        <CosmicBackground />
        <div className="relative z-10 flex min-h-screen flex-col">
          <NavBar />
          <main className="flex-1 px-4 py-12 md:px-10 lg:px-16">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
