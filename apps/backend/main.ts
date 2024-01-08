import { AppContext } from "@pianocheat/engine";

async function main() {
  process.on("uncaughtException", (err, origin) => {
    console.error(`[Fatal Crash]`, err, origin);
  });

  const appContext = new AppContext();
  await appContext.initialize();

  var a = 14;
  console.log("PianoCheat Backend");
  console.log();
  console.log("Finished!");
}

main();
