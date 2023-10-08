export interface ParsedScore {
  parts: Part[]
}

export interface Part {
  measures: Measure[]
  name?: string
  id: string
}

export interface Measure {
  number: number
  children: MeasureChild[]
}

export type MeasureChild = ParsedNote | Backup | Forward | Attributes

/**
 * Notes are the most common type of MusicXML data. The MusicXML format keeps the MuseData distinction between elements used for sound information and elements used for notation information (e.g., tie is used for sound, tied for notation). Thus grace notes do not have a duration element. Cue notes have a duration element, as do forward elements, but no tie elements. Having these two types of information available can make interchange considerably easier, as some programs handle one type of information much more readily than the other.
 */
export interface ParsedNote {
  kind: 'note'
  /**
   * The chord element indicates that this note is an additional chord tone with the preceding note. Notes that are part of a chord will share the same stem if a stem is present. In MuseData, a missing duration indicates the same length as the previous note, but the MusicXML format requires a duration for chord notes too.
   */
  chord: boolean
  /**
   * The rest element indicates notated rests or silences. Rest elements are usually empty, but placement on the staff can be specified using display-step and display-octave elements. If the measure attribute is set to yes, this indicates this is a complete measure rest.
   */
  rest: boolean
  /**
   * The cue element indicates the presence of a cue note.
   */
  cue: boolean
  /**
   * The grace type indicates the presence of a grace note.
   */
  grace: boolean
  displayPitch: Pitch
  pitch: Pitch
  /**
   * Duration is a positive number specified in division units. This is the intended duration vs. notated duration (for instance, swing eighths vs. even eighths, or differences in dotted notes in Baroque-era music). Differences in duration specific to an interpretation or performance should use the note element's attack and release attributes.
   */
  duration: number
  /**
   * A voice is a sequence of musical events (e.g. notes, chords, rests) that proceeds linearly in time. The voice element is used to distinguish between multiple voices (what MuseData calls tracks) in individual parts. It is defined within a group due to its multiple uses within the MusicXML schema.
   */
  voice: number
  timeModification?: TimeModification
  /**
   * Staff assignment is only needed for music notated on multiple staves. Used by both notes and directions. Staff values are numbers, with 1 referring to the top-most staff in a part.
   */
  staff: number

  notations?: Notation[]
  measure: number
}

/**
 * Notations refer to musical notations, not XML notations. Multiple notations are allowed in order to represent multiple editorial levels. The print-object attribute, added in Version 3.0, allows notations to represent details of performance technique, such as fingerings, without having them appear in the score.
 */
export interface Notation {
  kind: 'notation'
  /**
   * The arpeggiate type indicates that this note is part of an arpeggiated chord.
   */
  arpeggiate?: UpDown
  /**
   * NOTE: <slide> should mark this true as well.
   *
   * Glissando and slide types both indicate rapidly moving from one pitch to the other so that individual notes are not discerned. The distinction is similar to that between NIFF's glissando and portamento elements. A glissando sounds the half notes in between the slide and defaults to a wavy line. The optional text is printed alongside the line.
   */
  glissando?: StartStop
  /**
   * The delayed-inverted-turn element indicates an inverted turn that is delayed until the end of the current note.
   */
  delayedInvertedTurn?: HorizontalTurn
  /**
   * The delayed-turn element indicates a normal turn that is delayed until the end of the current note.
   */
  delayedTurn?: HorizontalTurn
  /**
   * The inverted-mordent element represents the sign without the vertical line. The long attribute is "no" by default.
   */
  invertedMordent?: Mordent
  /**
   * The inverted-turn element has the shape which goes down and then up.
   */
  invertedTurn?: HorizontalTurn
  /**
   * The mordent element represents the sign with the vertical line.
   */
  mordent?: Mordent
  shake?: boolean
  tremolo?: StartStopSingle
  trill?: TrillMark
  tied?: StartStopContinue
  /**
   * The turn element is the normal turn shape which goes up then down.
   */
  turn?: HorizontalTurn
  verticalTurn?: TrillMark
  /**
   * Wavy lines are one way to indicate trills. When used with a measure element, they should always have type="continue" set.
   */
  wavyLine?: WavyLine
}

/**
 * The up-down type is used for the direction of arrows and other pointed symbols like vertical accents, indicating which way the tip is pointing.
 */
export enum UpDown {
  Up = 'up',
  Down = 'down'
}

