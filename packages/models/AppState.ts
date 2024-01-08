export interface Preferences {
  debugging: {
    marker: number;
    preloadTestScore: boolean;
  };
}

export interface MidiDevice {
  name: string;
  manufacturer: string;
  connected: boolean;
}

export interface MidiIo {
  inputs: Record<string, MidiDevice>;
  outputs: Record<string, MidiDevice>;
}

export interface AppState {
  io: MidiIo;
  preferences: Preferences;
}
