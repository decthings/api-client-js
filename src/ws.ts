import { Buffer } from 'buffer'
import { DecthingsClientClosedError, DecthingsClientWebSocketClosedError } from './client'
import * as Protocol from './protocol'

export type WebSocketConstructor = (address: string, extraHeaders?: [string, string][]) => InstanceType<typeof import('ws')>

export type DecthingsClientWebsocket = {
    addKeepAlive: (id: string) => void
    removeKeepAlive: (id: string) => void

    maybeGetSocket: () => DecthingsClientConnectedWebsocket
    getOrCreateSocket: () => DecthingsClientConnectedWebsocket

    dispose: () => void
}

export type DecthingsClientConnectedWebsocket = {
    call: (api: string, method: string, params: any, data: Buffer[], apiKey?: string) => Promise<{ response: Protocol.Response; data: Buffer[] }>
}

export function createDecthingsClientWebsocket(options: {
    WebSocket: WebSocketConstructor
    wsServerAddress: string
    extraHeaders?: [string, string][]
    onEvent: (api: string, event: string, params: any, data: Buffer[]) => void
    onOpen: () => void
    onError: (ev: import('ws').ErrorEvent) => void
    onClose: (ev: import('ws').CloseEvent) => void
    onSubscriptionsRemoved: () => void
}): DecthingsClientWebsocket {
    let ws: {
        ws: DecthingsClientConnectedWebsocket
        keepAlive: Set<string>
        dispose: () => void
        disposeIfUnused: () => void
    } = null

    function createWs() {
        const waitingResponses = new Map<number, { resolve: (value: { response: Protocol.Response; data: Buffer[] }) => void; reject: (reason: any) => void }>()

        let disposed = false
        let onDisposed: () => void

        const socketPromise = new Promise<import('ws')>(async (resolve) => {
            while (true) {
                if (disposed) {
                    resolve(null)
                    return
                }

                const sock = options.WebSocket(options.wsServerAddress, options.extraHeaders)

                sock.addEventListener('message', (data) => {
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

                        ws.disposeIfUnused()
                    } else {
                        options.onEvent(parsed.event.api, parsed.event.event, parsed.event.params, parsed.data)
                    }
                })

                const didOpen = await new Promise<boolean>((_resolve) => {
                    const closedListener = (ev: import('ws').CloseEvent) => {
                        onDisposed = null
                        options.onClose(ev)
                        _resolve(false)
                    }
                    const errorListener = (ev: import('ws').ErrorEvent) => {
                        onDisposed = null
                        options.onError(ev)
                        _resolve(false)
                    }
                    const openListener = () => {
                        sock.removeEventListener('close', closedListener)
                        sock.removeEventListener('error', errorListener)

                        _resolve(true)
                        resolve(sock)

                        if (disposed) {
                            sock.close()
                            return
                        }

                        onDisposed = () => {
                            sock.close()
                        }

                        sock.addEventListener('error', (ev) => {
                            options.onError(ev)
                        })
                        sock.addEventListener('close', (ev) => {
                            options.onClose(ev)
                            if (disposed) {
                                return
                            }
                            waitingResponses.forEach((handler) => {
                                handler.reject(new DecthingsClientWebSocketClosedError(ev))
                            })
                            waitingResponses.clear()
                            ws.dispose()
                        })
                        options.onOpen()

                        _resolve(true)
                    }
                    sock.addEventListener('close', closedListener)
                    sock.addEventListener('error', errorListener)
                    sock.addEventListener('open', openListener)

                    onDisposed = () => {
                        sock.removeAllListeners()
                        sock.close()
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

        ws = {
            keepAlive: new Set(),
            ws: {
                call: (api, method, params, data, apiKey) => {
                    const id = idCounter++
                    processingRequests.add(id)
                    const message: Protocol.RequestMessage = {
                        api,
                        method,
                        params,
                        apiKey: apiKey || undefined
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
                                    ws.disposeIfUnused()
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
                }
            },
            dispose: () => {
                disposed = true
                waitingResponses.forEach((handler) => {
                    handler.reject(new DecthingsClientClosedError())
                })
                onDisposed && onDisposed()
                if (ws.keepAlive.size != 0) {
                    options.onSubscriptionsRemoved()
                }
                ws = null
            },
            disposeIfUnused: () => {
                if (processingRequests.size === 0 && ws.keepAlive.size === 0) {
                    ws.dispose()
                }
            }
        }
    }

    const addKeepAlive = (id: string) => {
        if (!ws) {
            return
        }
        ws.keepAlive.add(id)
    }
    const removeKeepAlive = (id: string) => {
        if (!ws) {
            return
        }
        ws.keepAlive.delete(id)
        ws.disposeIfUnused()
    }

    return {
        addKeepAlive,
        removeKeepAlive,
        maybeGetSocket: () => {
            if (ws) {
                return ws.ws
            }
            return null
        },
        getOrCreateSocket: () => {
            if (!ws) {
                createWs()
            }
            return ws.ws
        },
        dispose: () => {
            ws && ws.dispose()
        }
    }
}
