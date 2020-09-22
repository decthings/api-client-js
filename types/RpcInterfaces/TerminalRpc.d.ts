import { EventEmitter } from 'events'
import { LauncherSpec } from '../../types'

export interface ITerminalRpc extends EventEmitter {
    on(event: 'data', handler: (terminalSessionId: string, data: string) => void): this
    emit(event: 'data', terminalSessionId: string, data: string): boolean
    removeListener(event: 'data', handler: (terminalSessionId: string, data: string) => void): this

    on(event: 'exit', handler: (terminalSessionId: string, reason: 'deleted_on_request' | 'OOM' | 'inactive_timeout' | 'unknown') => void): this
    emit(event: 'exit', terminalSessionId: string, reason: 'deleted_on_request' | 'OOM' | 'inactive_timeout' | 'unknown'): boolean
    removeListener(event: 'exit', handler: (terminalSessionId: string, reason: 'deleted_on_request' | 'OOM' | 'inactive_timeout' | 'unknown') => void): this

    /**
     * Launches a new terminal session.
     * @param executor The executor to use. Can either be a blueprint or a Node.js executor on a model.
     * @param executionLocation Which launcher to use for running the session.
     * @param options
     * addFileSystemAccess: Adds filesystem access for additional executors. Useful for copying files between executors for example.
     * terminateAfterInactiveSeconds: Will automatically terminate the session if no input is provided for this amount of time. Default: 1800
     * cols: The number of columns to use in the terminal.
     * rows: The number of rows to use in the terminal.
     */
    launchTerminalSession(
        executor:
            | {
                  type: 'blueprint'
                  blueprintId: string
              }
            | {
                  type: 'model'
                  modelId: string
              },
        executionLocation: { type: 'persistentLauncher'; persistentLauncherId: string } | { type: 'createNew'; spec: LauncherSpec },
        options?: {
            addFileSystemAccess?: (
                | {
                      type: 'blueprint'
                      blueprintId: string
                  }
                | {
                      type: 'model'
                      modelId: string
                  }
            )[]
            terminateAfterInactiveSeconds?: number
            cols?: number
            rows?: number
        }
    ): Promise<{
        error?:
            | {
                  code: 'bad_credentials' | 'blueprint_not_found' | 'model_not_found' | 'persistent_launcher_not_found' | 'unknown'
              }
            | { code: 'invalid_parameter'; parameterName: string; reason: string }
        terminalSessionId?: string
    }>

    /**
     * Terminates a running terminal session.
     * @param terminalSessionId The terminal session's id.
     */
    terminateTerminalSession(
        terminalSessionId: string
    ): Promise<{
        error?: { code: 'bad_credentials' | 'terminal_session_not_found' } | { code: 'invalid_parameter'; parameterName: string; reason: string }
    }>

    /**
     * Retrieve information about running terminal sessions. If the requested session wasn't returned, it means it doesn't exist (or you don't have access to it).
     * @param terminalSessionIds Which sessions to fetch. If unspecified, all running sessions will be fetched.
     */
    getTerminalSessions(
        terminalSessionIds?: string[]
    ): Promise<{
        error?: { code: 'bad_credentials' } | { code: 'invalid_parameter'; parameterName: string; reason: string }
        terminalSessions?: { id: string; startedAt: number; executor: { type: 'model'; modelId: string } | { type: 'blueprint'; blueprintId: string } }[]
    }>

    /**
     * Writes data to a running terminal session.
     * @param terminalSessionId The terminal session's id.
     * @param data Data to write.
     */
    writeToTerminalSession(
        terminalSessionId: string,
        data: string
    ): Promise<{
        error?: { code: 'bad_credentials' | 'terminal_session_not_found' | 'unknown' } | { code: 'invalid_parameter'; parameterName: string; reason: string }
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
        error?: { code: 'bad_credentials' | 'terminal_session_not_found' | 'unknown' } | { code: 'invalid_parameter'; parameterName: string; reason: string }
    }>

    /**
     * Give a terminal session filesystem access to additional executors. Useful for copying files between executors for example.
     * @param terminalSessionId The terminal session's id.
     * @param executors The executors to add access to.
     */
    addFileSystemAccessForTerminalSession(
        terminalSessionId: string,
        executors: (
            | {
                  type: 'blueprint'
                  blueprintId: string
              }
            | {
                  type: 'model'
                  modelId: string
              }
        )[]
    ): Promise<{
        error?:
            | {
                  code: 'bad_credentials' | 'terminal_session_not_found' | 'blueprint_not_found' | 'model_not_found' | 'unknown'
              }
            | { code: 'invalid_parameter'; parameterName: string; reason: string }
    }>
}
