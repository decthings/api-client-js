import { EventEmitter } from 'events'
import { DecthingsParameter, DecthingsParameterProvider, DecthingsTensor } from '../tensor'
import { LauncherSpec, ParameterDefinitions } from '../types'

export type DebugSessionTerminatedReason =
    | {
          code: 'terminated_on_request' | 'launcher_terminated' | 'inactive_timeout' | 'unknown'
      }
    | {
          code: 'code_terminated'
          exitCode?: number
          signal?: string
          oom: boolean
      }
    | {
          code: 'exception'
          exceptionDetails?: string
      }

export interface DebugRpc extends EventEmitter {
    /**
     * Event emitted when a debug session exits.
     */
    on(event: 'exit', handler: (params: { debugSessionId: string; reason: DebugSessionTerminatedReason }) => void): this
    emit(
        event: 'exit',
        params: {
            debugSessionId: string
            reason: DebugSessionTerminatedReason
        }
    ): boolean
    removeListener(event: 'exit', handler: (params: { debugSessionId: string; reason: DebugSessionTerminatedReason }) => void): this

    /**
     * Event emitted when output for a debug session is received on standard output (for example "console.log(msg)").
     */
    on(event: 'stdout', handler: (params: { debugSessionId: string; data: Buffer }) => void): this
    emit(
        event: 'stdout',
        params: {
            debugSessionId: string
            data: Buffer
        }
    ): boolean
    removeListener(event: 'stdout', handler: (params: { debugSessionId: string; data: Buffer }) => void): this

    /**
     * Event emitted when output for a debug session is received on standard output (for example
     * "console.error(msg)").
     */
    on(event: 'stderr', handler: (params: { debugSessionId: string; data: Buffer }) => void): this
    emit(
        event: 'stderr',
        params: {
            debugSessionId: string
            data: Buffer
        }
    ): boolean
    removeListener(event: 'stderr', handler: (params: { debugSessionId: string; data: Buffer }) => void): this

    /**
     * Event emitted when a debug session has been initialized, which means it's ready to execute functions.
     */
    on(event: 'initialized', handler: (params: { debugSessionId: string }) => void): this
    emit(
        event: 'initialized',
        params: {
            debugSessionId: string
        }
    ): boolean
    removeListener(event: 'initialized', handler: (params: { debugSessionId: string }) => void): this

    /**
     * Event emitted when output from the remote inspector is received.
     */
    on(event: 'remoteInspectorData', handler: (params: { debugSessionId: string; data: Buffer }) => void): this
    emit(
        event: 'remoteInspectorData',
        params: {
            debugSessionId: string
            data: Buffer
        }
    ): boolean
    removeListener(event: 'remoteInspectorData', handler: (params: { debugSessionId: string; data: Buffer }) => void): this

