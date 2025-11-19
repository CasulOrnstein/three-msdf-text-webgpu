import EventEmitter from "./EventEmitter";

export enum Triggers {
  Render = "render",
}

export class Time extends EventEmitter {
  private static instance: Time | null = null;

  private start: number = performance.now();
  private lastGameUpdateTime: number = this.start - 16; // Assume 60HZ for initial render
  private _elapsed: number = 0;
  get elapsedMs(): number {
    return this._elapsed;
  }

  constructor() {
    // Singleton
    if (Time.instance) return Time.instance;

    super();
    Time.instance = this;

    // Setup render tick
    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => {
        this.renderTick();
      });
    }
  }

  public destroy() {
  }

  public static getInstance(): Time {
    if (!Time.instance) {
      throw new Error("Time must be initialized first");
    }
    return Time.instance;
  }

  private renderTick = () => {
    this.gameUpdate();

    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => {
        this.renderTick();
      });
    }
  };

  private gameUpdate = () => {
    // Update time variables
    const currentTime = performance.now();
    const deltaMs = currentTime - this.lastGameUpdateTime;
    this.lastGameUpdateTime = currentTime;
    this._elapsed = this.lastGameUpdateTime - this.start;

    // Trigger render event
    this.trigger(Triggers.Render, [deltaMs]);
  };
}
