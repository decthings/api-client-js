import {
    Model,
    StatefulParameterDefinitions,
    StatelessParameterDefinitions,
    LauncherSpec,
    CompositeModelDefinition,
    EvaluationResultDetails,
    FailedEvaluationResultDetails,
    FilesystemSize,
    LauncherConfig
} from '../types'
import { Data, DataElement, Parameter, ParameterProvider } from '../DataTypes'
import { GenericError } from './Error'

export interface IModelRpc {
    /**
     * Create a new model.
     * @param name The model's name.
     * @param description A description of the model.
     * @param executor Specifies the executor to use for the model.
     * @returns The id of the created model.
     */
    createModel(
        name: string,
        description: string,
        executor:
            | {
                  type: 'NodeJS_js' | 'NodeJS_ts' | 'Python'
                  empty?: boolean
              }
            | { type: 'composite' }
            | {
                  type: 'basedOnModelSnapshot'
                  modelId: string
                  snapshotId: string
                  initialState:
                      | { method: 'copy' }
                      | {
                            method: 'create'
                            name: string
                            params: ParameterProvider[]
                            launcherSpec: LauncherSpec
                        }
                      | { method: 'upload'; name: string; data: Buffer[] }
              }
            | {
                  type: 'fromExisting'
                  modelId: string
                  snapshotId?: string
              }
    ): Promise<{
        error?:
            | {
                  code: 'model_not_found' | 'snapshot_not_found' | 'invalid_executor_type' | 'quota_exceeded' | 'server_overloaded'
              }
            | { code: 'dataset_not_found'; datasetId: string }
            | GenericError
        result?: {
            modelId: string
            isNowCreating: boolean
        }
    }>

    /**
     * Wait for the model create to finish.
     * @param modelId The model's id.
     */
    waitForModelToBeCreated(modelId: string): Promise<{
        error?: { code: 'model_not_found' | 'model_already_created' } | GenericError
        result?: {
            createModelFailed?: {
                error:
                    | { code: 'cancelled' | 'read_limit_exceeded' | 'server_overloaded' | 'unknown' }
                    | {
                          code: 'create_state_error'
                          details:
                              | {
                                    code: 'max_duration_exceeded'
                                    at: 'launchSession' | 'createState'
                                }
                              | {
                                    code: 'launcher_terminated'
                                }
                              | {
                                    code: 'session_terminated'
                                    exitCode?: number
                                    signal?: string
                                }
                              | { code: 'exception'; at: 'launchSession' | 'createState'; exceptionDetails?: string }
                          createInitialStateDurations: {
                              createLauncher: number
                              createSession?: number
                              createState?: number
                          }
                      }
            }
            createModelSuccess?: {
                createInitialStateDurations: {
                    createLauncher: number
                    createSession: number
                    createState: number
                }
            }
        }
    }>

    /**
     * Delete a model and the associated filesystem, snapshots, states etc. If the model is being created, it will be cancelled.
     * @param modelId The model's id.
     */
    deleteModel(modelId: string): Promise<{
        error?: { code: 'model_not_found' | 'access_denied' } | GenericError
        result?: {}
    }>

    /**
     * Create a snapshot of a model.
     * @param modelId The model's id.
     * @param snapshotName The name of the snapshot.
     */
    snapshotModel(
        modelId: string,
        snapshotName: string
    ): Promise<{
        error?: { code: 'model_not_found' | 'access_denied' | 'quota_exceeded' | 'server_overloaded' } | GenericError
        result?: {
            snapshotId: string
        }
    }>

    /**
     * Set the name of a snapshot.
     * @param modelId The model's id.
     * @param snapshotId The snapshot's id.
     * @param newSnapshotName The new name of the snapshot.
     */
    setSnapshotName(
        modelId: string,
        snapshotId: string,
        newSnapshotName: string
    ): Promise<{
        error?: { code: 'model_not_found' | 'snapshot_not_found' | 'access_denied' } | GenericError
        result?: {}
    }>

    /**
     * Delete a snapshot from a model.
     * @param modelId The model's id.
     * @param snapshotId The snapshot's id.
     */
    deleteSnapshot(
        modelId: string,
        snapshotId: string
    ): Promise<{
        error?: { code: 'model_not_found' | 'snapshot_not_found' | 'access_denied' } | GenericError
        result?: {}
    }>

