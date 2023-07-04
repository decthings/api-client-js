import { DecthingsClient, DecthingsClientOptions } from './Client'
;(DecthingsClient as any).WebSocket = (address: string) => {
    const ws = new WebSocket(address)
    ws.binaryType = 'arraybuffer'
    return ws
}
;(DecthingsClient as any).fetch = window.fetch.bind(window)

export * from './DataTypes'
export * from './types'

export { DecthingsClient, DecthingsClientOptions }
