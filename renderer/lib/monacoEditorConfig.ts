import { loader } from '@monaco-editor/react'
import path from 'path'

function ensureFirstBackSlash(str: string) {
  return str.length > 0 && str.charAt(0) !== '/' ? '/' + str : str
}

function uriFromPath(_path: string) {
  const pathName = path.resolve(_path).replace(/\\/g, '/')
  return encodeURI('file://' + ensureFirstBackSlash(pathName))
}

// Monaco Config
loader.config({
  paths: {
    vs: uriFromPath(
      path.join(process.cwd(), '/node_modules/monaco-editor/min/vs')
    )
  }
})
