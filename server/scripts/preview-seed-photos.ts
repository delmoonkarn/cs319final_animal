/**
 * Builds seed-photos.html: every seed animal with its photos, to check they match.
 * Run: npm run photos:preview  → then open server/seed-photos.html in a browser.
 * Reads prisma/seed-data.ts directly — no database or server needed.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { animals, type AnimalSeed } from "../prisma/seed-data";

const escape = (text: string): string =>
  text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);

const speciesLabel: Record<AnimalSeed["species"], string> = { DOG: "🐶 Dogs", CAT: "🐱 Cats", OTHER: "🐰 Others" };

function card(animal: AnimalSeed): string {
  const photos = animal.imageUrls
    .map(
      (url, i) => `
        <a href="${escape(url)}" target="_blank" rel="noreferrer">
          <img src="${escape(url)}" loading="lazy" alt="${escape(animal.name)} ${i + 1}"
               onerror="this.parentElement.classList.add('broken')">
          ${i === 0 ? '<span class="tag">cover</span>' : ""}
        </a>`,
    )
    .join("");
  return `
    <article>
      <h3>${escape(animal.name)} <small>${escape(animal.key)}</small></h3>
      <p class="breed">${escape(animal.breed)}</p>
      <p class="meta">${animal.gender} · ${animal.ageMonths} months · ${animal.status}${animal.isUrgent ? " · URGENT" : ""}</p>
      <p class="desc">${escape(animal.personality)}<br>${escape(animal.healthNote)}</p>
      <div class="photos">${photos}</div>
    </article>`;
}

const sections = (["DOG", "CAT", "OTHER"] as const)
  .map((species) => {
    const list = animals.filter((a) => a.species === species);
    return `<h2>${speciesLabel[species]} (${list.length})</h2><div class="grid">${list.map(card).join("")}</div>`;
  })
  .join("");

const html = `<!doctype html>
<html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Seed photos check</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 0 auto; padding: 16px; max-width: 1200px; background: #f6f6f4; color: #222; }
  h1 { margin: 0 0 4px; } .hint { color: #666; margin: 0 0 16px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; }
  article { background: #fff; border-radius: 10px; padding: 12px; box-shadow: 0 1px 3px rgba(0,0,0,.08); }
  h3 { margin: 0; font-size: 18px; } h3 small { color: #999; font-weight: normal; font-size: 12px; }
  .breed { margin: 2px 0; font-weight: 600; color: #8a4b0f; } .meta { margin: 0; color: #666; font-size: 13px; }
  .desc { font-size: 13px; color: #444; margin: 6px 0; }
  .photos { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 6px; }
  .photos a { position: relative; display: block; aspect-ratio: 4 / 3; background: #eee; border-radius: 6px; overflow: hidden; border: 2px solid transparent; }
  .photos img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .photos a.broken { border-color: #d33; } .photos a.broken::after { content: "failed to load"; position: absolute; inset: 0; display: grid; place-items: center; color: #d33; font-size: 12px; }
  .tag { position: absolute; left: 4px; top: 4px; background: rgba(0,0,0,.6); color: #fff; font-size: 11px; padding: 1px 6px; border-radius: 4px; }
</style></head><body>
<h1>Seed photos check</h1>
<p class="hint">${animals.length} animals · ${animals.reduce((n, a) => n + a.imageUrls.length, 0)} photos · from prisma/seed-data.ts · click a photo to open it full size · red border = link broken</p>
${sections}
</body></html>`;

const outFile = join(__dirname, "..", "seed-photos.html");
writeFileSync(outFile, html, "utf8");
console.log(`Wrote ${outFile} — open it in your browser.`);
