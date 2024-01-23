import { create as produce, apply, Patches, Draft } from "mutative";

interface IChangePack {
  patches: Patches;
  senderId?: number;
}

const DEBUG_STATE_CHANGES = true;

export function createServerStore<T>({
  state,
  broadcastChange,
}: {
  state: T;
  broadcastChange: (change: IChangePack) => void;
}) {
  let innerState = state;
  let lastChange: IChangePack = { patches: [] };
  let listeners: ((state: T, change: IChangePack) => void)[] = [];
  let isUpdating = false;

  window.electronStateSyncIpc.onSyncedElectronStateEvent(
    (event: IpcMainInvokeEvent | IpcRendererEvent, change: IChangePack) => {
      if (change.patches.length === 0) {
        return;
      }

      isUpdating = true;

      const nextState = apply(innerState, change.patches);
      lastChange = {
        ...change,
        senderId: -1, // renderer always receives from main so let's say id is -1
      };

      broadcastChange();

      innerState = nextState;

      isUpdating = false;

      for (let i = 0; i < listeners.length; i++) {
        const listener = listeners[i];
        listener(innerState, change);
      }
    }
  );

  function broadcastChange() {
    if (lastChange.patches.length === 0) {
      return;
    }

    // if lastChange was from main, we don't send it to main again
    lastChange.senderId !== -1 &&
      window.electronStateSyncIpc.sendStateChange(lastChange);
  }

  function setState(
    recipe: (draft: Draft<T>) => void,
    broadcastChangesLocally?: boolean
  ) {
    isUpdating = true;

    const [nextState, patches] = produce(innerState, recipe, {
      enablePatches: true,
      strict: true,
    });
    lastChange = { patches };

    broadcastChange();

    innerState = nextState;
    isUpdating = false;

    if (broadcastChangesLocally) {
      for (let i = 0; i < listeners.length; i++) {
        const listener = listeners[i];
        listener(innerState, lastChange);
      }
    }

    return nextState;
  }

  function getState(): T {
    if (isUpdating) {
      throw new Error(
        "You may not call store.getState() inside setState method. " +
          "It has already received the state as an argument. "
      );
    }

    return innerState;
  }

  function onClientStateDeltaReceived(change: IChangePack) {
    if (DEBUG_STATE_CHANGES) {
      console.log(
        `[State] Received client state update delta:`,
        JSON.stringify(change.patches, null, 4)
      );
    }
  }

  function subscribe(listener: (state: T, change: IChangePack) => void) {
    if (typeof listener !== "function") {
      throw new Error("Expected the listener to be a function.");
    }

    if (isUpdating) {
      throw new Error(
        "You may not call store.subscribe() inside store.setState(). "
      );
    }

    listeners.push(listener);

    // run once for the first time for every one who just subscribed
    listener(innerState, lastChange);

    return function unsubscribe() {
      if (isUpdating) {
        throw new Error(
          "You may not unsubscribe from a store listener while the state is updating. "
        );
      }

      const index = listeners.indexOf(listener);
      listeners.splice(index, 1);
    };
  }

  return { setState, getState, subscribe };
}
