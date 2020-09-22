import { EventEmitter } from 'events'
import { IParameter } from '../DataTypes'
import { DebugSession, TrainingSession, LauncherSpec } from '../../types'

export interface IDebugRpc extends EventEmitter {
    on(
        event: 'exit',
        handler: (
            debugSessionId: string,
            reason:
                | { code: 'deleted_on_request' | 'OOM' | 'inactive_timeout' | 'unknown' }
                | {
                      code: 'create_session_error'
                      details?: {
                          code: 'uncaught_exception'
                          errorDetails?: string
                      }
                  }
        ) => void
    ): this
    emit(
        event: 'exit',
        debugSessionId: string,
        reason:
            | { code: 'deleted_on_request' | 'OOM' | 'inactive_timeout' | 'unknown' }
            | {
                  code: 'create_session_error'
                  details?: {
                      code: 'uncaught_exception'
                      errorDetails?: string
                  }
              }
    ): boolean
    removeListener(
        event: 'exit',
        handler: (
            debugSessionId: string,
            reason:
                | { code: 'deleted_on_request' | 'OOM' | 'inactive_timeout' | 'unknown' }
                | {
                      code: 'create_session_error'
                      details?: {
                          code: 'uncaught_exception'
                          errorDetails?: string
                      }
                  }
        ) => void
    ): this

    on(event: 'stdout', handler: (debugSessionId: string, data: string) => void): this
    emit(event: 'stdout', debugSessionId: string, data: string): boolean
    removeListener(event: 'stdout', handler: (debugSessionId: string, data: string) => void): this

    on(event: 'stderr', handler: (debugSessionId: string, data: string) => void): this
    emit(event: 'stderr', debugSessionId: string, data: string): boolean
    removeListener(event: 'stderr', handler: (debugSessionId: string, data: string) => void): this

    on(event: 'remoteInspector_data', handler: (debugSessionId: string, msg: string) => void): this
    emit(event: 'remoteInspector_data', debugSessionId: string, msg: string): boolean
    removeListener(event: 'remoteInspector_data', handler: (debugSessionId: string, msg: string) => void): this

    /**
     * Start a Node.js executor with the ability to connect a remote inspector.
     * @param executor The executor to debug, either a blueprint or a model.
     * @param remoteInspector Whether or not to start the remote inspector service for this session.
     */
    launchDebugSession(
        executor:
            | {
                  type: 'blueprint'
                  blueprintId: string
              }
            | {
                  type: 'model'
                  modelId: string
              },
        remoteInspector: boolean,
        executionLocation: { type: 'persistentLauncher'; persistentLauncherId: string } | { type: 'createNew'; spec: LauncherSpec },
        options?: { terminateAfterInactiveSeconds?: number }
    ): Promise<{
        error?:
            | {
                  code: 'bad_credentials' | 'blueprint_not_found' | 'model_not_found' | 'persistent_launcher_not_found' | 'unknown'
              }
            | { code: 'launcher_terminated'; reason: 'OOM' | 'unknown' }
            | { code: 'invalid_parameter'; parameterName: string; reason: string }
            | { code: 'invalid_executor_type'; reason: string }
        debugSessionId?: string
    }>

    /**
     * Retrieve information about running debug sessions. If the requested session wasn't returned, it means it doesn't exist (or you don't have access to it).
     * @param debugSessionIds Which sessions to fetch. If unspecified, all running sessions will be fetched.
     */
    getDebugSessions(
        debugSessionIds?: string[]
    ): Promise<{
        error?: { code: 'bad_credentials' } | { code: 'invalid_parameter'; parameterName: string; reason: string }
        debugSessions?: DebugSession[]
    }>

    /**
     * Terminate a running debug session.
     * @param debugSessionId The debug session's id.
     */
    terminateDebugSession(
        debugSessionId: string
    ): Promise<{
        error?: { code: 'bad_credentials' | 'debug_session_not_found' } | { code: 'invalid_parameter'; parameterName: string; reason: string }
    }>

    /**
     * Call the function "createModelState" in a debug session.
     *
     * The created data will be stored in DecthingsFs. The filename of the stored data can be used to instantiate a model.
     * @param debugSessionId The debug session's id.
     * @param params Parameters to pass to the executor.
     */
    callCreateModelState(
        debugSessionId: string,
        params: IParameter[]
    ): Promise<{
        error?:
            | {
                  code: 'bad_credentials' | 'debug_session_not_found' | 'executor_not_stateful' | 'response_not_serializable' | 'unknown'
              }
            | { code: 'invalid_parameter'; parameterName: string; reason: string }
            | { code: 'dataset_not_found'; datasetId: string }
            | { code: 'uncaught_exception'; errorDetails?: string }
        filename?: string
    }>