    /**
     * Change information about a model.
     * @param modelId The model's id.
     * @param properties Properties and values to change. Empty fields will not be changed.
     */
    updateModel(
        modelId: string,
        properties: {
            name?: string
            description?: string
            parameterDefinitions?: StatefulParameterDefinitions
            defaultLauncherSpecs?: {
                createState?: LauncherSpec
                evaluate?: LauncherSpec
            }
            maxDurationsSeconds?: {
                launchSession: number
                instantiateModel: number
                createState: number
                train: number
                evaluate: number
            }
            launcherConfig?: LauncherConfig
            compositeModelDefinition?: CompositeModelDefinition
            editingCompositeModelDefinition?: CompositeModelDefinition
        }
    ): Promise<{
        error?:
            | {
                  code: 'model_not_found' | 'access_denied'
              }
            | GenericError
        result?: {}
    }>

    /**
     * Retrieve information about models. If the requested model wasn't returned, it means that the model doesn't exist (or you don't have access to it).
     * @param modelIds Which models to fetch. If unspecified, all models will be fetched.
     */
    getModels(modelIds?: string[]): Promise<{
        error?: GenericError
        result?: {
            models: Model[]
            beingCreated: Model[]
        }
    }>

    /**
     * Change the size of the filesystem used. Increasing the amount will increase the monthly
     * cost but allow you to store more files within the filesystem.
     * @param modelId The model's id.
     * @param newFilesystemSize The new size to use.
     */
    setFilesystemSize(
        modelId: string,
        newFilesystemSize: FilesystemSize
    ): Promise<{
        error?:
            | { code: 'model_not_found' | 'invalid_executor_type' | 'not_enough_space' | 'access_denied' | 'quota_exceeded' | 'server_overloaded' }
            | GenericError
        result?: {}
    }>

    /**
     * Create a new model state by calling the createState function on the model. The created state will be added to the model's state storage.
     * @param modelId The model's id.
     * @param name The name of the new state.
     * @param params Parameters to provide to the model.
     * @param executionLocation Which launcher to use for running the operation.
     */
    createState(
        modelId: string,
        name: string,
        params: ParameterProvider[],
        executionLocation: { type: 'persistentLauncher'; persistentLauncherId: string } | { type: 'createNew'; spec: LauncherSpec }
    ): Promise<{
        error?:
            | {
                  code:
                      | 'model_not_found'
                      | 'persistent_launcher_not_found'
                      | 'invalid_executor_type'
                      | 'snapshot_no_longer_exists'
                      | 'access_denied'
                      | 'quota_exceeded'
              }
            | { code: 'dataset_not_found'; datasetId: string }
            | GenericError
        result?: {
            durations: {
                total: number
                createLauncher?: number
                createSession?: number
                createState?: number
            }
            failed?:
                | {
                      code: 'launcher_terminated' | 'cancelled' | 'read_limit_exceeded' | 'server_overloaded' | 'unknown'
                  }
                | {
                      code: 'session_terminated'
                      exitCode?: number
                      signal?: string
                  }
                | {
                      code: 'max_duration_exceeded'
                      at: 'launchSession' | 'createState'
                  }
                | { code: 'exception'; at: 'launchSession' | 'createState'; exceptionDetails?: string }
            success?: {
                stateId: string
            }
        }
    }>

    /**
     * Create a new model state by uploading data.
     * @param modelId The model's id.
     * @param name The name of the new state.
     * @param data Data to upload.
     * @param deleteStates If provided, these states will be deleted when the new state has been uploaded, in a single atomic operation. If
     * either the upload or the delete fails, both the upload and the delete operations are aborted and an error is returned.
     */
    uploadState(
        modelId: string,
        name: string,
        data: Buffer[],
        deleteStates?: string[]
    ): Promise<{
        error?:
            | { code: 'model_not_found' | 'invalid_executor_type' | 'access_denied' | 'quota_exceeded' | 'state_not_found' | 'state_is_current' }
            | GenericError
        result?: {
            stateId: string
        }
    }>

