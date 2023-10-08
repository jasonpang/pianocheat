import startCase from 'lodash.startcase'
import path from 'path'

export function getStartCaseFromFilePath(filePath: string) {
  return startCase(path.parse(filePath).name)
}

export function clamp(number: number, min: number, max: number) {
  return Math.max(min, Math.min(number, max))
}
