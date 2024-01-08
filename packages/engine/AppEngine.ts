import { Input, Output, PortEvent, WebMidi } from "webmidi";
import { AppContext } from "./AppContext";
import { MidiDevice } from "@pianocheat/models";

export class AppEngine {
  private app: AppContext;

  constructor(app: AppContext) {
    this.app = app;
  }

  async initialize() {
    try {
      await WebMidi.enable();
    } catch (e) {
      throw new Error(e?.toString() || "Unknown error");
    }

    this.enumerateMidiDevices();
    // const score = createFromMusicXmlDocument(
    //   "resources/03 - David Hicken - A Day With Youd.musicxml"
    // );
    // console.log("Score:", score);
  }

  private enumerateMidiDevices() {
    function sanitizeMidiDeviceName(text: string) {
      return Array.from(new Set(text.split(" "))).join(" ");
    }

    function getSimplifiedMidiDeviceInfo(device: Input | Output): MidiDevice {
      return {
        name: sanitizeMidiDeviceName(device.name),
        manufacturer: device.manufacturer,
        connected: device.state === "connected",
      };
    }

    this.app.store.setState((state) => {
      for (const _device of WebMidi.inputs) {
        const device = getSimplifiedMidiDeviceInfo(_device);
        state.io.inputs[device.name] = device;
      }
      for (const _device of WebMidi.outputs) {
        const device = getSimplifiedMidiDeviceInfo(_device);
        state.io.outputs[device.name] = device;
      }
    });
    WebMidi.addListener("connected", ({ port: _device }: { port: Input }) => {
      this.app.store.setState((state) => {
        const device = getSimplifiedMidiDeviceInfo(_device);
        const entries =
          _device.type === "input" ? state.io.inputs : state.io.outputs;
        entries[device.name] = device;
      });
    });
    WebMidi.addListener(
      "disconnected",
      ({ port: _device }: { port: Input }) => {
        this.app.store.setState((state) => {
          const device = getSimplifiedMidiDeviceInfo(_device);
          const entries =
            _device.type === "input" ? state.io.inputs : state.io.outputs;
          entries[device.name].connected = false;
        });
      }
    );
  }
}