    /**
     * Cancel the creation of a state.
     * @param modelId The model's id.
     * @param stateId The state's id.
     */
    cancelCreateState(
        modelId: string,
        stateId: string
    ): Promise<{
        error?: { code: 'model_not_found' | 'state_not_found' | 'state_already_created' | 'invalid_executor_type' } | GenericError
        result?: {}
    }>

    /**
     * Get all states that are being created on a model.
     * @param modelId The model's id.
     */
    getCreatingStates(modelId: string): Promise<{
        error?: { code: 'model_not_found' | 'invalid_executor_type' } | GenericError
        result?: {
            states: { id: string; startedAt: number }[]
        }
    }>

    /**
     * Wait for a state that is being created to finish.
     * @param modelId The model's id.
     * @param stateId The state's id.
     */
    waitForStateToBeCreated(
        modelId: string,
        stateId: string
    ): Promise<{
        error?: { code: 'model_not_found' | 'invalid_executor_type' | 'state_not_found' | 'state_already_created' } | GenericError
        result?: {
            createStateFailed?: {
                error:
                    | { code: 'cancelled' | 'read_limit_exceeded' | 'server_overloaded' | 'unknown' }
                    | {
                          code: 'max_duration_exceeded'
                          at: 'launchSession' | 'createState'
                      }
                    | {
                          code: 'launcher_terminated'
                      }
                    | {
                          code: 'session_terminated'
                          exitCode?: number
                          signal?: string
                      }
                    | { code: 'exception'; at: 'launchSession' | 'createState'; exceptionDetails?: string }
                durations: {
                    createLauncher?: number
                    createSession?: number
                    createState?: number
                }
            }
            createStateSuccess?: {
                durations: {
                    createLauncher?: number
                    createSession?: number
                    createState: number
                }
            }
        }
    }>

    /**
     * Modify fields of a state.
     * @param modelId The model's id.
     * @param stateId The id of the state to update.
     * @param properties Properties and values to change. Empty fields will not be changed.
     */
    updateModelState(
        modelId: string,
        stateId: string,
        properties: { name?: string }
    ): Promise<{
        error?: { code: 'model_not_found' | 'invalid_executor_type' | 'state_not_found' | 'access_denied' } | GenericError
        result?: {}
    }>

    /**
     * Set the current state of a model.
     * @param modelId The model's id.
     * @param stateId The id of the state to set as the current state.
     */
    setCurrentModelState(
        modelId: string,
        stateId: string
    ): Promise<{
        error?: { code: 'model_not_found' | 'invalid_executor_type' | 'state_not_found' | 'access_denied' } | GenericError
        result?: {}
    }>

    /**
     * Delete a state.
     * @param modelId The model's id.
     * @param stateId The state's id.
     */
    deleteModelState(
        modelId: string,
        stateId: string
    ): Promise<{
        error?: { code: 'model_not_found' | 'invalid_executor_type' | 'state_not_found' | 'state_is_current' | 'access_denied' } | GenericError
        result?: {}
    }>

    /**
     * Download the data of a model state.
     * @param modelId The model's id.
     * @param segments Which segments to fetch. Defaults to the first one ([0]).
     * @param stateId The state's id. Defaults to the current state.
     */
    getModelState(
        modelId: string,
        segments?: number[],
        stateId?: string
    ): Promise<{
        error?: { code: 'model_not_found' | 'invalid_executor_type' | 'state_not_found' | 'segment_out_of_range' } | GenericError
        result?: {
            data: Buffer[]
        }
    }>

    /**
     * Download the data of a state which belongs to a snapshot.
     * @param modelId The model's id.
     * @param snapshotId The snapshot's id.
     * @param segments Which segments to fetch. Defaults to the first one ([0]).
     */
    getSnapshotState(
        modelId: string,
        snapshotId: string,
        segments?: number[]
    ): Promise<{
        error?: { code: 'model_not_found' | 'invalid_executor_type' | 'snapshot_not_found' | 'segment_out_of_range' } | GenericError
        result?: {
            data: Buffer[]
        }
    }>

