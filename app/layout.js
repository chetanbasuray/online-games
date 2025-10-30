import "./globals.css";
import NavBar from "./components/NavBar";
import AuroraBackground from "./components/AuroraBackground";

export const metadata = {
  title: "Online Games",
  description: "Play Wordle and Sudoku in your browser!",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="aurora-body">
        <AuroraBackground />
        <div className="relative z-10 flex min-h-screen flex-col">
          <NavBar />
          <main className="flex-1 px-4 py-12 md:px-10 lg:px-16">{children}</main>
        </div>
      </body>
    </html>
  );
}
