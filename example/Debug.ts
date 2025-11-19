import { Pane } from "tweakpane";
import Stats from "stats-gl";

import { Experience } from "./Experience";

export class Debug {
  private static _instance: Debug | null = null;
  public static getInstance(): Debug {
    if (!Debug._instance) { throw new Error("Debug must be initialized"); }
    return Debug._instance;
  }

  // Shorthand static properties
  static get active() { return this._instance?._active ?? false; }
  static get pane() { return this._instance?._debugPane ?? null; }
  static get stats() { return this._instance?._stats ?? null; }
  
  private _debugPane: Pane | null = null;
  private _stats: Stats | null = null;
  
  constructor(private _active: boolean = false) {
    if (Debug._instance) return Debug._instance;
    Debug._instance = this;

    if (this._active) {
      (window as any).experience = this; // Attach to window for debugging
      this._debugPane = new Pane({ expanded: true });
      this._debugPane.element.style.position = "absolute";
      this._debugPane.element.style.top = "0";
      this._debugPane.element.style.right = "0";
      this._debugPane.element.style.zIndex = "10";
      this._stats = new Stats({ trackGPU: true, horizontal: false });
      Experience.getInstance().parentElement.appendChild(this._stats.dom);
    }
  }

  public update() {
    if (this._active) {
      this._stats?.update();
    }
  }

  public destroy() {
    this._stats?.dom.remove();
  }
}