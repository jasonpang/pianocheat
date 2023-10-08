import WebMidi, { InputEventNoteon, InputEventNoteoff } from 'webmidi'
import SingleVoicePlayback from '../performer/SingleVoicePlayback'

export default class Midi {
  private processor!: SingleVoicePlayback

  async initialize() {
    return new Promise<void>((resolve, reject) => {
      if (typeof window !== 'undefined') {
        if (WebMidi.enabled) {
          return
        }

        WebMidi.enable((err) => {
          if (err) {
            console.log('WebMidi could not be enabled.', err)
            reject(err)
          } else {
            resolve()
          }
        })
      }
    })
  }

  connectInput() {
    console.log('MIDI Inputs:', WebMidi.inputs.map((x) => x.name).sort())
    const pedalInput = WebMidi.inputs.find((x) =>
      x.name.toLowerCase().includes('usb midi')
    )
    const digitalPianoInput = WebMidi.inputs.find(
      (x) =>
        x.name.toLowerCase().includes('roland') ||
        x.name.toLowerCase().includes('mpk mini') ||
        x.name.toLowerCase().includes('usb-midi')
    )
    const input = digitalPianoInput

    if (!input) {
      console.log('No MIDI input found.')
      return
    }

    if (pedalInput) {
      console.log('pedal input found:', pedalInput)
      pedalInput.removeListener('controlchange')
      pedalInput.addListener('controlchange', 'all', (e) => {
        console.log(e)
        this.processor.processControlChange(e)
      })
    } else {
      input.removeListener('controlchange')
      input.addListener('controlchange', 'all', (e) => {
        this.processor.processControlChange(e)
      })
    }

    input.removeListener('noteon')
    input.addListener('noteon', 'all', (e) => {
      this.processor.processNoteOnOrOff(e)
    })

    input.removeListener('noteoff')
    input.addListener('noteoff', 'all', (e) => {
      this.processor.processNoteOnOrOff(e)
    })
  }

  setProcessor(processor: SingleVoicePlayback) {
    this.processor = processor

    if (!WebMidi.enabled) {
      return
    }

    WebMidi.removeListener('disconnected')
    WebMidi.addListener('disconnected', (e) => {
      console.log('Disconnected:', e)
    })

    WebMidi.removeListener('connected')
    WebMidi.addListener('connected', (e) => {
      console.log('Connected:', e)
    })

    this.connectInput()
  }
}
