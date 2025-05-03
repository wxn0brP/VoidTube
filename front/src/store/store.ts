type Schema = {
    [key: string]: any;
};

type StoreType<T> = {
    [K in keyof T]: T[K] extends object
    ? T[K] extends Array<any>
    ? ReactiveCell<T[K]>
    : (StoreType<T[K]> & ReactiveCell<T[K]>)
    : ReactiveCell<T[K]>;
};

interface ReactiveCell<T> {
    get(): T;
    set(val: T, propagate?: number): void;
    subscribe(listener: (value: T) => void): void;
    notify(propagate?: number): void;
    value: T;
    listeners: Array<(value: T) => void>;
}

export function createStore<T extends Schema>(schema: T, parent?: any): StoreType<T> {
    const store: any = {};
    for (const key in schema) {
        if (schema.hasOwnProperty(key)) {
            const isStore =
                typeof schema[key] === "object" &&
                !Array.isArray(schema[key]) &&
                schema[key] !== null;

            if (isStore) {
                store[key] = createStore(schema[key], parent as any);
            } else {
                store[key] = createStoreValue(store, schema[key]);
            }
        }
    }
    store.listeners = [];
    store.value = undefined;

    store.notify = (propagate: number = 0) => {
        store.listeners.forEach(listener => listener(store));
        if (propagate > 0 && parent && typeof parent.notify === "function") {
            parent.notify(propagate - 1);
        }
    }

    store.get = () => {
        const obj: any = {};
        for (const key in store) {
            if (
                key === "listeners" ||
                key === "value" ||
                key === "notify" ||
                key === "get" ||
                key === "set" ||
                key === "subscribe"
            ) continue;
            if (store.hasOwnProperty(key)) {
                obj[key] = store[key];
            }
        }
        return obj;
    }

    store.set = () => {
        throw new Error("You can't set the entire store");
    }

    store.subscribe = (listener: (value: T) => void) => {
        store.listeners.push(listener);
    }

    return store as StoreType<T>;
}

export function createStoreValue<T>(parent: any, data: T): ReactiveCell<T> {
    const cell: ReactiveCell<T> = {
        value: data,
        listeners: [],
        get: () => cell.value,
        set: (newVal: T, propagation: number = 0) => {
            cell.value = newVal;
            cell.notify(propagation);
        },
        notify: (propagation: number = 0) => {
            cell.listeners.forEach(listener => listener(cell.value));
            if (propagation > 0 && parent && typeof parent.notify === "function") {
                parent.notify(propagation - 1);
            }
        },
        subscribe: (listener: (value: T) => void) => {
            cell.listeners.push(listener);
        },
    };

    return cell;
}