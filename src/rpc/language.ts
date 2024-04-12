import { EventEmitter } from 'events'

export interface LanguageRpc extends EventEmitter {
    /**
     * Event emitted when a language server exits.
     */
    on(event: 'exit', handler: (params: { languageServerId: string; reason: 'timedout' | 'oom' | 'unknown' }) => void): this
    emit(
        event: 'exit',
        params: {
            languageServerId: string
            reason: 'timedout' | 'oom' | 'unknown'
        }
    ): boolean
    removeListener(event: 'exit', handler: (params: { languageServerId: string; reason: 'timedout' | 'oom' | 'unknown' }) => void): this

    /**
     * Event emitted when data is received from a language server.
     */
    on(event: 'data', handler: (params: { languageServerId: string; data: Buffer }) => void): this
    emit(
        event: 'data',
        params: {
            languageServerId: string
            data: Buffer
        }
    ): boolean
    removeListener(event: 'data', handler: (params: { languageServerId: string; data: Buffer }) => void): this

    /**
     * Start a new language server with access to the model filesystem.
     *
     * See [Language server protocol](https://microsoft.github.io/language-server-protocol/).
     */
    startLanguageServer(params: {
        /** The model's id. */
        modelId: string
        /** The language to use. */
        language: 'go' | 'python' | 'rust'
    }): Promise<{
        error?:
            | {
                  code: 'model_not_found' | 'server_overloaded' | 'bad_credentials' | 'too_many_requests' | 'payment_required' | 'unknown'
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {
            /** A unique identifier which you should use in subsequent API calls. */
            languageServerId: string
        }
    }>

    /**
     * Send data to a running language server.
     */
    writeToLanguageServer(params: {
        /** The language server's id. */
        languageServerId: string
        /** Data to write. */
        data: Buffer
    }): Promise<{
        error?:
            | {
                  code: 'language_server_not_found' | 'bad_credentials' | 'too_many_requests' | 'payment_required' | 'unknown'
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {}
    }>

    /**
     * Unsubscribe from a language server. This will also terminate it.
     */
    unsubscribeFromEvents(params: {
        /** The language server's id. */
        languageServerId: string
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
