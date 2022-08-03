import { EventEmitter } from 'events'
import { Buffer } from 'buffer'
import * as Protocol from './Protocol'
import {
    makeDatasetRpc,
    makeDebugRpc,
    makeFsRpc,
    makeLanguageRpc,
    makeModelRpc,
    makePersistentLauncherRpc,
    makeSpawnedRpc,
    makeTeamRpc,
    makeTerminalRpc,
    makeUserRpc
} from './RPC'
import { IDebugRpc, ITerminalRpc, IDatasetRpc, IModelRpc, ITeamRpc, IUserRpc, ILanguageRpc, IPersistentLauncherRpc, IFsRpc } from './RpcInterfaces'
import { ISpawnedRpc } from './RpcInterfaces/SpawnedRpc'

function isResponseMessage(message: Protocol.ResponseMessage | Protocol.EventMessage): message is Protocol.ResponseMessage {
    return typeof (message as any).id === 'number'
}

export class DecthingsClientClosedError extends Error {
    constructor() {
        super('The RPC call failed because the DecthingsClient was closed, by calling client.close().')
        this.name = 'DecthingsClientClosedError'
    }
}

export class DecthingsClientWebSocketClosedError extends Error {
    constructor(public ev: import('ws').CloseEvent) {
        super('The RPC call failed because the DecthingsClient WebSocket connection was closed.')
        this.name = 'DecthingsClientWebSocketClosedError'
    }
}

const defaultWsAddress = 'wss://app.decthings.com/ws_api/v0'
const defaultHttpAddress = 'https://app.decthings.com/api/v0'

export type DecthingsClientOptions = {
    /**
     * Server address to use for WebSocket API. Defaults to "wss://app.decthings.com/ws_api/v0"
     */
    wsServerAddress?: string
    /**
     * Server address to use for HTTP API. Defaults to "https://app.decthings.com/api/v0"
     */
    httpServerAddress?: string
    /**
     * Optional API key. Some methods require this to be set.
     */
    apiKey?: string
    /**
     * Whether to force use of HTTP, WebSocket. Default is "mixed", where the best will be chosen depending on the method called.
     */
    mode?: 'http' | 'ws' | 'mixed'
}

export declare interface DecthingsClient extends EventEmitter {
    on(event: 'ws_error', handler: (ev: import('ws').ErrorEvent) => void): this
    emit(event: 'ws_error', ev: import('ws').ErrorEvent): boolean
    removeListener(event: 'ws_error', handler: (ev: import('ws').ErrorEvent) => void): this

    on(event: 'ws_close', handler: (ev?: import('ws').CloseEvent) => void): this
    emit(event: 'ws_close', ev?: import('ws').CloseEvent): boolean
    removeListener(event: 'ws_close', handler: (ev?: import('ws').CloseEvent) => void): this

    on(event: 'ws_open', handler: () => void): this
    emit(event: 'ws_open'): boolean
    removeListener(event: 'ws_open', handler: () => void): this

    on(event: 'subscriptions_removed', handler: () => void): this
    emit(event: 'subscriptions_removed'): boolean
    removeListener(event: 'subscriptions_removed', handler: () => void): this

    on(event: 'close', handler: () => void): this
    emit(event: 'close'): boolean
    removeListener(event: 'close', handler: () => void): this

    on(event: 'event', handler: (api: string, eventName: string, params: any[], data: Buffer[]) => void): this
    emit(event: 'event', api: string, eventName: string, params: any[], data: Buffer[]): boolean
    removeListener(event: 'event', handler: (api: string, eventName: string, params: any[], data: Buffer[]) => void): this
}

export class DecthingsClient extends EventEmitter {
    private static WebSocket: (address: string) => InstanceType<typeof import('ws')>
    private static fetch: typeof fetch

    private wsServerAddress: string
    private httpServerAddress: string
    private mode: 'http' | 'ws' | 'mixed'

    #_apiKey?: string
    private _closed = false
    private _waitingResponses = new Map<number, { resolve: (result: { error?: any; result?: any; data: Buffer[] }) => void; reject: (reason: any) => void }>()
    private _listeningForEventIds = new Set<string>()
    private _idCounter = 1

