import {
  RawScore,
  RawScoreNode,
  RawScoreObjectNode
} from '../reader/MusicXmlReader'
import {
  Attributes,
  Backup,
  Forward,
  Measure,
  ParsedNote,
  ParsedScore,
  Part
} from './interfaces'
import { camelize } from 'humps'

export enum MusicXmlParserWarningKind {
  /**
   * The top level of a JSON-parsed raw MusicXML score should have
   * 'part-list' and 'part' object nodes. String value nodes
   * should only be encountered in nested nodes.
   */
  UnexpectedTopLevelStringNode = 'unexpected-top-level-string-node',
  /**
   * A measure node should only contain Note, Backup, Forward, and Attributes as
   * its top-level nodes.
   */
  UnexpectedMeasureLevelValueNode = 'unexpected-measure-level-value-node',
  /**
   * A measure node should only contain Note, Backup, Forward, and Attributes as
   * its top-level nodes.
   */
  UnexpectedMeasureChildNode = 'unexpected-measure-child-node',
  /**
   * The node with <part id="X"/> did not match any part ID from <part-list>.
   */
  UnexpectedPartId = 'unexpected-part-id'
}

export interface MusicXmlParserWarning {
  nodeIndex: number
  kind: MusicXmlParserWarningKind
}

export default class MusicXmlParser {
  private warnings: MusicXmlParserWarning[] = []

  constructor(private rawScore: RawScore) {}

  public parse(): ParsedScore {
    let parts: Part[] = []

    for (let nodeIndex = 0; nodeIndex < this.rawScore.length; nodeIndex++) {
      const node = this.rawScore[nodeIndex]

      if (typeof node === 'string') {
        this.warnings.push({
          nodeIndex,
          kind: MusicXmlParserWarningKind.UnexpectedTopLevelStringNode
        })
        continue
      } else if (node.tagName === 'part-list') {
        parts = this.parsePartListNode(node)
      } else if (node.tagName === 'part') {
        const measures = this.parsePartNode(node)
        const part = parts.find((x) => x.id === node.attributes.id)

        if (!part) {
          this.warnings.push({
            nodeIndex,
            kind: MusicXmlParserWarningKind.UnexpectedTopLevelStringNode
          })
          continue
        }
        part.measures = measures
      }
    }

    return {
      parts
    }
  }

  private parsePartListNode(node: RawScoreObjectNode): Part[] {
    const parts = []

    for (const scorePartNode of node.children) {
      if (
        typeof scorePartNode === 'string' ||
        typeof scorePartNode === 'number'
      ) {
        continue
      }

      const part = {
        id: scorePartNode.attributes['id'],
        measures: [],
        name: ''
      }

      if (scorePartNode.children.length) {
        const partNameNode = scorePartNode.children.find(
          (x) =>
            typeof x !== 'string' &&
            typeof x !== 'number' &&
            x.tagName === 'part-name'
        )
        if (
          typeof partNameNode === 'string' ||
          typeof partNameNode === 'number'
        ) {
          continue
        }

        if (partNameNode) {
          const partName = partNameNode.children[0]

          if (typeof partName === 'string' && partName.length) {
            part.name = partName.trim().toLowerCase()
          }
        }
      }
      parts.push(part)
    }

    return parts
  }

  private parsePartNode(node: RawScoreObjectNode): Measure[] {
    return node.children.map((x) =>
      this.parseMeasureNode(x as RawScoreObjectNode)
    )
  }

  private parseMeasureNode(node: RawScoreObjectNode): Measure {
    const _node: Partial<Measure> = {
      number: parseFloat(node.attributes?.number),
      children: []
    }

    let measureNodeIndex = 0
    for (const child of node.children) {
      if (typeof child === 'string' || typeof child === 'number') {
        this.warnings.push({
          nodeIndex: measureNodeIndex,
          kind: MusicXmlParserWarningKind.UnexpectedMeasureLevelValueNode
        })
        continue
      }

      switch (child.tagName) {
        case 'note':
          _node.children?.push(this.parseNoteNode(child))
          break
        case 'backup':
          _node.children?.push(this.parseBackupNode(child))
          break
        case 'forward':
          _node.children?.push(this.parseForwardNode(child))
          break
        case 'attributes':
          _node.children?.push(this.parseAttributesNode(child))
          break
        default:
          this.warnings.push({
            nodeIndex: measureNodeIndex,
            kind: MusicXmlParserWarningKind.UnexpectedMeasureChildNode
          })
          continue
      }
      measureNodeIndex += 1
    }

    return _node as Measure
  }