    /**
     * Call the function "instantiateModel" in a debug session.
     *
     * The id reference to the instantiated model will be returned so that you can call train, evaluate etc. on the model.
     *
     * @param debugSessionId The debug session's id.
     * @param modelStateFilename Filename of the stored data to use as model state.
     */
    callInstantiateModel(
        debugSessionId: string,
        modelStateFilename: string
    ): Promise<{
        error?:
            | { code: 'bad_credentials' | 'debug_session_not_found' | 'executor_not_stateful' | 'unknown' }
            | { code: 'invalid_parameter'; parameterName: string; reason: string }
            | { code: 'uncaught_exception'; errorDetails?: string }
        instantiatedModelId?: string
    }>

    /**
     * Call the function "train" on the instantiated model within a debug session.
     * @param debugSessionId The debug session's id.
     * @param instantiatedModelId The id of the instantiated model, as returned by the instantiateModel function.
     * @param params Parameters to pass to the executor.
     * @returns An ID for the training session, allowing you to check the progress using getTrainingStatus()
     */
    callTrain(
        debugSessionId: string,
        instantiatedModelId: string,
        params: IParameter[]
    ): Promise<{
        error?:
            | { code: 'bad_credentials' | 'debug_session_not_found' | 'executor_not_stateful' | 'unknown' }
            | { code: 'invalid_parameter'; parameterName: string; reason: string }
            | { code: 'dataset_not_found'; datasetId: string }
            | { code: 'uncaught_exception'; errorDetails?: string }
        trainingSessionId?: string
    }>

    /**
     * Retrieve the status of a training job in a debug session.
     * @param debugSessionId The debug session's id.
     * @param trainingSessionId The id of the training session, as returned by the callTrain function.
     */
    getTrainingStatus(
        debugSessionId: string,
        trainingSessionId: string
    ): Promise<{
        error?:
            | { code: 'bad_credentials' | 'debug_session_not_found' | 'executor_not_stateful' | 'training_session_not_found' }
            | { code: 'invalid_parameter'; parameterName: string; reason: string }
        status?: TrainingSession
    }>

    /**
     * Call the function "evaluate" on the instantiated model within a debug session.
     * @param debugSessionId The debug session's id.
     * @param params Parameters to pass to the executor.
     * @param instantiatedModelId Required only for stateful executors. The id of the instantiated model, as returned by the instantiateModel function.
     * @returns A filename pointing to the returned data, stored in DecthingsFs.
     */
    callEvaluate(
        debugSessionId: string,
        params: IParameter[],
        instantiatedModelId?: string
    ): Promise<{
        error?:
            | { code: 'bad_credentials' | 'debug_session_not_found' | 'response_not_serializable' | 'unknown' }
            | { code: 'invalid_parameter'; parameterName: string; reason: string }
            | { code: 'dataset_not_found'; datasetId: string }
            | {
                  code: 'uncaught_exception'
                  errorDetails?: string
              }
        filename?: string
    }>

    /**
     * Call the function "getModelState" on the instantiated model within a debug session.
     * @param debugSessionId The debug session's id.
     * @param instantiatedModelId The id of the instantiated model, as returned by the instantiateModel function.
     * @returns A filename pointing to the returned data, stored in DecthingsFs.
     */
    callGetModelState(
        debugSessionId: string,
        instantiatedModelId: string
    ): Promise<{
        error?:
            | {
                  code: 'bad_credentials' | 'debug_session_not_found' | 'response_not_serializable' | 'executor_not_stateful' | 'unknown'
              }
            | { code: 'invalid_parameter'; parameterName: string; reason: string }
            | {
                  code: 'uncaught_exception'
                  errorDetails?: string
              }
        filename?: string
    }>

    /**
     * Send a message to the remote inspector.
     */
    sendToRemoteInspector(
        debugSessionId: string,
        message: string
    ): Promise<{
        error?:
            | { code: 'bad_credentials' | 'debug_session_not_found' | 'not_remote_inspector' | 'unknown' }
            | { code: 'invalid_parameter'; parameterName: string; reason: string }
    }>

    /**
     * Fetches the remote inspector protocol specification.
     */
    getProtocol(
        debugSessionId: string
    ): Promise<{
        error?:
            | { code: 'bad_credentials' | 'debug_session_not_found' | 'not_remote_inspector' }
            | { code: 'invalid_parameter'; parameterName: string; reason: string }
        protocol?: string
    }>
}
