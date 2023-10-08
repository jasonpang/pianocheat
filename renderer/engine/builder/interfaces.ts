import { ParsedNote, ParsedScore } from '../parser/interfaces'

export interface CachedNoteSetInfo {
  time: number
  noteSet: ParsedNote[]
}

export interface CachedMeasureInfo {
  /**
   * The time offset that occurs in both players.
   */
  matchingNoteSetTimes: number[]
  /**
   * The note with the smallest offset is this number.
   */
  minOffsetTime: number
  /**
   * The note with the longest's duration + offset combo is this number.
   */
  maxOffsetTime: number
  noteSets: CachedNoteSetInfo[]
}
export enum Player {
  LeftHand = 'player-left-hand',
  RightHand = 'player-right-hand',
  Computer = 'player-computer',
  Muted = 'player-muted'
}

export interface ScoreBuilderContext {
  logs: LogEntry[]
  input: ParsedScore
}

export enum LogLevel {
  Debug,
  Info,
  Warning,
  Failure
}

export type LogEntry = {
  message: string
  severity: LogLevel
}

export interface EntryScoreProcessor {
  process(input: ParsedScore): PlayableScore
}

export interface PlayerMapping {
  part: {
    number: number
    name: string
  }
  staff: number
  player: Player
}

export interface BuildingNote extends ParsedNote {}

export interface Note {
  duration: number
}

export type TimeWiseScore = Record<number, Note[]>

export type PartitionedParsedScore = Record<Player, ParsedNote[]>

export type PlayableScore = Record<Player, TimeWiseScore>

export interface MeasureBoundary {
  measureNumber: number
  leftEdge: number
  rightEdge: number
}

export interface PerformanceMeta {
  /**
   * Used to know the number of background staff lines to render.
   */
  scoreLengthInDivisionUnits: number
  /**
   * Used to know the range of pitches to display.
   */
  highestScorePitch: number
  /**
   * Used to know the range of pitches to display.
   */
  lowestScorePitch: number
  /**
   * A measure boundary line should be drawn at each division offset.
   */
  measureDivisionBoundaries: MeasureBoundary[]
}

export interface Performance {
  // meta: PerformanceMeta
  score?: PlayableScore
  intermediateScore: Record<Player, Record<number, ParsedNote[]>>
  cachedNoteSetsByMeasure: Record<Player, Record<number, CachedMeasureInfo>>
  pitchRange: { lowest: number; highest: number }
}
