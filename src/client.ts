import { EventEmitter } from 'events'
import { Buffer } from 'buffer'
import * as Protocol from './protocol'
import {
    makeDatasetRpc,
    makeDebugRpc,
    makeFsRpc,
    makeImageRpc,
    makeLanguageRpc,
    makeModelRpc,
    makeOrganizationRpc,
    makePersistentLauncherRpc,
    makeSpawnedRpc,
    makeTerminalRpc,
    makeUserRpc
} from './rpc_impl'
import { DatasetRpc, DebugRpc, FsRpc, ImageRpc, LanguageRpc, ModelRpc, OrganizationRpc, PersistentLauncherRpc, SpawnedRpc, TerminalRpc, UserRpc } from './rpc'
import { DecthingsClientConnectedWebsocket, DecthingsClientWebsocket, createDecthingsClientWebsocket } from './ws'

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

    private _httpServerAddress: string
    private _extraHeaders: [string, string][]

    private _apiKey?: string
    private _closed = false

    private _ws: DecthingsClientWebsocket

    constructor(options: DecthingsClientOptions = {}) {
        super()

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

        const wsServerAddress = options.wsServerAddress || defaultWsAddress
        if (typeof wsServerAddress !== 'string') {
            throw new Error('Invalid option: Expected wsServerAddress to be a string.')
        }
        this._ws = createDecthingsClientWebsocket({
            WebSocket: DecthingsClient.WebSocket,
            wsServerAddress,
            extraHeaders: this._extraHeaders,
            onClose: (ev) => {
                this.emit('ws_close', ev)
            },
            onError: (ev) => {
                this.emit('ws_error', ev)
            },
            onOpen: () => {
                this.emit('ws_open')
            },
            onSubscriptionsRemoved: () => {
                this.emit('subscriptions_removed')
            },
            onEvent: (api, event, params, data) => {
                this.emit('event', api, event, params, data)
            }
        })

        this.dataset = makeDatasetRpc(this)
        this.debug = makeDebugRpc(this, this._ws.addKeepAlive, this._ws.removeKeepAlive)
        this.fs = makeFsRpc(this)
        this.image = makeImageRpc(this)
        this.language = makeLanguageRpc(this, this._ws.addKeepAlive, this._ws.removeKeepAlive)
        this.model = makeModelRpc(this)
        this.organization = makeOrganizationRpc(this)
        this.persistentLauncher = makePersistentLauncherRpc(this)
        this.spawned = makeSpawnedRpc(this, this._ws.addKeepAlive, this._ws.removeKeepAlive)
        this.terminal = makeTerminalRpc(this, this._ws.addKeepAlive, this._ws.removeKeepAlive)
        this.user = makeUserRpc(this)

        this.setApiKey(options.apiKey)
    }

    public dataset: DatasetRpc
    public debug: DebugRpc
    public fs: FsRpc
    public image: ImageRpc
    public language: LanguageRpc
    public model: ModelRpc
    public organization: OrganizationRpc
    public persistentLauncher: PersistentLauncherRpc
    public spawned: SpawnedRpc
    public terminal: TerminalRpc
    public user: UserRpc

    /**
     * Call an RPC method on the server.
     *
     * You most likely want to use the helper classes (client.model, client.dataset, etc.) instead.
     */
    public async rawMethodCall(
        api: string,
        method: string,
        params: any,
        data: Buffer[],
        mode: 'http' | 'ws' | 'wsIfAvailableOtherwiseNone' = 'http'
    ): Promise<{ notCalled?: true; error?: any; result?: any; data: Buffer[] }> {
        if (this._closed) {
            throw new DecthingsClientClosedError()
        }
        let websocket: DecthingsClientConnectedWebsocket
        if (mode === 'ws') {
            websocket = this._ws.getOrCreateSocket()
        } else if (mode === 'wsIfAvailableOtherwiseNone') {
            websocket = this._ws.maybeGetSocket()
            return { notCalled: true, data: [] }
        }
        let res: {
            response: Protocol.Response
            data: Buffer[]
        }
        if (websocket) {
            // Send over WebSocket
            res = await websocket.call(api, method, params, data, this._apiKey)
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
        this._ws.dispose()
    }
}