    /**
     * Start a debug session where a model can be tested.
     */
    launchDebugSession(params: {
        /** The model's id. */
        modelId: string
        /** Which launcher to use for running the session. */
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
            /**
             * Will automatically terminate the session if no method is called on the debug session for this amount of time.
             * Default: 1800.
             */
            terminateAfterInactiveSeconds?: number
            /**
             * Whether to run the process in remote debugger mode, allowing you to place breakpoints and step through the
             * code. Default: true.
             */
            remoteInspector?: boolean
        }
        /**
         * If true, immediately subscribes you to events "exit", "stdout", "stderr", "initialized" and
         * "remoteInspectorData" for the debug session. Default: true.
         */
        subscribeToEvents?: boolean
    }): Promise<{
        error?:
            | {
                  code:
                      | 'model_not_found'
                      | 'invalid_executor_type'
                      | 'persistent_launcher_not_found'
                      | 'quota_exceeded'
                      | 'server_overloaded'
                      | 'invalid_executable'
                      | 'read_executable_file_failed'
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
            debugSessionId: string
        }
    }>

    /**
     * Retrieve information about running debug sessions. If the requested session wasn't returned, it means it
     * doesn't exist (or you don't have access to it).
     */
    getDebugSessions(params: {
        /** Which sessions to fetch. If unspecified, all sessions will be fetched. */
        debugSessionIds?: string[]
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
            debugSessions: {
                id: string
                startedAt: number
                modelId: string
                parameterDefinitions: ParameterDefinitions
                trainingSessions: {
                    id: string
                    createdAt: number
                    state: 'starting' | 'running' | 'completed' | 'failed'
                }[]
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
     */
    terminateDebugSession(params: {
        /** The debug session's id. */
        debugSessionId: string
    }): Promise<{
        error?:
            | {
                  code: 'debug_session_not_found' | 'bad_credentials' | 'too_many_requests' | 'payment_required' | 'unknown'
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {}
    }>

    /**
     * Call the function "initializeWeights" in a debug session.
     */
    callInitializeWeights(params: {
        /** The debug session's id. */
        debugSessionId: string
        /** Parameters to provide to the function. */
        params: DecthingsParameterProvider[]
    }): Promise<{
        error?:
            | {
                  code: 'debug_session_not_found' | 'debug_session_terminated' | 'bad_credentials' | 'too_many_requests' | 'payment_required' | 'unknown'
              }
            | {
                  code: 'dataset_not_found'
                  datasetId: string
              }
            | {
                  code: 'dataset_key_not_found'
                  datasetId: string
                  datasetKey: string
              }
            | {
                  code: 'exception'
                  exceptionDetails?: string
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {
            dataId: string
            weights: {
                key: string
                byteSize: number
            }[]
        }
    }>

    /**
     * Call the function "instantiateModel" in a debug session.
     */
    callInstantiateModel(params: {
        /** The debug session's id. */
        debugSessionId: string
        /** Data to use as weights. */
        weights:
            | {
                  type: 'data'
                  data: {
                      key: string
                      data: Buffer
                  }[]
              }
            | {
                  type: 'dataId'
                  dataId: string
              }
    }): Promise<{
        error?:
            | {
                  code:
                      | 'debug_session_not_found'
                      | 'debug_session_terminated'
                      | 'weight_data_not_found'
                      | 'bad_credentials'
                      | 'too_many_requests'
                      | 'payment_required'
                      | 'unknown'
              }
            | {
                  code: 'exception'
                  exceptionDetails?: string
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {
            /** A unique identifier which you should use in subsequent API calls. */
            instantiatedModelId: string
        }
    }>

    /**
     * Call the function "train" on the instantiated model within a debug session.
     */
    callTrain(params: {
        /** The debug session's id. */
        debugSessionId: string
        /** Identifier of the instantiated model to use, as returned by the 'callInstantiateModel' function. */
        instantiatedModelId: string
        /** Parameters to provide to the function. */
        params: DecthingsParameterProvider[]
    }): Promise<{
        error?:
            | {
                  code:
                      | 'debug_session_not_found'
                      | 'instantiated_model_not_found'
                      | 'debug_session_terminated'
                      | 'bad_credentials'
                      | 'too_many_requests'
                      | 'payment_required'
                      | 'unknown'
              }
            | {
                  code: 'dataset_not_found'
                  datasetId: string
              }
            | {
                  code: 'dataset_key_not_found'
                  datasetId: string
                  datasetKey: string
              }
            | {
                  code: 'exception'
                  exceptionDetails?: string
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {
            /** A unique identifier which you should use in subsequent API calls. */
            trainingSessionId: string
        }
    }>

    /**
     * Retrieve the status of a training session in a debug session.
     */
    getTrainingStatus(params: {
        /** The debug session's id. */
        debugSessionId: string
        /** Training session identifier, as returned by the 'callTrain' function. */
        trainingSessionId: string
    }): Promise<{
        error?:
            | {
                  code: 'debug_session_not_found' | 'training_session_not_found' | 'bad_credentials' | 'too_many_requests' | 'payment_required' | 'unknown'
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {
            id: string
            createdAt: number
            metrics: {
                name: string
                amount: number
            }[]
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
     */
    getTrainingMetrics(params: {
        /** The debug session's id. */
        debugSessionId: string
        /** Training session identifier, as returned by the 'callTrain' function. */
        trainingSessionId: string
        /** Which metrics to fetch. */
        metrics: {
            name: string
            startIndex: number
            amount: number
        }[]
    }): Promise<{
        error?:
            | {
                  code: 'debug_session_not_found' | 'training_session_not_found' | 'bad_credentials' | 'too_many_requests' | 'payment_required' | 'unknown'
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {
            metrics: {
                name: string
                startIndex: number
                entries: {
                    timestamp: number
                    data: DecthingsTensor
                }[]
            }[]
        }
    }>

    /**
     * Cancel a training session in a debug session.
     */
    cancelTrainingSession(params: {
        /** The debug session's id. */
        debugSessionId: string
        /** Training session identifier, as returned by the 'callTrain' function. */
        trainingSessionId: string
    }): Promise<{
        error?:
            | {
                  code:
                      | 'debug_session_not_found'
                      | 'training_session_not_found'
                      | 'training_session_not_running'
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
        result?: {}
    }>

    /**
     * Call the function "evaluate" on the instantiated model within a debug session.
     */
    callEvaluate(params: {
        /** The debug session's id. */
        debugSessionId: string
        /** Identifier of the instantiated model to use, as returned by the 'callInstantiateModel' function. */
        instantiatedModelId: string
        /** Parameters to provide to the function. */
        params: DecthingsParameterProvider[]
    }): Promise<{
        error?:
            | {
                  code:
                      | 'debug_session_not_found'
                      | 'instantiated_model_not_found'
                      | 'debug_session_terminated'
                      | 'bad_credentials'
                      | 'too_many_requests'
                      | 'payment_required'
                      | 'unknown'
              }
            | {
                  code: 'dataset_not_found'
                  datasetId: string
              }
            | {
                  code: 'dataset_key_not_found'
                  datasetId: string
                  datasetKey: string
              }
            | {
                  code: 'exception'
                  exceptionDetails?: string
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {
            output: DecthingsParameter[]
        }
    }>

    /**
     * Call the function "getWeights" on the instantiated model within a debug session.
     */
    callGetWeights(params: {
        /** The debug session's id. */
        debugSessionId: string
        /** Identifier of the instantiated model to use, as returned by the 'callInstantiateModel' function. */
        instantiatedModelId: string
    }): Promise<{
        error?:
            | {
                  code:
                      | 'debug_session_not_found'
                      | 'instantiated_model_not_found'
                      | 'debug_session_terminated'
                      | 'bad_credentials'
                      | 'too_many_requests'
                      | 'payment_required'
                      | 'unknown'
              }
            | {
                  code: 'exception'
                  exceptionDetails?: string
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {
            dataId: string
            weights: {
                key: string
                byteSize: number
            }[]
        }
    }>

    /**
     * Download data returned by either "callInitializeWeights" or "callGetWeights".
     */
    downloadWeightData(params: {
        /** The debug session's id. */
        debugSessionId: string
        /** The data's id, as returned by 'callInitializeWeights' or 'callGetWeights'. */
        dataId: string
        /** Which weight keys to fetch. Defaults to all keys. */
        keys?: string[]
    }): Promise<{
        error?:
            | {
                  code:
                      | 'debug_session_not_found'
                      | 'weight_data_not_found'
                      | 'weight_key_not_found'
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
            data: {
                key: string
                data: Buffer
            }[]
        }
    }>

    /**
     * Send a message to the remote inspector.
     */
    sendToRemoteInspector(params: {
        /** The debug session's id. */
        debugSessionId: string
        data: string | Buffer
    }): Promise<{
        error?:
            | {
                  code: 'debug_session_not_found' | 'not_remote_inspector' | 'bad_credentials' | 'too_many_requests' | 'payment_required' | 'unknown'
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {}
    }>

    /**
     * Subscribe to events for a debug session. This will allow you to receive output, exit, initialized and remote
     * inspector data events. Subscriptions are based on the WebSocket connection. If you reconnect with a new
     * WebSocket, you must call this again.
     */
    subscribeToEvents(params: {
        /** The debug session's id. */
        debugSessionId: string
    }): Promise<{
        error?:
            | {
                  code: 'debug_session_not_found' | 'bad_credentials' | 'too_many_requests' | 'payment_required' | 'unknown'
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
        /** The debug session's id. */
        debugSessionId: string
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
