import GamePlaceholder from "../components/GamePlaceholder";

export default function HangmanPage() {
  return (
    <GamePlaceholder
      title="Hangman"
      creator="unknown Victorian-era puzzle enthusiasts"
      moreInfo={{
        url: "https://en.wikipedia.org/wiki/Hangman_(game)",
        label: "the Hangman entry on Wikipedia",
      }}
    />
  );
}
