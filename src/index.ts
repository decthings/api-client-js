import WebSocket from 'ws'
import nodeFetch from 'node-fetch'
import { DecthingsClient, DecthingsClientOptions } from './Client'

;(DecthingsClient as any).WebSocket = (address: string) => new WebSocket(address)
;(DecthingsClient as any).fetch = nodeFetch

export * from './DataTypes'
export * from './types'

export { DecthingsClient, DecthingsClientOptions }
