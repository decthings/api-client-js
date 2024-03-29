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
} from './RpcImpl'
import { DatasetRpc, DebugRpc, FsRpc, LanguageRpc, ModelRpc, PersistentLauncherRpc, SpawnedRpc, TeamRpc, TerminalRpc, UserRpc } from './Rpc'

export class DecthingsClientError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'DecthingsClientError'
    }
}

export class DecthingsClientClosedError extends DecthingsClientError {
    constructor() {
        super('The RPC call was not performed because the DecthingsClient was closed, by calling client.close()')
        this.name = 'DecthingsClientClosedError'
    }
}

export class DecthingsClientInvalidRequestError extends DecthingsClientError {
    constructor(reason: string) {
        super(`The RPC call was not performed because the provided parameters was invalid: ${reason}`)
        this.name = 'DecthingsClientInvalidRequestError'
    }
}

export class DecthingsClientWebSocketClosedError extends DecthingsClientError {
    constructor(public ev: import('ws').CloseEvent) {
        super('The RPC call failed because the DecthingsClient WebSocket connection was closed')
        this.name = 'DecthingsClientWebSocketClosedError'
    }
}

export class DecthingsClientFetchError extends DecthingsClientError {
    constructor(public fetchError: Error) {
        super(`The RPC call failed with fetch error: ${fetchError.message}`)
        this.name = 'DecthingsClientFetchError'
    }
}

export class DecthingsClientHttpError extends DecthingsClientError {
    constructor(public response: import('node-fetch').Response) {
        super(`The RPC call failed with HTTP status ${response.status}`)
        this.name = 'DecthingsClientHttpError'
    }
}

export class DecthingsClientInvalidResponseError extends DecthingsClientError {
    constructor(public reason: string) {
        super(`The RPC call failed because the response was invalid: ${reason}`)
        this.name = 'DecthingsClientInvalidResponseError'
    }
}

const defaultHttpAddress = 'https://api.decthings.com/v0'
const defaultWsAddress = 'wss://api.decthings.com/v0/ws'

export type DecthingsClientOptions = {
    /**
     * Server address to use for HTTP API. Defaults to "https://api.decthings.com/v0"
     */
    httpServerAddress?: string
    /**
     * Server address to use for WebSocket API. Defaults to "wss://api.decthings.com/v0/ws"
     */
    wsServerAddress?: string
    /**
     * Optional API key. Some methods require this to be set.
     */
    apiKey?: string
    /**
     * Optional additional headers to include with each request.
     */
    extraHeaders?: [string, string][]
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

    on(event: 'event', handler: (api: string, eventName: string, params: any, data: Buffer[]) => void): this
    emit(event: 'event', api: string, eventName: string, params: any, data: Buffer[]): boolean
    removeListener(event: 'event', handler: (api: string, eventName: string, params: any, data: Buffer[]) => void): this
}

export class DecthingsClient extends EventEmitter {
    private static WebSocket: (address: string, extraHeaders?: [string, string][]) => InstanceType<typeof import('ws')>
    private static fetch: typeof import('node-fetch').default

    private _wsServerAddress: string
    private _httpServerAddress: string
    private _extraHeaders: [string, string][]

    _apiKey?: string
    private _closed = false

    private _ws: {
        keepAlive: Set<string>
        call: (api: string, method: string, params: any, data: Buffer[]) => Promise<{ response: Protocol.Response; data: Buffer[] }>
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

                const ws = DecthingsClient.WebSocket(this._wsServerAddress, this._extraHeaders)

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
                    apiKey: this._apiKey
                }
                return new Promise((resolve, reject) => {
                    waitingResponses.set(id, {
                        resolve: (val) => {
                            resolve(val)
                            setTimeout(() => {
                                if (disposed) {
                                    return
                                }
                                // We dispose processing in next tick in order to not dispose ws between request complete
                                // and addKeepalive
                                processingRequests.delete(id)
                                this._ws.disposeIfUnused()
                            }, 0)
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
        if (options.extraHeaders) {
            if (!Array.isArray(options.extraHeaders)) {
                throw new Error('Invalid option: Expected extraHeaders to be an array.')
            }
            for (const header of options.extraHeaders) {
                if (!Array.isArray(header)) {
                    throw new Error('Invalid option: Expected extraHeaders to be an array containing arrays.')
                }
                if (header.length !== 2) {
                    throw new Error('Invalid option: Expected each header to be an array of length 2.')
                }
                if (header.some((el) => typeof el !== 'string')) {
                    throw new Error(`Invalid option: Expected each header to be an array of strings, got ${header.find((el) => typeof el !== 'string')}`)
                }
            }
            this._extraHeaders = options.extraHeaders
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

    public fs: FsRpc
    public debug: DebugRpc
    public terminal: TerminalRpc
    public spawned: SpawnedRpc
    public dataset: DatasetRpc
    public model: ModelRpc
    public team: TeamRpc
    public user: UserRpc
    public persistentLauncher: PersistentLauncherRpc
    public language: LanguageRpc

    /**
     * Call an RPC method on the server.
     *
     * You most likely want to use the helper classes (client.model, client.data, etc.) instead.
     */
    public async rawMethodCall(
        api: string,
        method: string,
        params: any,
        data: Buffer[],
        mode: 'http' | 'ws' = 'http'
    ): Promise<{ error?: any; result?: any; data: Buffer[] }> {
        if (this._closed) {
            throw new DecthingsClientClosedError()
        }
        if (!this._ws && mode === 'ws') {
            this._createSocket()
        }
        let res: {
            response: Protocol.Response
            data: Buffer[]
        }
        if (mode === 'ws') {
            // Send over WebSocket
            res = await this._ws.call(api, method, params, data)
        } else {
            // Send over HTTP
            const headers: [string, string][] = [['Content-Type', 'application/octet-stream']]
            if (this._apiKey) {
                headers.push(['Authorization', `Bearer ${this._apiKey}`])
            }
            if (this._extraHeaders) {
                headers.push(...this._extraHeaders)
            }
            const body = Protocol.serializeForHttp(params, data)
            let response: import('node-fetch').Response
            try {
                response = await DecthingsClient.fetch(`${this._httpServerAddress}/${api}/${method}`, {
                    method: 'POST',
                    body,
                    headers
                })
            } catch (e) {
                throw new DecthingsClientFetchError(e)
            }
            if (!response.ok) {
                throw new DecthingsClientHttpError(response)
            }
            if (response.headers.get('Content-Type') !== 'application/octet-stream') {
                throw new DecthingsClientInvalidResponseError('Expected Content-Type: application/octet-stream for the response')
            }
            let responseBody: Buffer
            try {
                responseBody = Buffer.from(await response.arrayBuffer())
            } catch (e) {
                throw new DecthingsClientFetchError(e)
            }
            try {
                res = Protocol.deserializeForHttp(responseBody)
            } catch (e) {
                throw new DecthingsClientInvalidResponseError(`Failed to parse response body because of the following exception:\n${e.stack}`)
            }
        }
        if (res.response.error) {
            return { error: res.response.error, data: res.data }
        }
        return { result: res.response.result, data: res.data }
    }

    public hasWebSocket(): boolean {
        return Boolean(this._ws)
    }

    public setApiKey(apiKey?: string) {
        if (typeof apiKey === 'string') {
            this._apiKey = apiKey.trim()
        } else if (apiKey === null || apiKey === undefined) {
            this._apiKey = undefined
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
