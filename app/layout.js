import "./globals.css";
import NavBar from "./components/NavBar";
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
      <body className="min-h-screen bg-slate-100 font-sans text-slate-900">
        <div className="flex min-h-screen flex-col">
          <NavBar />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
