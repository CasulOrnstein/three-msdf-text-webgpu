type EventCallback = (...args: any[]) => any;

export default class EventEmitter {
  private events = new Map<string, Set<EventCallback>>();

  on(eventName: string, callback: EventCallback) {
    if (!eventName) return;

    const callbacks = this.events.get(eventName) || new Set();
    callbacks.add(callback);
    this.events.set(eventName, callbacks);
  }

  off(eventName: string) {
    if (!eventName) return;
    this.events.delete(eventName);
  }

  trigger(eventName: string, args: any[] = []): any {
    const callbacks = this.events.get(eventName);
    if (!callbacks) return undefined;

    let result: any;
    for (const callback of callbacks) {
      result = callback(...args);
    }
    return result;
  }
}
