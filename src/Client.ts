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

    private _wsServerAddress: string
    private _httpServerAddress: string
    private _mode: 'http' | 'ws' | 'mixed'

    #_apiKey?: string
    private _closed = false

    private _ws: {
        keepAlive: Set<string>
        call: (api: string, method: string, params: any[], data: Buffer[]) => Promise<{ response: Protocol.Response; data: Buffer[] }>
        dispose: () => void
        disposeIfUnused: () => void
    }

    private _createSocket() {
        const waitingResponses = new Map<number, { resolve: (value: { response: Protocol.Response; data: Buffer[] }) => void; reject: (reason: any) => void }>()

        let disposed = false
        let onDisposed: () => void

        const socketPromise = new Promise<import('ws')>(async (resolve) => {
            while (true) {
                if (disposed) {
                    resolve(null)
                    return
                }

                const ws = DecthingsClient.WebSocket(this._wsServerAddress)

                ws.addEventListener('message', (data) => {
                    if (disposed) {
                        return
                    }
                    const parsed = Protocol.deserializeForWs(
                        typeof data.data === 'string'
                            ? Buffer.from(data.data)
                            : Buffer.isBuffer(data.data)
                            ? data.data
                            : Array.isArray(data.data)
                            ? Buffer.concat(data.data)
                            : Buffer.from(data.data)
                    )
                    if (parsed.response) {
                        const [messageId, response] = parsed.response
                        const waiting = waitingResponses.get(messageId)
                        if (waiting) {
                            waitingResponses.delete(messageId)
                            waiting.resolve({ response, data: parsed.data })
                        }
                        this._ws.disposeIfUnused()
                    } else {
                        this.emit('event', parsed.event.api, parsed.event.event, parsed.event.params, parsed.data)
                    }
                })

                const didOpen = await new Promise<boolean>((_resolve) => {
                    const closedListener = (ev: import('ws').CloseEvent) => {
                        onDisposed = null
                        this.emit('ws_close', ev)
                        _resolve(false)
                    }
                    const errorListener = (ev: import('ws').ErrorEvent) => {
                        onDisposed = null
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

                        onDisposed = () => {
                            ws.close()
                        }

                        ws.addEventListener('error', (ev) => {
                            this.emit('ws_error', ev)
                        })
                        ws.addEventListener('close', (ev) => {
                            this.emit('ws_close', ev)
                            if (disposed) {
                                return
                            }
                            waitingResponses.forEach((handler) => {
                                handler.reject(new DecthingsClientWebSocketClosedError(ev))
                            })
                            waitingResponses.clear()
                            this.emit('subscriptions_removed')
                            this._ws.dispose()
                        })
                        this.emit('ws_open')

                        _resolve(true)
                    }
                    ws.addEventListener('close', closedListener)
                    ws.addEventListener('error', errorListener)
                    ws.addEventListener('open', openListener)

                    onDisposed = () => {
                        ws.removeAllListeners()
                        ws.close()
                        resolve(null)
                        _resolve(true)
                    }
                })

                if (didOpen) {
                    return
                }

                await new Promise((_resolve) => setTimeout(_resolve, 100))
            }
        })

        let idCounter = 0
        const processingRequests = new Set<number>()

        this._ws = {
            keepAlive: new Set(),
            call: (api, method, params, data) => {
                const id = idCounter++
                processingRequests.add(id)
                const message: Protocol.RequestMessage = {
                    api,
                    method,
                    params,
                    apiKey: this.#_apiKey
                }
                return new Promise((resolve, reject) => {
                    waitingResponses.set(id, {
                        resolve: (val) => {
                            resolve(val)
                            setImmediate(() => {
                                if (disposed) {
                                    return
                                }
                                // We dispose processing in next tick in order to not dispose ws between request complete
                                // and addKeepalive
                                processingRequests.delete(id)
                                this._ws.disposeIfUnused()
                            })
                        },
                        reject
                    })
                    socketPromise.then((socket) => {
                        if (!socket) {
                            return
                        }
                        socket.send(Protocol.serializeForWebsocket(id, message, data))
                    })
                })
            },
            dispose: () => {
                disposed = true
                waitingResponses.forEach((handler) => {
                    handler.reject(new DecthingsClientClosedError())
                })
                onDisposed && onDisposed()
                delete this._ws
            },
            disposeIfUnused: () => {
                if (processingRequests.size === 0 && this._ws.keepAlive.size === 0) {
                    this._ws.dispose()
                }
            }
        }
    }

    constructor(options: DecthingsClientOptions = {}) {
        super()

        this._wsServerAddress = options.wsServerAddress || defaultWsAddress
        if (typeof this._wsServerAddress !== 'string') {
            throw new Error('Invalid option: Expected wsServerAddress to be a string.')
        }
        this._httpServerAddress = options.httpServerAddress || defaultHttpAddress
        if (typeof this._httpServerAddress !== 'string') {
            throw new Error('Invalid option: Expected httpServerAddress to be a string.')
        }
        this._mode = options.mode || 'mixed'
        if (this._mode !== 'http' && this._mode !== 'mixed' && this._mode !== 'ws') {
            throw new Error('Invalid option: Expected mode to be "http", "ws" or "mixed".')
        }

        const addKeepalive = (id: string) => {
            if (!this._ws) {
                return
            }
            this._ws.keepAlive.add(id)
        }
        const removeKeepalive = (id: string) => {
            if (!this._ws) {
                return
            }
            this._ws.keepAlive.delete(id)
            this._ws.disposeIfUnused()
        }

        this.dataset = makeDatasetRpc(this)
        this.debug = makeDebugRpc(this, addKeepalive, removeKeepalive)
        this.fs = makeFsRpc(this)
        this.language = makeLanguageRpc(this, addKeepalive, removeKeepalive)
        this.model = makeModelRpc(this)
        this.persistentLauncher = makePersistentLauncherRpc(this)
        this.spawned = makeSpawnedRpc(this, addKeepalive, removeKeepalive)
        this.team = makeTeamRpc(this)
        this.terminal = makeTerminalRpc(this, addKeepalive, removeKeepalive)
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
        if (!this._ws && (forceWebSocket || this._mode === 'ws') && this._mode !== 'http') {
            this._createSocket()
        }
        let res: {
            response: Protocol.Response
            data: Buffer[]
        }
        if (this._ws) {
            // Send over WebSocket
            res = await this._ws.call(api, method, params, data)
        } else {
            // Send over HTTP
            const headers: string[][] = [['Content-Type', 'application/octet-stream']]
            if (this.#_apiKey) {
                headers.push(['Authorization', `Bearer ${this.#_apiKey}`])
            }
            const body = Protocol.serializeForHttp(params, data)
            const response = await DecthingsClient.fetch(`${this._httpServerAddress}/${api}/${method}`, {
                method: 'POST',
                body,
                headers
            })
            if (response.headers.get('Content-Type') !== 'application/octet-stream') {
                throw response
            }
            const responseBody = Buffer.from(await response.arrayBuffer())
            res = Protocol.deserializeForHttp(responseBody)
        }
        if (res.response.error) {
            return { error: res.response.error, data: res.data }
        }
        return { result: res.response.result, data: res.data }
    }

    /**
     * Returns true if this client currently uses WebSocket connection instead of HTTP.
     */
    public isWebSocket(): boolean {
        return Boolean(this._ws)
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
        this.emit('close')
        this._ws && this._ws.dispose()
    }
}
