import { WebSocketTransport } from '@decthings/ds-nodes';
import { config, DecthingsClient } from './Client'

export { DecthingsClient }

config.transport = WebSocketTransport
