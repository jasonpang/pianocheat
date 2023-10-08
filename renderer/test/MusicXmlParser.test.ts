import MusicXmlReader from '../engine/reader/MusicXmlReader'
import baretest from 'baretest'
import assert from 'assert'
import { fs, fs as memFs } from 'memfs'
import nativeFs from 'fs'
import { inspect } from 'util'
import MusicXmlParser from '../engine/parser/MusicXmlParser'
import PlayerPartitionProcessor from '../engine/builder/PlayerPartitionProcessor'
import ScoreBuilder from '../engine/builder/ScoreBuilder'

export const test = baretest('MusicXmlParser')

test(`throwns on invalid file extension`, () => {
  assert.throws(() => new MusicXmlReader().readFile('test.pdf'), {
    message: /expected.*to have a valid.*file extension/i
  })
})

test(`throws on invalid XML`, () => {
  memFs.writeFileSync('/test.xml', '!! {{> Not valid XML')
  assert.throws(
    () => new MusicXmlReader().readFile('/test.xml', { fs: memFs }),
    {
      message: /not a valid musicxml file/i
    }
  )
})

test.only(`converts musicxml to JSON building score`, () => {
  const fileContents = new MusicXmlReader().readFile(
    './renderer/test/songs/invention-1.musicxml',
    { fs: nativeFs }
  )
  const parsedScore = new MusicXmlParser(fileContents).parse()
  const notesForPlayerAtTime = new ScoreBuilder().build(parsedScore)
  nativeFs.writeFileSync(
    './hello-world-build.json',
    JSON.stringify(notesForPlayerAtTime, null, 4)
  )
})

test.skip(`converts musicxml to JSON raw score`, () => {
  const fileContents = new MusicXmlReader().readFile(
    './renderer/test/songs/invention-1.musicxml',
    { fs: nativeFs }
  )
  const parsedScore = new MusicXmlParser(fileContents).parse()
  // nativeFs.writeFileSync(
  //   './renderer/test/songs/invenction-1.json',
  //   JSON.stringify(parsedScore, null, 4)
  // )
})

test(`reads basic hello world MusicXML`, () => {
  const result = new MusicXmlReader().readFile(
    './renderer/test/songs/hello-world.musicxml',
    {
      fs: nativeFs
    }
  )
  assert.deepStrictEqual(result, [
    {
      tagName: 'part-list',
      children: [
        {
          tagName: 'score-part',
          attributes: {
            id: 'P1'
          },
          children: [
            {
              tagName: 'part-name',
              children: ['Music']
            }
          ]
        }
      ]
    },
    {
      tagName: 'part',
      attributes: {
        id: 'P1'
      },
      children: [
        {
          tagName: 'measure',
          attributes: {
            number: 1
          },
          children: [
            {
              tagName: 'attributes',
              children: [
                {
                  tagName: 'divisions',
                  children: [1]
                },
                {
                  tagName: 'key',
                  children: [
                    {
                      tagName: 'fifths',
                      children: [0]
                    }
                  ]
                },
                {
                  tagName: 'time',
                  children: [
                    {
                      tagName: 'beats',
                      children: [4]
                    },
                    {
                      tagName: 'beat-type',
                      children: [4]
                    }
                  ]
                },
                {
                  tagName: 'clef',
                  children: [
                    {
                      tagName: 'sign',
                      children: ['G']
                    },
                    {
                      tagName: 'line',
                      children: [2]
                    }
                  ]
                }
              ]
            },
            {
              tagName: 'note',
              children: [
                {
                  tagName: 'pitch',
                  children: [
                    {
                      tagName: 'step',
                      children: ['C']
                    },
                    {
                      tagName: 'octave',
                      children: [4]
                    }
                  ]
                },
                {
                  tagName: 'duration',
                  children: [4]
                },
                {
                  tagName: 'type',
                  children: ['whole']
                }
              ]
            }
          ]
        }
      ]
    }
  ])
})

test.only(`parses basic hello world MusicXML`, () => {
  const rawScore = new MusicXmlReader().readFile(
    './test/songs/chopin-ballade-1.musicxml',
    {
      fs: nativeFs
    }
  )
  // nativeFs.writeFileSync('./hello-world.json', JSON.stringify(rawScore, null, 4))
  const parsedScore = new MusicXmlParser(rawScore).parse()
  // assert.deepStrictEqual(parsedScore, [{}])
})
