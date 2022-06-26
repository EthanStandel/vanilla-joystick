class MutableState<T> implements MutableState<T> {
  private subscribers: Array<{ id: number; callback: (latest: T) => void }> =
    [];

  constructor(private current: T) {}

  get() {
    return this.current;
  }

  set(current: T) {
    this.current = current;
    this.subscribers.forEach(({ callback }) => callback(this.current));
  }

  subscribe(callback: (latest: T) => void) {
    const id = Math.random();
    this.subscribers.push({ id, callback });

    return {
      id,
      unsubscribe: () => this.unsubscribe(id),
    };
  }

  unsubscribe(id: number) {
    this.subscribers = this.subscribers.filter(
      (subscriber) => subscriber.id !== id
    );
  }

  clearSubscribers() {
    this.subscribers = [];
  }
}

function createMutableState<T>(): MutableState<T | undefined>;
function createMutableState<T>(value: T): MutableState<T>;
function createMutableState<T>(value?: T) {
  return new MutableState(value);
}

export type { MutableState };
export { createMutableState };
