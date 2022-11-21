import { EventEmitter } from 'events'
import { LauncherSpec } from '../types'
import { GenericError } from './Error'

export type TerminalSessionTerminatedReason =
    | {
          code: 'terminated_on_request' | 'launcher_terminated' | 'inactive_timeout' | 'unknown'
      }
    | {
          code: 'process_exit'
          details: {
              exitCode?: number
              signal?: string
              oom: boolean
          }
      }

export interface ITerminalRpc extends EventEmitter {
    /**
     * Event emitted when output is received from a terminal.
     */
    on(event: 'data', handler: (terminalSessionId: string, data: Buffer) => void): this
    emit(event: 'data', terminalSessionId: string, data: Buffer): boolean
    removeListener(event: 'data', handler: (terminalSessionId: string, data: Buffer) => void): this

    /**
     * Event emitted when a terminal session exits.
     */
    on(event: 'exit', handler: (terminalSessionId: string, reason: TerminalSessionTerminatedReason) => void): this
    emit(event: 'exit', terminalSessionId: string, reason: TerminalSessionTerminatedReason): boolean
    removeListener(event: 'exit', handler: (terminalSessionId: string, reason: TerminalSessionTerminatedReason) => void): this

    /**
     * Launches a new terminal session.
     * @param modelId The model's id.
     * @param executionLocation Which launcher to use for running the session.
     * @param options
     * addFileSystemAccess: Adds filesystem access for additional executors. Useful for copying files between executors for example.
     * terminateAfterInactiveSeconds: Will automatically terminate the session if no input is provided for this amount of time. Default: 1800.
     * cols: The number of columns to use in the terminal.
     * rows: The number of rows to use in the terminal.
     * @param subscribeToEvents If true, immediately subscribes you to events "data" and "exit" for the terminal session. Default: true.
     */
    launchTerminalSession(
        modelId: string,
        executionLocation: { type: 'persistentLauncher'; persistentLauncherId: string } | { type: 'createNew'; spec: LauncherSpec },
        options?: {
            addFileSystemAccess?: { modelId: string }[]
            terminateAfterInactiveSeconds?: number
            cols?: number
            rows?: number
        },
        subscribeToEvents?: boolean
    ): Promise<{
        error?:
            | {
                  code: 'model_not_found' | 'invalid_executor_type' | 'persistent_launcher_not_found' | 'quota_exceeded' | 'server_overloaded'
              }
            | GenericError
        result?: {
            terminalSessionId: string
        }
    }>

    /**
     * Terminates a running terminal session.
     * @param terminalSessionId The terminal session's id.
     */
    terminateTerminalSession(terminalSessionId: string): Promise<{
        error?: { code: 'terminal_session_not_found' } | GenericError
        result?: {}
    }>

    /**
     * Retrieve information about running terminal sessions. If the requested session wasn't returned, it means it doesn't exist (or you don't have access to it).
     * @param terminalSessionIds Which sessions to fetch. If unspecified, all running sessions will be fetched.
     */
    getTerminalSessions(terminalSessionIds?: string[]): Promise<{
        error?: GenericError
        result?: {
            terminalSessions: { id: string; startedAt: number; modelId: string }[]
        }
    }>

    /**
     * Writes data to a running terminal session.
     * @param terminalSessionId The terminal session's id.
     * @param data Data to write.
     */
    writeToTerminalSession(
        terminalSessionId: string,
        data: string | Buffer
    ): Promise<{
        error?: { code: 'terminal_session_not_found' } | GenericError
        result?: {}
    }>

    /**
     * Resizes a terminal session.
     * @param terminalSessionId The terminal session's id.
     * @param size The new size of the terminal.
     */
    resizeTerminalSession(
        terminalSessionId: string,
        size: { cols: number; rows: number }
    ): Promise<{
        error?: { code: 'terminal_session_not_found' } | GenericError
        result?: {}
    }>

    /**
     * Give a terminal session filesystem access to additional executors. Useful for copying files between executors for example.
     * @param terminalSessionId The terminal session's id.
     * @param modelId Model to add access to
     */
    addFilesystemAccessForTerminalSession(
        terminalSessionId: string,
        modelId: string
    ): Promise<{
        error?: { code: 'terminal_session_not_found' | 'invalid_executor_type' | 'model_not_found' } | GenericError
        result?: {}
    }>

    /**
     * Subscribe to events for a terminal session. This will allow you to receive output and exit events.
     *
     * Subscriptions are based on the WebSocket connection. If you reconnect with a new WebSocket, you must call this again.
     * @param terminalSessionId The terminal session's id.
     */
    subscribeToEvents(terminalSessionId: string): Promise<{
        error?:
            | {
                  code: 'terminal_session_not_found'
              }
            | GenericError
        result?: {}
    }>

    /**
     * Remove the subscription.
     * @param terminalSessionId The terminal session's id.
     */
    unsubscribeFromEvents(terminalSessionId: string): Promise<{
        error?: { code: 'not_subscribed' | 'too_many_requests' | 'unknown' } | { code: 'invalid_parameter'; parameterName: string; reason: string }
        result?: {}
    }>
}