    /**
     * Retrieve the parameter definitions for a model.
     * @param modelId The model's id.
     */
    getParameterDefinitions(
        modelId: string,
        snapshotId?: string
    ): Promise<{
        error?:
            | { code: 'model_not_found' | 'snapshot_not_found' }
            | {
                  code: 'unusable_composite_model_definition'
                  reason: { code: 'model_not_found'; modelId: string } | { code: 'other'; reason: string }
              }
            | GenericError
        result?: {
            parameterDefinitions: StatefulParameterDefinitions | StatelessParameterDefinitions
        }
    }>

    /**
     * Start a new training session.
     * @param modelId The model's id.
     * @param newStateName A name to give the new state once it is created.
     * @param params Parameters to pass to the model.
     * @param executionLocation Which launcher to use for running the session.
     * @returns The id of the created training session, used for further reference.
     */
    train(
        modelId: string,
        newStateName: string,
        params: ParameterProvider[],
        executionLocation: { type: 'persistentLauncher'; persistentLauncherId: string } | { type: 'createNew'; spec: LauncherSpec }
    ): Promise<{
        error?:
            | {
                  code:
                      | 'model_not_found'
                      | 'persistent_launcher_not_found'
                      | 'invalid_executor_type'
                      | 'snapshot_no_longer_exists'
                      | 'access_denied'
                      | 'quota_exceeded'
              }
            | { code: 'dataset_not_found'; datasetId: string }
            | GenericError
        result?: {
            trainingSessionId: string
        }
    }>

    /**
     * Retrieve the status of a training session.
     * @param modelId The model's id.
     * @param trainingSessionId The training session's id.
     */
    getTrainingStatus(
        modelId: string,
        trainingSessionId: string
    ): Promise<{
        error?: { code: 'model_not_found' | 'training_session_not_found' } | GenericError
        result?: {
            id: string
            modelId: string
            newStateName: string
            createdAt: number
            metrics: { name: string; amount: number }[]
            launcher:
                | {
                      type: 'persistent'
                      persistentLauncherId: string
                  }
                | {
                      type: 'createNew'
                      spec: LauncherSpec
                  }
            status:
                | {
                      state: 'starting'
                  }
                | {
                      state: 'running'
                      startDurations: {
                          createLauncher?: number
                          createSession?: number
                          createInstantiatedModel?: number
                      }
                      progress: number
                  }
                | {
                      state: 'gettingState'
                      startDurations: {
                          createLauncher?: number
                          createSession?: number
                          createInstantiatedModel?: number
                      }
                      trainDuration: number
                  }
                | {
                      state: 'completed'
                      startDurations: {
                          createLauncher?: number
                          createSession?: number
                          createInstantiatedModel?: number
                      }
                      trainDuration: number
                      getStateDuration: number
                      finishedAt: number
                      createdStateId: string
                  }
                | {
                      state: 'failed'
                      startDurations: {
                          createLauncher?: number
                          createSession?: number
                          createInstantiatedModel?: number
                      }
                      trainDuration?: number
                      getStateDuration?: number
                      finishedAt: number
                      failReason:
                          | {
                                code: 'cancelled' | 'launcher_terminated' | 'read_limit_exceeded' | 'server_overloaded' | 'unknown'
                            }
                          | {
                                code: 'exception'
                                at: 'launchSession' | 'instantiateModel' | 'train' | 'getState'
                                exceptionDetails?: string
                            }
                          | {
                                code: 'session_terminated'
                                exitCode?: number
                                signal?: string
                            }
                          | {
                                code: 'max_duration_exceeded'
                                at: 'launchSession' | 'instantiateModel' | 'train' | 'getState'
                            }
                  }
        }
    }>

    /**
     * Retrieve the metrics of a training session.
     * @param modelId The model's id.
     * @param trainingSessionId The training session's id as returned by train.
     * @param metrics Which metrics to fetch.
     */
    getTrainingMetrics(
        modelId: string,
        trainingSessionId: string,
        metrics: { name: string; startIndex: number; amount: number }[]
    ): Promise<{
        error?: { code: 'model_not_found' | 'training_session_not_found' } | GenericError
        result?: {
            metrics: {
                name: string
                startIndex: number
                entries: { timestamp: number; data: Data | DataElement }[]
            }[]
        }
    }>

