import { EventEmitter } from 'events'
import { Data, DataElement, Parameter, ParameterProvider } from '../DataTypes'
import { LauncherSpec, StatefulParameterDefinitions } from '../types'
import { GenericError } from './Error'

export type DebugSessionTerminatedReason =
    | {
          code: 'terminated_on_request' | 'launcher_terminated' | 'inactive_timeout' | 'unknown'
      }
    | {
          code: 'session_terminated'
          exitCode?: number
          signal?: string
          oom: boolean
      }
    | {
          code: 'exception'
          exceptionDetails?: string
      }

export interface IDebugRpc extends EventEmitter {
    /**
     * Event emitted when a debug session exits.
     */
    on(event: 'exit', handler: (params: { debugSessionId: string; reason: DebugSessionTerminatedReason }) => void): this
    emit(event: 'exit', params: { debugSessionId: string; reason: DebugSessionTerminatedReason }): boolean
    removeListener(event: 'exit', handler: (params: { debugSessionId: string; reason: DebugSessionTerminatedReason }) => void): this

    /**
     * Event emitted when output for a debug session is received on standard output (for example console.error).
     */
    on(event: 'stdout', handler: (params: { debugSessionId: string; data: Buffer }) => void): this
    emit(event: 'stdout', params: { debugSessionId: string; data: Buffer }): boolean
    removeListener(event: 'stdout', handler: (params: { debugSessionId: string; data: Buffer }) => void): this

    /**
     * Event emitted when output for a debug session is received on standard error (for example console.error).
     */
    on(event: 'stderr', handler: (params: { debugSessionId: string; data: Buffer }) => void): this
    emit(event: 'stderr', params: { debugSessionId: string; data: Buffer }): boolean
    removeListener(event: 'stderr', handler: (params: { debugSessionId: string; data: Buffer }) => void): this

    /**
     * Event emitted when a debug session has been initialized, which means it's ready to execute functions.
     */
    on(event: 'initialized', handler: (params: { debugSessionId: string }) => void): this
    emit(event: 'initialized', params: { debugSessionId: string }): boolean
    removeListener(event: 'initialized', handler: (params: { debugSessionId: string }) => void): this

    /**
     * Event emitted when output from the remove inspector is received.
     */
    on(event: 'remoteInspectorData', handler: (params: { debugSessionId: string; data: Buffer }) => void): this
    emit(event: 'remoteInspectorData', params: { debugSessionId: string; data: Buffer }): boolean
    removeListener(event: 'remoteInspectorData', handler: (params: { debugSessionId: string; data: Buffer }) => void): this

    /**
     * Start a debug session where a model can be tested.
     * @param modelId The model's ID.
     * @param executionLocation Which launcher to use for running the session.
     * @param options
     * terminateAfterInactiveSeconds: Will automatically terminate the session if no method is called on the debug session for this amount of time. Default: 1800.
     * remoteInspector: Whether to run the process in remote debugger mode, allowing you to place breakpoints and step through the code. Default: true.
     * @param subscribeToEvents If true and connection is WebSocket, immediately subscribes you to events "exit", "stdout", "stderr", "initialized" and "remoteInspectorData" for the debug session. Default: true.
     */
    launchDebugSession(params: {
        modelId: string
        executionLocation: { type: 'persistentLauncher'; persistentLauncherId: string } | { type: 'temporaryLauncher'; spec: LauncherSpec }
        options?: { terminateAfterInactiveSeconds?: number; remoteInspector?: boolean }
        subscribeToEvents?: boolean
    }): Promise<{
        error?:
            | {
                  code: 'model_not_found' | 'invalid_executor_type' | 'persistent_launcher_not_found' | 'quota_exceeded' | 'server_overloaded'
              }
            | GenericError
        result?: {
            debugSessionId: string
        }
    }>