    private _ws: {
        promise: Promise<import('ws')>
        dispose: () => void
    }

    private _createSocket() {
        let disposed = false
        this._ws = {
            dispose: () => {
                disposed = true
            },
            promise: new Promise(async (resolve) => {
                while (true) {
                    if (disposed) {
                        resolve(null)
                        return
                    }

                    const ws = DecthingsClient.WebSocket(this.wsServerAddress)

                    ws.addEventListener('message', (data) => {
                        const parsed = Protocol.deserialize<Protocol.ResponseMessage | Protocol.EventMessage>(
                            typeof data.data === 'string'
                                ? Buffer.from(data.data)
                                : Buffer.isBuffer(data.data)
                                ? data.data
                                : Array.isArray(data.data)
                                ? Buffer.concat(data.data)
                                : Buffer.from(data.data)
                        )
                        if (isResponseMessage(parsed.message)) {
                            const waiting = this._waitingResponses.get(parsed.message.id)
                            if (waiting) {
                                this._waitingResponses.delete(parsed.message.id)
                                waiting.resolve({ result: parsed.message.result, error: parsed.message.error, data: parsed.data })
                            }
                            if (this._waitingResponses.size === 0 && this._listeningForEventIds.size === 0) {
                                setTimeout(() => {
                                    if (this._waitingResponses.size === 0 && this._listeningForEventIds.size === 0) {
                                        if (!this._ws) {
                                            return
                                        }
                                        const _ws = this._ws
                                        delete this._ws
                                        _ws.dispose()
                                    }
                                }, 1000)
                            }
                        } else {
                            this.emit('event', parsed.message.api, parsed.message.event, parsed.message.params, parsed.data)
                        }
                    })

                    const didOpen = await new Promise<boolean>((_resolve) => {
                        const closedListener = (ev: import('ws').CloseEvent) => {
                            this.emit('ws_close', ev)
                            _resolve(false)
                        }
                        const errorListener = (ev: import('ws').ErrorEvent) => {
                            this.emit('ws_error', ev)
                            _resolve(false)
                        }
                        const openListener = () => {
                            ws.removeEventListener('close', closedListener)
                            ws.removeEventListener('error', errorListener)

                            _resolve(true)
                            resolve(ws)

                            if (disposed) {
                                ws.close()
                                return
                            }

                            ws.addEventListener('error', (ev) => {
                                this.emit('ws_error', ev)
                            })
                            ws.addEventListener('close', (ev) => {
                                this.emit('ws_close', ev)
                                if (disposed) {
                                    return
                                }
                                this._waitingResponses.forEach((handler) => {
                                    handler.reject(new DecthingsClientWebSocketClosedError(ev))
                                })
                                this._waitingResponses.clear()
                                this._listeningForEventIds.clear()
                                this.emit('subscriptions_removed')
                                delete this._ws
                            })
                            this.emit('ws_open')

                            _resolve(true)
                        }
                        ws.addEventListener('close', closedListener)
                        ws.addEventListener('error', errorListener)
                        ws.addEventListener('open', openListener)
                    })

                    if (didOpen) {
                        return
                    }

                    await new Promise((_resolve) => setTimeout(_resolve, 100))
                }
            })
        }
    }

