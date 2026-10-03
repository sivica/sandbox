import { zipSync, strToU8 } from "fflate";
import template from "../export-baseline.json";
import { validateDesign, screenHTML, screens } from "./design.js";
export function exportZip(version) {
  const design = validateDesign(version.design),
    files = { ...template };
  const tokens = JSON.parse(files["design-tokens.json"]);
  tokens[design.style] = design.tokens;
  files["design-tokens.json"] = JSON.stringify(tokens, null, 2);
  files["public/index.html"] = files["public/index.html"].replace(
    'data-design="calm-spa"',
    `data-design="${design.style}"`,
  );
  files["src/fixtures.js"] = files["src/fixtures.js"].replace(
    "?query.get('design'):'calm-spa'",
    `?query.get('design'):'${design.style}'`,
  );
  files["version-manifest.json"] = JSON.stringify(version.manifest, null, 2);
  files["design-specification.json"] = JSON.stringify(design, null, 2);
  design.screens.forEach(
    (_, i) =>
      (files[`public/designs/screen-${i + 1}.html`] = screenHTML(design, i)),
  );
  files["README.md"] +=
    "\n\n## Design Studio version\nThis ZIP uses the trusted Kindred booking controller and synthetic fixtures. Generated design tokens are applied to the selected style. Static design proposals are in public/designs; their copy is not automatically wired into the trusted booking controller. See design-specification.json and version-manifest.json. Review integration before real use. No ChatGPT credentials are included.\n\nRun npm ci, npm run build, npm start. Screens: " +
    screens.join(", ") +
    ".\n";
  return zipSync(
    Object.fromEntries(
      Object.entries(files).map(([name, text]) => [name, strToU8(text)]),
    ),
    { level: 6 },
  );
}
