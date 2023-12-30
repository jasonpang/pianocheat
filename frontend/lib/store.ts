import { createSharedStore } from './SyncedElectronState'
import { StoreApi, create as createZustandStore, UseBoundStore } from 'zustand'
import { create as produce, apply, Draft } from 'mutative'
import { AppState } from '../../modules/models/AppState'
import { useEffect, useState } from 'react'

const DEBUG_BACKEND_STATE_CHANGES = false

let initialFrontendStoreState: AppState = null

let syncedStore: Awaited<ReturnType<typeof createSharedStore>>

let useStore: UseBoundStore<StoreApi<AppState>>

export function useFrontendStore() {
  const isAwaitingInitialBackendStore = initialFrontendStoreState === null

  const [isInitializing, setIsInitializing] = useState(
    isAwaitingInitialBackendStore
  )

  useEffect(function initializeFrontendStore() {
    if (!isAwaitingInitialBackendStore) {
      return
    }

    window.electronStateSyncIpc.initialBackendStateForFrontendState.then(
      (result) => {
        initialFrontendStoreState = result
        setIsInitializing(false)
        syncedStore = createSharedStore(initialFrontendStoreState)
        useStore = createZustandStore<AppState>(() => initialFrontendStoreState)
        syncedStore.subscribe((state, change) => {
          if (DEBUG_BACKEND_STATE_CHANGES) {
            console.log(
              `Mirroring backend store updates on frontend store:`,
              JSON.stringify(change.patches, null, 4)
            )
          }

          // Listen to backend state updates, and mirror changes to our frontend store
          useStore.setState((state) => {
            return apply(state, change.patches)
          })
        })
      }
    )
  }, [])

  return { isInitializing, useStore }
}

export const updateStore = (fn: (draft: Draft<AppState>) => void) => {
  const isAwaitingInitialBackendStore = initialFrontendStoreState === null

  if (isAwaitingInitialBackendStore) {
    throw new Error(
      'Cannot update frontend state until it initializes with initial backend state.'
    )
  }

  useStore.setState((state) => {
    const [nextState, patches] = produce(
      state,
      (draft) => {
        fn(draft)
      },
      {
        enablePatches: true,
        strict: true
      }
    )

    // Send frontend store changes to the backend to be applied, via our synced store which performs background IPC calls
    syncedStore.setState((state) => {
      return apply(state, patches)
    })

    return nextState
  })
}