/**
 * The start-stop type is used for an attribute of musical elements that can either start or stop, such as tuplets.  The values of start and stop refer to how an element appears in musical score order, not in MusicXML document order. An element with a stop attribute may precede the corresponding element with a start attribute within a MusicXML document. This is particularly common in multi-staff music. For example, the stopping point for a tuplet may appear in staff 1 before the starting point for the tuplet appears in staff 2 later in the document.
 */
export enum StartStop {
  Start = 'start',
  Stop = 'stop'
}

/**
 * The start-stop-continue type is used for an attribute of musical elements that can either start or stop, but also need to refer to an intermediate point in the symbol, as for complex slurs or for formatting of symbols across system breaks.  The values of start, stop, and continue refer to how an element appears in musical score order, not in MusicXML document order. An element with a stop attribute may precede the corresponding element with a start attribute within a MusicXML document. This is particularly common in multi-staff music. For example, the stopping point for a slur may appear in staff 1 before the starting point for the slur appears in staff 2 later in the document.
 */
export enum StartStopContinue {
  Start = 'start',
  Stop = 'stop',
  Continue = 'continue'
}

/**
 * The start-stop-single type is used for an attribute of musical elements that can be used for either multi-note or single-note musical elements, as for tremolos.
 */
export enum StartStopSingle {
  Start = 'start',
  Stop = 'stop',
  Single = 'single'
}

/**
 * The start-note type describes the starting note of trills and mordents for playback, relative to the current note.
 */
export enum StartNote {
  Upper = 'upper',
  Main = 'main',
  Below = 'below'
}

/**
 * 	The trill-step attribute describes the alternating note of trills and mordents for playback, relative to the current note.
 */
export enum TrillStep {
  Whole = 'whole',
  Half = 'half',
  Unison = 'unison'
}

/**
 * The two-note-turn attribute describes the ending notes of trills and mordents for playback, relative to the current note.
 */
export enum TwoNoteTurn {
  Whole = 'whole',
  Half = 'half',
  None = 'none'
}

export interface TrillMark {
  kind: 'trillMark'
  /**
   * The start-note type describes the starting note of trills and mordents for playback, relative to the current note.
   */
  startNote?: StartNote
  /**
   * 	The trill-step attribute describes the alternating note of trills and mordents for playback, relative to the current note.
   */
  trillStep?: TrillStep
  /**
   * The two-note-turn attribute describes the ending notes of trills and mordents for playback, relative to the current note.
   */
  twoNoteTurn?: TwoNoteTurn
}

/**
 * Wavy lines are one way to indicate trills. When used with a measure element, they should always have type="continue" set.
 */
export interface WavyLine {
  kind: 'wavyLine'
  /**
   * The start-note type describes the starting note of trills and mordents for playback, relative to the current note.
   */
  startNote?: StartNote
  /**
   * 	The trill-step attribute describes the alternating note of trills and mordents for playback, relative to the current note.
   */
  trillStep?: TrillStep
  /**
   * The two-note-turn attribute describes the ending notes of trills and mordents for playback, relative to the current note.
   */
  twoNoteTurn?: TwoNoteTurn
}

export interface Mordent {
  kind: 'mordent'
  /**
   * The start-note type describes the starting note of trills and mordents for playback, relative to the current note.
   */
  startNote?: StartNote
  /**
   * 	The trill-step attribute describes the alternating note of trills and mordents for playback, relative to the current note.
   */
  trillStep?: TrillStep
  /**
   * The two-note-turn attribute describes the ending notes of trills and mordents for playback, relative to the current note.
   */
  twoNoteTurn?: TwoNoteTurn
}

export interface HorizontalTurn {
  kind: 'horizontalTurn'
  /**
   * The start-note type describes the starting note of trills and mordents for playback, relative to the current note.
   */
  startNote?: StartNote
  /**
   * 	The trill-step attribute describes the alternating note of trills and mordents for playback, relative to the current note.
   */
  trillStep?: TrillStep
  /**
   * The two-note-turn attribute describes the ending notes of trills and mordents for playback, relative to the current note.
   */
  twoNoteTurn?: TwoNoteTurn
}

/**
 * Time modification indicates tuplets, double-note tremolos, and other durational changes. A time-modification element shows how the cumulative, sounding effect of tuplets and double-note tremolos compare to the written note type represented by the type and dot elements. Nested tuplets and other notations that use more detailed information need both the time-modification and tuplet elements to be represented accurately.
 */
export interface TimeModification {
  kind: 'timeModification'
  /**
   * The actual-notes element describes how many notes are played in the time usually occupied by the number in the normal-notes element.
   */
  actualNotes: number
  /**
   * 	The normal-notes element describes how many notes are usually played in the time occupied by the number in the actual-notes element.
   */
  normalNotes: number
}

