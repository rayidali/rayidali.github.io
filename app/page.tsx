import fs from "node:fs";
import path from "node:path";
import Desktop from "@/components/Desktop";

export const dynamic = "force-static";

function markup(): string {
  const dir = path.join(process.cwd(), "lib");
  const html = fs.readFileSync(path.join(dir, "desktop.html"), "utf8");
  const xword = fs.readFileSync(path.join(dir, "xword.html"), "utf8");
  const words: string[] = JSON.parse(fs.readFileSync(path.join(dir, "xwords.json"), "utf8"));
  const list = words.map((w) => `<span data-w="${w}">${w}</span>`).join("");
  return html.replace("__XWORD__", xword).replace("__XWORDS__", list);
}

export default function Page() {
  return (
    <>
      <main dangerouslySetInnerHTML={{ __html: markup() }} />
      <Desktop />
    </>
  );
}
