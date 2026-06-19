export type EventCallback<T> = (event: { payload: T }) => void

export type UnlistenFn = () => void

export async function listen<T>(_event: string, _handler: EventCallback<T>): Promise<UnlistenFn> {
	return function noop() {}
}

export async function once<T>(_event: string, _handler: EventCallback<T>): Promise<UnlistenFn> {
	return function noop() {}
}

export async function emit<T>(_event: string, _payload?: T): Promise<void> {}
