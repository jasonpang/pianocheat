export interface Preferences {
  debugging: {
    marker: number;
  };
}

export interface AppState {
  preferences: Preferences;
}
