export function getRandomInt(
  min: number = 1111111111,
  max: number = 9999999999
): number {
  return min + Math.floor(Math.random() * (max - min + 1))
}