    /**
     * Retrieve information about running debug sessions. If the requested session wasn't returned, it means it doesn't exist (or you don't have access to it).
     * @param debugSessionIds Which sessions to fetch. If unspecified, all running sessions will be fetched.
     */
    getDebugSessions(params: { debugSessionIds?: string[] }): Promise<{
        error?: GenericError
        result?: {
            debugSessions: {
                id: string
                startedAt: number
                modelId: string
                parameterDefinitions: StatefulParameterDefinitions
                trainingSessions: { id: string; createdAt: number; state: 'starting' | 'running' | 'completed' | 'failed' }[]
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
     * Terminate a running debug session.
     * @param debugSessionId The debug session's id.
     */
    terminateDebugSession(params: { debugSessionId: string }): Promise<{
        error?: { code: 'debug_session_not_found' } | GenericError
        result?: {}
    }>

    /**
     * Call the function "createModelState" in a debug session.
     * @param debugSessionId The debug session's id.
     * @param params Parameters to pass to the executor.
     */
    callCreateModelState(params: { debugSessionId: string; params: ParameterProvider[] }): Promise<{
        error?:
            | {
                  code: 'debug_session_not_found' | 'debug_session_terminated'
              }
            | { code: 'dataset_not_found'; datasetId: string }
            | { code: 'exception'; exceptionDetails?: string }
            | GenericError
        result?: {
            dataId: string
            byteSize: number
            segmentByteSizes: number[]
        }
    }>

    /**
     * Call the function "instantiateModel" in a debug session.
     *
     * The id reference to the instantiated model will be returned so that you can call train, evaluate etc. on the model.
     *
     * @param debugSessionId The debug session's id.
     * @param stateData Data to use as model state.
     */
    callInstantiateModel(params: { debugSessionId: string; stateData: { type: 'data'; data: Buffer[] } | { type: 'dataId'; dataId: string } }): Promise<{
        error?:
            | { code: 'debug_session_not_found' | 'debug_session_terminated' | 'state_data_not_found' }
            | { code: 'exception'; exceptionDetails?: string }
            | GenericError
        result?: {
            instantiatedModelId: string
        }
    }>

    /**
     * Call the function "train" on the instantiated model within a debug session.
     * @param debugSessionId The debug session's id.
     * @param instantiatedModelId The id of the instantiated model, as returned by the "callInstantiateModel" function.
     * @param params Parameters to pass to the executor.
     * @returns An ID for the training session, allowing you to check the progress using getTrainingStatus()
     */
    callTrain(params: { debugSessionId: string; instantiatedModelId: string; params: ParameterProvider[] }): Promise<{
        error?:
            | {
                  code: 'debug_session_not_found' | 'instantiated_model_not_found' | 'debug_session_terminated'
              }
            | { code: 'dataset_not_found'; datasetId: string }
            | { code: 'exception'; exceptionDetails?: string }
            | GenericError
        result?: {
            trainingSessionId: string
        }
    }>

    /**
     * Retrieve the status of a training session in a debug session.
     * @param debugSessionId The debug session's id.
     * @param trainingSessionId The id of the training session, as returned by the "callTrain" function.
     */
    getTrainingStatus(params: { debugSessionId: string; trainingSessionId: string }): Promise<{
        error?: { code: 'debug_session_not_found' | 'training_session_not_found' } | GenericError
        result?: {
            id: string
            createdAt: number
            metrics: { name: string; amount: number }[]
            status:
                | {
                      state: 'running'
                      progress: number
                  }
                | {
                      state: 'completed'
                      finishedAt: number
                      trainDuration: number
                  }
                | {
                      state: 'failed'
                      finishedAt: number
                      trainDuration?: number
                      failReason:
                          | {
                                code: 'unknown' | 'cancelled' | 'max_duration_exceeded'
                            }
                          | {
                                code: 'exception'
                                exceptionDetails?: string
                            }
                  }
        }
    }>

    /**
     * Retrieve the metrics of a training session in a debug session.
     * @param debugSessionId The debug session's id.
     * @param trainingSessionId The id of the training session, as returned by the "callTrain" function.
     * @param metrics Which metrics to fetch.
     */
    getTrainingMetrics(params: {
        debugSessionId: string
        trainingSessionId: string
        metrics: { name: string; startIndex: number; amount: number }[]
    }): Promise<{
        error?: { code: 'debug_session_not_found' | 'training_session_not_found' } | GenericError
        result?: {
            metrics: {
                name: string
                startIndex: number
                entries: { timestamp: number; data: Data | DataElement }[]
            }[]
        }
    }>

    /**
     * Cancel a training session in a debug session.
     * @param debugSessionId The debug session's id.
     * @param trainingSessionId The id of the training session, as returned by the "callTrain" function.
     */
    cancelTrainingSession(params: { debugSessionId: string; trainingSessionId: string }): Promise<{
        error?:
            | {
                  code: 'debug_session_not_found' | 'training_session_not_found' | 'training_session_not_running'
              }
            | GenericError
        result?: {}
    }>

    /**
     * Call the function "evaluate" on the instantiated model within a debug session.
     * @param debugSessionId The debug session's id.
     * @param params Input parameters.
     * @param instantiatedModelId The id of the instantiated model, as returned by the instantiateModel function.
     */
    callEvaluate(params: { debugSessionId: string; instantiatedModelId: string; params: ParameterProvider[] }): Promise<{
        error?:
            | {
                  code: 'debug_session_not_found' | 'instantiated_model_not_found' | 'debug_session_terminated'
              }
            | { code: 'dataset_not_found'; datasetId: string }
            | { code: 'exception'; exceptionDetails?: string }
            | GenericError
        result?: {
            output: Parameter[]
        }
    }>

    /**
     * Call the function "getModelState" on the instantiated model within a debug session.
     * @param debugSessionId The debug session's id.
     * @param instantiatedModelId The id of the instantiated model, as returned by the "instantiateModel" function.
     */
    callGetModelState(params: { debugSessionId: string; instantiatedModelId: string }): Promise<{
        error?:
            | {
                  code: 'debug_session_not_found' | 'instantiated_model_not_found' | 'debug_session_terminated'
              }
            | { code: 'exception'; exceptionDetails?: string }
            | GenericError
        result?: {
            dataId: string
            byteSize: number
            segmentByteSizes: number[]
        }
    }>

    /**
     * Download data returned by either "callCreateModelState" or "callGetModelState".
     * @param debugSessionId The debug session's id.
     * @param dataId The data's id, as returned by "callCreateModelState" or "callGetModelState".
     * @param segments Which segments to fetch. Defaults to the first one ([0]).
     */
    downloadStateData(params: { debugSessionId: string; dataId: string; segments?: number[] }): Promise<{
        error?:
            | {
                  code: 'debug_session_not_found' | 'state_data_not_found' | 'segment_out_of_range'
              }
            | GenericError
        result?: {
            data: Buffer[]
        }
    }>

    /**
     * Send a message to the remote inspector.
     */
    sendToRemoteInspector(params: { debugSessionId: string; data: string | Buffer }): Promise<{
        error?: { code: 'debug_session_not_found' | 'not_remote_inspector' } | GenericError
        result?: {}
    }>

    /**
     * If connection is WebSocket, subscribe to events for a debug session. This will allow you to receive output, exit, initialized and remote inspector data events.
     *
     * Subscriptions are based on the WebSocket connection. If you reconnect with a new WebSocket, you must call this again.
     * @param debugSessionId The debug session's id.
     */
    subscribeToEvents(params: { debugSessionId: string }): Promise<{
        error?:
            | {
                  code: 'debug_session_not_found'
              }
            | GenericError
        result?: {}
    }>

    /**
     * Remove the subscription.
     * @param debugSessionId The debug session's id.
     */
    unsubscribeFromEvents(params: { debugSessionId: string }): Promise<{
        error?: { code: 'not_subscribed' | 'too_many_requests' | 'unknown' } | { code: 'invalid_parameter'; parameterName: string; reason: string }
        result?: {}
    }>
}
