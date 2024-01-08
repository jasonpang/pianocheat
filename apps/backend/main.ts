import { AppContext } from "@pianocheat/engine";

function main() {
  const appContext = new AppContext(window);
  await appContext.initialize();
}

main();
