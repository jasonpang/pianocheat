import requireDir from 'require-dir'
import { clearScreen } from './util'

async function main() {
  clearScreen()

  const testModules = requireDir('./', {
    filter: (fullPath: string) => fullPath.match(/.test.js$/),
    recurse: true
  })

  for (const module of Object.values(testModules)) {
    await (module as any).test.run()
  }
}

main()
