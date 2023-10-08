import { produce } from 'immer'
import { type } from 'os'
import create, { State, SetState, GetState, StoreApi } from 'zustand'
import { Performance, Player } from '../engine/builder/interfaces'
import Midi from '../engine/midi/Midi'
import { persist } from './persist'

export interface NotePress {
  pitch: number
  velocity: number
}

export interface NoteRelease {
  pitch: number
}

export interface ActiveScore {
  musicXmlPath: string
  name: string
  performance: Performance
}

export enum ActiveMode {
  Perform = 'mode-perform',
  Preview = 'mode-preview',
  Annotate = 'mode-annotate'
}

export interface PreviewMode {
  time: number
  active: boolean
}

export interface PerformanceHistoryEntry {
  played: boolean
}

export interface ActivePerformance {
  score: ActiveScore
  mode: ActiveMode
  preview: PreviewMode
  cursors: Record<Player, number>
  pageNumber: number
  history: Record<Player, Record<number, PerformanceHistoryEntry>>
}

export type ColorsConfig = {
  [x in Player]: {
    boxShadow: string
    background: string
  }
}

export interface AppConfig {
  colors: ColorsConfig
  defaultScore: string
}

export interface Store extends State {
  performance?: ActivePerformance
  midi?: Midi
  appConfig: AppConfig
}

type StateCreator<
  T extends State,
  CustomSetState = SetState<T>,
  U extends State = T
> = (set: CustomSetState, get: GetState<T>, api: StoreApi<T>) => U

const immer =
  <T extends State, U extends State>(
    config: StateCreator<T, (fn: (draft: T) => void) => void, U>
  ): StateCreator<T, SetState<T>, U> =>
  (set, get, api) =>
    config((fn) => set(produce(fn) as (state: T) => T), get, api)

const combine =
  <PrimaryState extends State, SecondaryState extends State>(
    initialState: PrimaryState,
    create: (
      set: SetState<PrimaryState>,
      get: GetState<PrimaryState>,
      api: StoreApi<PrimaryState>
    ) => SecondaryState
  ): StateCreator<PrimaryState & SecondaryState> =>
  (set, get, api) =>
    Object.assign(
      {},
      initialState,
      create(
        set as SetState<PrimaryState>,
        get as GetState<PrimaryState>,
        api as StoreApi<PrimaryState>
      )
    )

const combineAndImmer = <
  PrimaryState extends State,
  SecondaryState extends State
>(
  initialState: PrimaryState,
  config: StateCreator<
    PrimaryState,
    (fn: (draft: PrimaryState) => void) => void,
    SecondaryState
  >
): StateCreator<PrimaryState & SecondaryState> => {
  return combine(initialState, immer(config))
}

export const initialStore: Store = {
  appConfig: {
    defaultScore:
      'C:\\code\\piano-studio\\renderer\\test\\songs\\minuet-in-g.musicxml',
    colors: {
      'player-right-hand': {
        background:
          'linear-gradient(hsla(39, 74%, 72%, 1) 20%, rgb(229, 176, 79) 65%, hsla(39, 74%, 72%, 1) 100%)',
        boxShadow:
          'rgba(60, 64, 67, 0.3) 0px 1px 2px 0px, rgba(60, 64, 67, 0.15) 0px 1px 3px 1px'
      },
      'player-left-hand': {
        background:
          'linear-gradient(hsla(192, 47%, 65%, 1) 20%, #59aec3 65%, hsla(192, 47%, 65%, 1) 100%)',
        boxShadow:
          'rgba(60, 64, 67, 0.3) 0px 1px 2px 0px, rgba(60, 64, 67, 0.15) 0px 1px 3px 1px'
      },
      'player-computer': {
        background:
          'linear-gradient(hsla(25, 47%, 65%, 1) 20%, #59aec3 65%, hsla(192, 47%, 65%, 1) 100%)',
        boxShadow:
          'rgba(60, 64, 67, 0.3) 0px 1px 2px 0px, rgba(60, 64, 67, 0.15) 0px 1px 3px 1px'
      },
      'player-muted': {
        background:
          'linear-gradient(hsla(70, 47%, 65%, 1) 20%, #59aec3 65%, hsla(192, 47%, 65%, 1) 100%)',
        boxShadow:
          'rgba(60, 64, 67, 0.3) 0px 1px 2px 0px, rgba(60, 64, 67, 0.15) 0px 1px 3px 1px'
      }
    }
  }
}

console.log({ combineAndImmer, initialStore })
export const useStore = create(
  combineAndImmer(initialStore, (set) => ({
    update: (fn: (store: Store) => void) =>
      set((state) => {
        fn(state)
      })
  }))
)

if (typeof window !== 'undefined') {
  ;(window as any).store = useStore
}
