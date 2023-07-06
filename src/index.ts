import WebSocket from 'ws'
import nodeFetch from 'node-fetch'
import { DecthingsClient } from './Client'
;(DecthingsClient as any).WebSocket = (address: string, headers?: [string, string][]) => {
    const headersObj = {}
    if (headers) {
        for (const header of headers) {
            headersObj[header[0]] = header[1]
        }
    }
    return new WebSocket(address, undefined, { headers: headersObj })
}
;(DecthingsClient as any).fetch = nodeFetch

export * from './DataTypes'
export * from './types'
export * from './Client'
export * from './Rpc'
