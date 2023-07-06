import { EventEmitter } from 'events'
import { GenericError } from './Error'

export interface LanguageRpc extends EventEmitter {
    /**
     * Event emitted when data is received from a language server.
     */
    on(event: 'data', handler: (params: { languageServerId: string; data: Buffer }) => void): this
    emit(event: 'data', params: { languageServerId: string; data: Buffer }): boolean
    removeListener(event: 'data', handler: (params: { languageServerId: string; data: Buffer }) => void): this

    /**
     * Event emitted when a language server exits.
     */
    on(event: 'exit', handler: (params: { languageServerId: string; reason: 'timedout' | 'oom' | 'unknown' }) => void): this
    emit(event: 'exit', params: { languageServerId: string; reason: 'timedout' | 'oom' | 'unknown' }): boolean
    removeListener(event: 'exit', handler: (params: { languageServerId: string; reason: 'timedout' | 'oom' | 'unknown' }) => void): this

    /**
     * Start a new language server with access to the model filesystem.
     * https://microsoft.github.io/language-server-protocol/
     *
     * @param modelId The model's id. Can be set to null to not use any model.
     * @param language The language to use.
     */
    startLanguageServer(params: { modelId: string | null; language: 'python' }): Promise<{
        error?:
            | {
                  code: 'model_not_found' | 'invalid_executor_type' | 'server_overloaded'
              }
            | GenericError
        result?: {
            languageServerId: string
        }
    }>

    /**
     * Send data to a running language server.
     * @param languageServerId The language server's id.
     * @param data Data to send.
     */
    writeToLanguageServer(params: { languageServerId: string; data: Buffer }): Promise<{
        error?:
            | {
                  code: 'language_server_not_found'
              }
            | GenericError
        result?: {}
    }>

    /**
     * Unsubscribe from a language server. This will also terminate it.
     * @param languageServerId The language server's id.
     */
    unsubscribeFromEvents(params: { languageServerId: string }): Promise<{
        error?: { code: 'not_subscribed' | 'too_many_requests' | 'unknown' } | { code: 'invalid_parameter'; parameterName: string; reason: string }
        result?: {}
    }>
}