    /**
     * Cancel an ongoing training session.
     * @param modelId The model's id.
     * @param trainingSessionId The training session's id as returned by train.
     */
    cancelTrainingSession(
        modelId: string,
        trainingSessionId: string
    ): Promise<{
        error?: { code: 'model_not_found' | 'training_session_not_found' | 'training_session_not_running' | 'access_denied' } | GenericError
        result?: {}
    }>

    /**
     * Clear the data of a finished training session.
     * @param modelId The model's id.
     * @param trainingSessionId The training session's id as returned by train.
     */
    clearPreviousTrainingSession(
        modelId: string,
        trainingSessionId: string
    ): Promise<{
        error?: { code: 'model_not_found' | 'training_session_not_found' | 'training_session_running' | 'access_denied' } | GenericError
        result?: {}
    }>

    /**
     * Get evaluations from a model, given the provided input data.
     * @param modelId The model's id.
     * @param params Parameters to pass to the model.
     * @param snapshotId Optional. If provided, the snapshot with this id will be evaluated.
     */
    evaluate(
        modelId: string,
        params: ParameterProvider[],
        snapshotId?: string
    ): Promise<{
        error?:
            | {
                  code: 'model_not_found' | 'snapshot_not_found' | 'quota_exceeded'
              }
            | {
                  code: 'unusable_composite_model_definition'
                  reason: { code: 'max_nesting_exceeded' } | { code: 'model_not_found'; modelId: string } | { code: 'other'; reason: string }
              }
            | { code: 'dataset_not_found'; datasetId: string }
            | GenericError
        result?: {
            totalDuration: number
            failed?: {
                cancelled: boolean
                executionDetails: FailedEvaluationResultDetails
            }
            success?: {
                executionDetails: EvaluationResultDetails
                output: Parameter[]
            }
        }
    }>

    /**
     * Get running and finished evaluations of a model.
     * @param modelId The model's id.
     */
    getEvaluations(modelId: string): Promise<{
        error?: { code: 'model_not_found' } | GenericError
        result?: {
            running: { id: string; startedAt: number }[]
            finished: { id: string; startedAt: number; finishedAt: number; success: boolean }[]
        }
    }>

    /**
     * Get the results for a finished evaluation. If the evaluation is running, this function will wait for it to finish and then return the results.
     *
     * Results for finished evaluations are only available for a few minutes.
     * @param modelId The model's id.
     * @param evaluationId The id of the evaluation.
     */
    getFinishedEvaluationResult(
        modelId: string,
        evaluationId: string
    ): Promise<{
        error?: { code: 'model_not_found' | 'evaluation_not_found' } | GenericError
        result?: {
            totalDuration: number
            evaluationFailed?: {
                cancelled: boolean
                executionDetails: FailedEvaluationResultDetails
            }
            evaluationSuccess?: {
                output: Parameter[]
                executionDetails: EvaluationResultDetails
            }
        }
    }>

    /**
     * Cancel an ongoing evaluation.
     * @param modelId The model's id.
     * @param evalutionId The id of the evaluation.
     */
    cancelEvaluation(
        modelId: string,
        evalutionId: string
    ): Promise<{
        error?: { code: 'model_not_found' | 'evaluation_not_found' } | GenericError
        result?: {}
    }>

    /**
     * Configure which PersistentLaunchers a model should use.
     * @param modelId The model's id.
     * @param persistentLaunchers A list of info for each persistent launcher.
     */
    setUsedPersistentLaunchersForEvaluate(
        modelId: string,
        persistentLaunchers: { persistentLauncherId: string; level: 'launcher' | 'session' | 'instantiatedModel' }[]
    ): Promise<{
        error?:
            | {
                  code: 'persistent_launcher_not_found' | 'model_not_found' | 'invalid_executor_type' | 'snapshot_no_longer_exists' | 'access_denied'
              }
            | GenericError
        result?: {}
    }>

    /**
     * Retrieve which persistent launchers the model is configured to use.
     * @param modelId The model's id.
     */
    getUsedPersistentLaunchersForEvaluate(modelId: string): Promise<{
        error?: { code: 'model_not_found' | 'invalid_executor_type' } | GenericError
        result?: {
            usedPersistentLaunchers: {
                persistentLauncherId: string
                level: 'launcher' | 'session' | 'instantiatedModel'
            }[]
        }
    }>
}
