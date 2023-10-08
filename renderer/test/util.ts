import readline from "readline";

export function clearScreen() {
  readline.cursorTo(process.stdout, 0, 0);
  readline.clearLine(process.stdout, 0);
  readline.clearScreenDown(process.stdout);
}
