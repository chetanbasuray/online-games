"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavBar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Wordle", path: "/wordle" },
  ];

  return (
    <nav className="bg-gray-900 text-white px-6 py-4 flex gap-6 items-center shadow-lg">
      <h1 className="font-bold text-xl">🧠 Online Games</h1>
      <div className="flex gap-4">
        {navItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`hover:text-yellow-400 ${
              pathname === item.path ? "text-yellow-400" : "text-white"
            }`}
          >
            {item.name}
          </Link>
        ))}
      </div>
    </nav>
  );
}
