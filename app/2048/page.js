import dynamic from "next/dynamic";

const Two048Game = dynamic(() => import("./Two048Game"), { ssr: false });

export default function Two048Page() {
  return <Two048Game />;
}
