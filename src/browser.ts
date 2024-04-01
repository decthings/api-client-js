import { DecthingsClient, DecthingsClientOptions } from './client'
;(DecthingsClient as any).WebSocket = (address: string) => {
    const ws = new WebSocket(address)
    ws.binaryType = 'arraybuffer'
    return ws
}
;(DecthingsClient as any).fetch = window.fetch.bind(window)

export * from './tensor'
export * from './types'

export { DecthingsClient, DecthingsClientOptions }
