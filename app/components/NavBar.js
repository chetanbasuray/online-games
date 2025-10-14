"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GAMES } from "../data/games";

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="bg-purple-700 text-white p-4 shadow-md flex flex-wrap gap-4 justify-center">
      {GAMES.map((game) => {
        const isActive = pathname === game.path;
        return (
          <Link
            key={game.path}
            href={game.comingSoon ? "#" : game.path}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              isActive ? "bg-white text-purple-700" : "hover:bg-white/30"
            }`}
            title={game.comingSoon ? "Coming Soon" : game.name}
          >
            {game.name} {game.comingSoon && "🚧"}
          </Link>
        );
      })}
    </nav>
  );
}
