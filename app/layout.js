import "./globals.css";
import NavBar from "./components/NavBar";

export const metadata = {
  title: "Online Games",
  description: "Play Wordle and Sudoku in your browser!",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-100 min-h-screen">
        <NavBar />
        <main className="p-6">{children}</main>
      </body>
    </html>
  );
}
