import Store from 'electron-store'
import path from 'path'
import os from 'os'
import { useStore } from './store'

const PERSIST_FILE_NAME = 'piano-studio'
const PERSIST_FILE_DIR = path.resolve(os.homedir())
const PERSIST_FILE_EXT = 'config.json'
export const PERSIST_FILE_PATH = path.resolve(
  path.join(PERSIST_FILE_DIR, `${PERSIST_FILE_NAME}.${PERSIST_FILE_EXT}`)
)

export const persist = new Store({
  name: PERSIST_FILE_NAME,
  cwd: PERSIST_FILE_DIR,
  fileExtension: PERSIST_FILE_EXT,
  watch: true
})

useStore.getState().update((draft) => (draft.appConfig = persist.store as any))

persist.onDidAnyChange((newStore) => {
  if (typeof newStore !== 'object') {
    console.error(
      'Invalid new store JSON. Type of the retrieved store object was:',
      typeof newStore
    )
    return
  }

  useStore.getState().update((draft) => (draft.appConfig = newStore as any))
})
