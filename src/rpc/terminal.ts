import { EventEmitter } from 'events'
import { LauncherSpec } from '../types'

export type TerminalSessionTerminatedReason =
    | {
          code: 'terminated_on_request' | 'launcher_terminated' | 'inactive_timeout' | 'unknown'
      }
    | {
          code: 'process_exit'
          exitCode?: number
          signal?: string
          oom: boolean
      }

export interface TerminalRpc extends EventEmitter {
    /**
     * Event emitted when a terminal session exits.
     */
    on(event: 'exit', handler: (params: { terminalSessionId: string; reason: TerminalSessionTerminatedReason }) => void): this
    emit(
        event: 'exit',
        params: {
            terminalSessionId: string
            reason: TerminalSessionTerminatedReason
        }
    ): boolean
    removeListener(event: 'exit', handler: (params: { terminalSessionId: string; reason: TerminalSessionTerminatedReason }) => void): this

    /**
     * Event emitted when output for a terminal session is received.
     */
    on(event: 'data', handler: (params: { terminalSessionId: string; data: Buffer }) => void): this
    emit(
        event: 'data',
        params: {
            terminalSessionId: string
            data: Buffer
        }
    ): boolean
    removeListener(event: 'data', handler: (params: { terminalSessionId: string; data: Buffer }) => void): this

    /**
     * Launches a new terminal session.
     */
    launchTerminalSession(params: {
        /** The model's id. */
        modelId: string
        /** Which launcher to use for running the command. */
        executionLocation:
            | {
                  type: 'persistentLauncher'
                  persistentLauncherId: string
              }
            | {
                  type: 'temporaryLauncher'
                  spec: LauncherSpec
              }
        options?: {
            /** Adds filesystem access for additional models. Useful for copying files between models for example. */
            addFilesystemAccess?: {
                modelId: string
            }[]
            /** Will automatically terminate the session if no input is provided for this amount of time. Default: 1800. */
            terminateAfterInactiveSeconds?: number
            /** Terminal columns. */
            cols?: number
            /** Terminal rows. */
            rows?: number
        }
        /** If true, immediately subscribes you to events "data" and "exit" for the terminal. Default: true. */
        subscribeToEvents?: boolean
    }): Promise<{
        error?:
            | {
                  code:
                      | 'model_not_found'
                      | 'persistent_launcher_not_found'
                      | 'quota_exceeded'
                      | 'server_overloaded'
                      | 'bad_credentials'
                      | 'too_many_requests'
                      | 'payment_required'
                      | 'unknown'
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {
            /** A unique identifier which you should use in subsequent API calls. */
            terminalSessionId: string
        }
    }>

    /**
     * Terminates a running terminal session.
     */
    terminateTerminalSession(params: {
        /** The terminal session's id. */
        terminalSessionId: string
    }): Promise<{
        error?:
            | {
                  code: 'terminal_session_not_found' | 'bad_credentials' | 'too_many_requests' | 'payment_required' | 'unknown'
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {}
    }>

    /**
     * Retrieve information about running terminal sessions. If the requested session wasn't returned, it means it
     * doesn't exist (or you don't have access to it).
     */
    getTerminalSessions(params: {
        /** Which sessions to fetch. If unspecified, all running terminals will be fetched. */
        terminalSessionIds?: string[]
    }): Promise<{
        error?:
            | {
                  code: 'bad_credentials' | 'too_many_requests' | 'payment_required' | 'unknown'
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {
            terminalSessions: {
                id: string
                startedAt: number
                modelId: string
                executionLocation:
                    | {
                          type: 'persistentLauncher'
                          persistentLauncherId: string
                          spec: LauncherSpec
                      }
                    | {
                          type: 'temporaryLauncher'
                          spec: LauncherSpec
                      }
            }[]
        }
    }>

    /**
     * Writes data to a running terminal session.
     */
    writeToTerminalSession(params: {
        /** The terminal session's id. */
        terminalSessionId: string
        data: string | Buffer
    }): Promise<{
        error?:
            | {
                  code: 'terminal_session_not_found' | 'bad_credentials' | 'too_many_requests' | 'payment_required' | 'unknown'
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {}
    }>

    /**
     * Resizes a terminal session.
     */
    resizeTerminalSession(params: {
        /** The terminal session's id. */
        terminalSessionId: string
        /** New size to set. */
        size: {
            cols: number
            rows: number
        }
    }): Promise<{
        error?:
            | {
                  code: 'terminal_session_not_found' | 'bad_credentials' | 'too_many_requests' | 'payment_required' | 'unknown'
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {}
    }>

    /**
     * Give a terminal session filesystem access to additional executors. Useful for copying files between executors
     * for example.
     */
    addFilesystemAccessForTerminalSession(params: {
        /** The terminal session's id. */
        terminalSessionId: string
        /** Identifier of the model to add access to. */
        modelId: string
    }): Promise<{
        error?:
            | {
                  code: 'terminal_session_not_found' | 'model_not_found' | 'bad_credentials' | 'too_many_requests' | 'payment_required' | 'unknown'
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {}
    }>

    /**
     * Subscribe to events for a terminal session. This will allow you to receive output and exit events.
     * Subscriptions are based on the WebSocket connection. If you reconnect with a new WebSocket, you must call this
     * again.
     */
    subscribeToEvents(params: {
        /** The terminal session's id. */
        terminalSessionId: string
    }): Promise<{
        error?:
            | {
                  code: 'terminal_session_not_found' | 'bad_credentials' | 'too_many_requests' | 'payment_required' | 'unknown'
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {}
    }>

    /**
     * Remove the subscription.
     */
    unsubscribeFromEvents(params: {
        /** The terminal session's id. */
        terminalSessionId: string
    }): Promise<{
        error?:
            | {
                  code: 'not_subscribed' | 'too_many_requests' | 'unknown'
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {}
    }>
}
