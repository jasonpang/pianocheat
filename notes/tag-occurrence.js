const fs = require("fs");

const contents = fs.readFileSync("./chopin-ballade-1-tags-only.xml", "utf-8");
const lines = contents.split("\n");

const map = {};
for (const line of lines) {
  const key = line.trim();
  map[key] = (map[key] || 0) + 1;
}

console.log(
  Object.entries(map)
    .sort((a, b) => a[1] - b[1])
    .reverse()
);
console.log(`There are ${Object.keys(map).length} elements.`);