    constructor(options: DecthingsClientOptions = {}) {
        super()

        this.wsServerAddress = options.wsServerAddress || defaultWsAddress
        if (typeof this.wsServerAddress !== 'string') {
            throw new Error('Invalid option: Expected wsServerAddress to be a string.')
        }
        this.httpServerAddress = options.httpServerAddress || defaultHttpAddress
        if (typeof this.httpServerAddress !== 'string') {
            throw new Error('Invalid option: Expected httpServerAddress to be a string.')
        }
        this.mode = options.mode || 'mixed'
        if (this.mode !== 'http' && this.mode !== 'mixed' && this.mode !== 'ws') {
            throw new Error('Invalid option: Expected mode to be "http", "ws" or "mixed".')
        }

        const addEvent = (id: string) => {
            this._listeningForEventIds.add(id)
        }
        const removeEvent = (id: string) => {
            this._listeningForEventIds.delete(id)
            if (this._listeningForEventIds.size === 0 && this._waitingResponses.size === 0) {
                if (!this._ws) {
                    return
                }
                const _ws = this._ws
                delete this._ws
                _ws.dispose()
            }
        }

        this.dataset = makeDatasetRpc(this)
        this.debug = makeDebugRpc(this, addEvent, removeEvent)
        this.fs = makeFsRpc(this)
        this.language = makeLanguageRpc(this, addEvent, removeEvent)
        this.model = makeModelRpc(this)
        this.persistentLauncher = makePersistentLauncherRpc(this)
        this.spawned = makeSpawnedRpc(this, addEvent, removeEvent)
        this.team = makeTeamRpc(this)
        this.terminal = makeTerminalRpc(this, addEvent, removeEvent)
        this.user = makeUserRpc(this)

        this.setApiKey(options.apiKey)
    }

    public fs: IFsRpc
    public debug: IDebugRpc
    public terminal: ITerminalRpc
    public spawned: ISpawnedRpc
    public dataset: IDatasetRpc
    public model: IModelRpc
    public team: ITeamRpc
    public user: IUserRpc
    public persistentLauncher: IPersistentLauncherRpc
    public language: ILanguageRpc

    /**
     * Call an RPC method on the server.
     *
     * You most likely want to use the helper classes (client.model, client.data, etc.) instead.
     */
    public async rawMethodCall(
        api: string,
        method: string,
        params: any[],
        data: Buffer[],
        forceWebSocket: boolean = false
    ): Promise<{ error?: any; result?: any; data: Buffer[] }> {
        if (this._closed) {
            throw new DecthingsClientClosedError()
        }
        if (!this._ws && (forceWebSocket || this.mode === 'ws') && this.mode !== 'http') {
            this._createSocket()
        }
        if (this._ws) {
            // Send over WebSocket
            const id = this._idCounter++
            const message: Protocol.RequestMessage = {
                id,
                api,
                method,
                params,
                apiKey: this.#_apiKey
            }
            return new Promise((resolve, reject) => {
                this._waitingResponses.set(id, { resolve, reject })
                this._ws.promise.then((socket) => {
                    socket.send(Protocol.serialize(message, data))
                })
            })
        } else {
            // Send over HTTP
            const headers: string[][] = [['Content-Type', 'application/octet-stream']]
            if (this.#_apiKey) {
                headers.push(['Authorization', `Bearer ${this.#_apiKey}`])
            }
            const body = Protocol.serialize(params, data)
            const response = await DecthingsClient.fetch(`${this.httpServerAddress}/${api}/${method}`, {
                method: 'POST',
                body,
                headers
            })
            if (response.headers.get('Content-Type') !== 'application/octet-stream') {
                throw response
            }
            const responseBody = Buffer.from(await response.arrayBuffer())
            const parsed = Protocol.deserialize<{ result?: any; error?: any }>(responseBody)
            return parsed.message.error ? { error: parsed.message.error, data: parsed.data } : { result: parsed.message.result, data: parsed.data }
        }
    }

    /**
     * Returns true if this client currently uses WebSocket connection instead of HTTP.
     */
    public isWebSocket(): boolean {
        return !this._closed && Boolean(this._ws)
    }

    public setApiKey(apiKey?: string) {
        if (typeof apiKey === 'string') {
            this.#_apiKey = apiKey
        } else if (apiKey === null || apiKey === undefined) {
            this.#_apiKey = undefined
        } else {
            throw new Error('Invalid API key. Expected a string (or null/undefined for no API key), got ' + typeof apiKey)
        }
    }

    public close() {
        if (this._closed) {
            return
        }
        this._closed = true
        this._ws && this._ws.dispose()
        delete this._ws
        this.emit('close')
        this._waitingResponses.forEach((waiting) => {
            waiting.reject(new DecthingsClientClosedError())
        })
    }
}