  private parseNoteNode(node: RawScoreObjectNode): ParsedNote {
    let note: Partial<ParsedNote> = {
      kind: 'note'
    }

    const simpleNoteObj = this.getSimpleNodesAsObject(node.children)

    for (const child of node.children) {
      if (typeof child === 'number' || typeof child === 'string') {
        continue
      }

      const tagName = camelize(child.tagName)

      switch (tagName) {
        case 'pitch':
          note = {
            ...note,
            [tagName]: this.getSimpleNodesAsObject(child.children, tagName)
          }
          break
        case 'timeModification':
          note = {
            ...note,
            [tagName]: this.getSimpleNodesAsObject(child.children, tagName)
          }
          break
        case 'duration':
        case 'voice':
        case 'staff':
        case 'type':
          note = { ...note, [tagName]: simpleNoteObj[tagName] }
          break
        case 'chord':
        case 'rest':
        case 'cue':
        case 'grace':
          const simpleNoteObj2 = this.getSimpleNodesAsObject(
            node.children,
            undefined,
            true
          )
          note = { ...note, [tagName]: simpleNoteObj2[tagName] }
          break
        case 'notations':
          if (!Array.isArray(note.notations)) {
            note.notations = []
          }
          for (const entry of child.children) {
            if (typeof entry === 'number' || typeof entry === 'string') {
              continue
            }

            switch (entry.tagName) {
              case 'tied':
                if (entry.attributes?.type) {
                  note.notations.push({
                    kind: 'notation',
                    tied: entry.attributes.type
                  })
                }
                break
            }
          }
          break
      }
    }

    return note as ParsedNote
  }

  private parseBackupNode(node: RawScoreObjectNode): Backup {
    return this.getSimpleNodesAsObject(node.children, 'backup')
  }

  private parseForwardNode(node: RawScoreObjectNode): Forward {
    return this.getSimpleNodesAsObject(node.children, 'forward')
  }

  private parseAttributesNode(node: RawScoreObjectNode): Attributes {
    let _node: Attributes = {
      kind: 'attributes'
    }

    for (const child of node.children) {
      if (typeof child === 'number' || typeof child === 'string') {
        continue
      }

      if (child.tagName) {
        _node = {
          ..._node,
          [child.tagName]: this.getSimpleNodesAsObject(
            child.children,
            child.tagName
          )
        }
      }
    }
    return _node
  }

  private getSimpleNodesAsObject(
    nodes: any[],
    kind?: string,
    valueIsTrueIfAnyOrNoChildren?: boolean
  ): any {
    let obj: any = {}

    if (kind) {
      obj.kind = kind
    }

    for (const node of nodes) {
      if (!node) {
        continue
      }

      const tagName =
        typeof node.tagName === 'string' ? camelize(node.tagName) : null

      if (tagName && valueIsTrueIfAnyOrNoChildren) {
        obj[tagName] = true
      } else if (
        tagName &&
        Array.isArray(node.children) &&
        node.children.length === 1
      ) {
        const nodeValue = node.children[0]
        const parsedInt = parseFloat(nodeValue)
        obj[tagName] = isNaN(parsedInt) ? nodeValue : parsedInt
      } else if (tagName && !node.children.length) {
        if (node.attributes) {
          obj[tagName] = { ...node.attributes }
        } else {
          obj[tagName] = true
        }
      } else if (
        (!tagName && typeof node === 'string') ||
        typeof node === 'number'
      ) {
        const parsedInt = parseFloat(node as any)
        obj = isNaN(parsedInt) ? node : parsedInt
      }
    }

    return obj
  }
}