/**
 * 	Pitch is represented as a combination of the step of the diatonic scale, the chromatic alteration, and the octave.
 */
export interface Pitch {
  kind: 'pitch'
  step: PitchStep
  /**
   * The alter element represents chromatic alteration in number of semitones (e.g., -1 for flat, 1 for sharp). Decimal values like 0.5 (quarter tone sharp) are used for microtones. The octave element is represented by the numbers 0 to 9, where 4 indicates the octave started by middle C.  In the first example below, notice an accidental element is used for the third note, rather than the alter element, because the pitch is not altered from the the pitch designated to that staff position by the key signature.
   */
  alter?: number
  /**
   * Octaves are represented by the numbers 0 to 9, where 4 indicates the octave started by middle C.
   */
  octave: number
}

/**
 * 	The step type represents a step of the diatonic scale, represented using the English letters A through G.
 */
export enum PitchStep {
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
  E = 'E',
  F = 'F',
  G = 'G'
}

/**
 * The backup and forward elements are required to coordinate multiple voices in one part, including music on multiple staves. The backup type is generally used to move between voices and staves. Thus the backup element does not include voice or staff elements. Duration values should always be positive, and should not cross measure boundaries or mid-measure changes in the divisions value.
 */
export interface Backup {
  kind: 'backup'
  /**
   * Duration is a positive number specified in division units. This is the intended duration vs. notated duration (for instance, swing eighths vs. even eighths, or differences in dotted notes in Baroque-era music). Differences in duration specific to an interpretation or performance should use the note element's attack and release attributes.
   */
  duration: number
}

/**
 * The backup and forward elements are required to coordinate multiple voices in one part, including music on multiple staves. The backup type is generally used to move between voices and staves. Thus the backup element does not include voice or staff elements. Duration values should always be positive, and should not cross measure boundaries or mid-measure changes in the divisions value.
 */
export interface Forward {
  kind: 'forward'
  /**
   * Duration is a positive number specified in division units. This is the intended duration vs. notated duration (for instance, swing eighths vs. even eighths, or differences in dotted notes in Baroque-era music). Differences in duration specific to an interpretation or performance should use the note element's attack and release attributes.
   */
  duration: number
  /**
   * A voice is a sequence of musical events (e.g. notes, chords, rests) that proceeds linearly in time. The voice element is used to distinguish between multiple voices (what MuseData calls tracks) in individual parts. It is defined within a group due to its multiple uses within the MusicXML schema.
   */
  voice?: number
  /**
   * Staff assignment is only needed for music notated on multiple staves. Used by both notes and directions. Staff values are numbers, with 1 referring to the top-most staff in a part.
   */
  staff?: number
}

/**
 * The key element represents a key signature. Both traditional and non-traditional key signatures are supported. The optional number attribute refers to staff numbers. If absent, the key signature applies to all staves in the part.
 */
export interface Key {
  kind: 'key'
  /**
   * The fifths type represents the number of flats or sharps in a traditional key signature. Negative numbers are used for flats and positive numbers for sharps, reflecting the key's placement within the circle of fifths (hence the type name).
   */
  fifths: number
  /**
   * The mode type is used to specify major/minor and other mode distinctions. Valid mode values include major, minor, dorian, phrygian, lydian, mixolydian, aeolian, ionian, locrian, and none.
   */
  mode?: string
}

/**
 * Time signatures are represented by the beats element for the numerator and the beat-type element for the denominator.
 */
export interface Time {
  kind: 'time'
  /**
   * The beats element indicates the number of beats, as found in the numerator of a time signature.
   */
  beats: number
  /**
   * The beat-type element indicates the beat unit, as found in the denominator of a time signature.
   */
  beatType: number
}

/**
 * The attributes element contains musical information that typically changes on measure boundaries. This includes key and time signatures, clefs, transpositions, and staving. When attributes are changed mid-measure, it affects the music in score order, not in MusicXML document order.
 */
export interface Attributes {
  kind: 'attributes'
  /**
   * Musical notation duration is commonly represented as fractions. The divisions element indicates how many divisions per quarter note are used to indicate a note's duration. For example, if duration = 1 and divisions = 2, this is an eighth note duration. Duration and divisions are used directly for generating sound output, so they must be chosen to take tuplets into account. Using a divisions element lets us use just one number to represent a duration for each note in the score, while retaining the full power of a fractional representation. If maximum compatibility with Standard MIDI 1.0 files is important, do not have the divisions value exceed 16383.
   */
  divisions?: number
  clef?: {
    sign?: string
  }
  key?: Key
  time?: Time
}
