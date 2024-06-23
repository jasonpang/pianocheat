import { AppEngine } from "./AppEngine";

export class AppContext {
  store: ReturnType<any>;
  engine: AppEngine;

  constructor() {
    this.engine = new AppEngine(this);
  }

  async initialize() {
    await this.engine.initialize();
  }
}
