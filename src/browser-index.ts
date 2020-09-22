import { BrowserWebSocketTransport } from '@decthings/ds-nodes'
import { config, DecthingsClient } from './Client'

config.transport = BrowserWebSocketTransport
config.defaultWsAddress = 'wss://' + location.hostname + '/api'

export { DecthingsClient }
