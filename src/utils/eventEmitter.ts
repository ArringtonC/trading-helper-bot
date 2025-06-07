type EventCallback = (...args: any[]) => void;

interface Events {
  [eventName: string]: EventCallback[];
}

const eventEmitter = (() => {
  const events: Events = {};

  const on = (eventName: string, callback: EventCallback): (() => void) => {
    if (!events[eventName]) {
      events[eventName] = [];
    }
    events[eventName].push(callback);

    // Return an unsubscribe function
    return () => {
      events[eventName] = events[eventName].filter(cb => cb !== callback);
      if (events[eventName].length === 0) {
        delete events[eventName];
      }
    };
  };

  const off = (eventName: string, callback: EventCallback): void => {
    if (!events[eventName]) return;

    events[eventName] = events[eventName].filter(cb => cb !== callback);
    if (events[eventName].length === 0) {
      delete events[eventName];
    }
  };

  const dispatch = (eventName: string, ...args: any[]): void => {
    if (!events[eventName]) return;

    // Create a copy of the callbacks array in case a callback unsubscribes itself
    const callbacks = [...events[eventName]];
    callbacks.forEach(callback => {
      callback(...args);
    });
  };

  return {
    on,
    off,
    dispatch,
  };
})();

export default eventEmitter; 