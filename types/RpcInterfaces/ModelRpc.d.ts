import { IParameter } from '../DataTypes'

import { Model, TrainingSession, StatefulParameterDefinitions, StatelessParameterDefinitions, LauncherSpec } from '../../types'

export interface IModelRpc {
    /**
     * Create a new model based on a blueprint.
     * @param name The model's name.
     * @param description A short description of the model.
     * @param executor Specifies the executor to use for the model.
     * @param initialState Only for type "blueprint": The initial state to apply.
     * @returns The id of the created model.
     */
    createModel(
        name: string,
        description: string,
        executor:
            | {
                  type:
                      | 'NodeJS_stateful'
                      | 'NodeJS_stateless'
                      | 'Python2_stateful'
                      | 'Python2_stateless'
                      | 'Python3_stateful'
                      | 'Python3_stateless'
                      | 'composite'
              }
            | { type: 'blueprint'; blueprintId: string; blueprintVersion: string },
        initialState?:
            | {
                  title: string
                  type: 'create'
                  params: IParameter[]
                  launcherSpec?: LauncherSpec
                  maxDurationsSeconds?: { launchSession: number; createState: number }
              }
            | { title: string; type: 'fromJSON'; value: string },
        empty?: boolean
    ): Promise<{
        failed?: {
            error:
                | {
                      code: 'bad_credentials' | 'blueprint_not_found' | 'blueprint_version_not_found' | 'cancelled' | 'unknown'
                  }
                | { code: 'invalid_parameter'; parameterName: string; reason: string }
                | { code: 'dataset_not_found'; datasetId: string }
        }
        success?: {
            modelId: string
            isNowCreating: boolean
        }
    }>

    /**
     * Wait for the model create to finish.
     * @param modelId
     */
    waitForModelToBeCreated(
        modelId: string
    ): Promise<{
        failed?: {
            error: { code: 'bad_credentials' | 'creatingModel_not_found' } | { code: 'invalid_parameter'; parameterName: string; reason: string }
        }
        success?: {
            createModelFailed?: {
                error:
                    | { code: 'cancelled' | 'unknown' }
                    | {
                          code: 'create_state_error'
                          details:
                              | {
                                    code: 'response_not_serializable' | 'session_terminated' | 'maxDurationExceeded'
                                }
                              | {
                                    code: 'launcher_terminated'
                                    reason: 'OOM' | 'unknown'
                                }
                              | { code: 'uncaught_exception'; at: 'launchSession' | 'createState'; errorDetails?: string }
                      }

                createInitialStateDurations?: {
                    createLauncher?: number
                    createSession?: number
                    createInstantiatedModel?: number
                    createState?: number
                }
            }
            createModelSuccess?: {
                createInitialStateDurations: {
                    createLauncher?: number
                    createSession?: number
                    createInstantiatedModel?: number
                    createState: number
                }
            }
        }
    }>

    /**
     * Cancel the creation of a model.
     * @param modelId The ID of the model.
     */
    cancelCreateModel(
        modelId: string
    ): Promise<{
        error?: { code: 'bad_credentials' | 'creatingModel_not_found' } | { code: 'invalid_parameter'; parameterName: string; reason: string }
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
            parameterDefinitions?: StatefulParameterDefinitions | StatelessParameterDefinitions
            defaultLauncherSpec_createModelState?: LauncherSpec
            defaultLauncherSpec_train?: LauncherSpec
            defaultLauncherSpec_evaluate?: LauncherSpec
            maxEvaluateDurationsSeconds?: { launchSession: number; instantiateModel?: number; evaluate: number }
        }
    ): Promise<{
        error?:
            | {
                  code: 'bad_credentials' | 'model_not_found' | 'access_denied'
              }
            | { code: 'invalid_parameter'; parameterName: string; reason: string }
    }>

    /**
     * Retrieve information about models. If the requested model wasn't returned, it means that the model doesn't exist (or you don't have access to it).
     * @param modelIds Which models to fetch. If unspecified, all models will be fetched.
     */
    getModels(
        modelIds?: string[]
    ): Promise<{
        failed?: {
            error: { code: 'bad_credentials' } | { code: 'invalid_parameter'; parameterName: string; reason: string }
        }
        success?: {
            models: { models: Model[]; beingCreated: Model[] }
        }
    }>

    /**
     * Create a new model state. Can either be created by the blueprint, or uploaded from binary data.
     * The state will be added to the model's state storage.
     * @param modelId The model's id.
     * @param state The state to create. Can either create a new one from the model's executor, or it can be provided from JSON data.
     */
    createModelState(
        modelId: string,
        state:
            | {
                  title: string
                  type: 'create'
                  params: IParameter[]
                  maxDurationsSeconds?: { launchSession: number; createState: number }
              }
            | { title: string; type: 'fromJSON'; value: string }
    ): Promise<{
        failed?: {
            error:
                | {
                      code: 'bad_credentials' | 'model_not_found' | 'model_not_stateful' | 'access_denied' | 'cancelled' | 'unknown'
                  }
                | { code: 'invalid_parameter'; parameterName: string; reason: string }
                | {
                      code: 'create_state_error'
                      details:
                          | {
                                code: 'response_not_serializable' | 'session_terminated' | 'maxDurationExceeded'
                            }
                          | {
                                code: 'launcher_terminated'
                                reason: 'OOM' | 'unknown'
                            }
                          | { code: 'uncaught_exception'; at: 'launchSession' | 'createState'; errorDetails?: string }
                          | { code: 'dataset_not_found'; datasetId: string }
                  }
            durations: {
                total: number
                createLauncher?: number
                createSession?: number
                createInstantiatedModel?: number
                createState?: number
            }
            executedOnLauncher?:
                | {
                      type: 'persistent'
                      persistentLauncherId: string
                  }
                | {
                      type: 'createdNew'
                      launcherSpec: LauncherSpec
                  }
        }
        success?: {
            stateId: string
            durations: {
                total: number
                createLauncher?: number
                createSession?: number
                createInstantiatedModel?: number
                createState?: number
            }
            executedOnLauncher?:
                | {
                      type: 'persistent'
                      persistentLauncherId: string
                  }
                | {
                      type: 'createdNew'
                      launcherSpec: LauncherSpec
                  }
        }
    }>

    /**
     * Cancel the creation of a state.
     * @param modelId The model's ID.
     * @param stateId The state's ID.
     */
    cancelCreateModelState(
        modelId: string,
        stateId: string
    ): Promise<{
        error?:
            | { code: 'bad_credentials' | 'model_not_found' | 'state_not_being_created' | 'access_denied' }
            | { code: 'invalid_parameter'; parameterName: string; reason: string }
    }>

    /**
     * Store the state of a model.
     * @param modelId The model's id.
     */
    storeCurrentModelState(
        modelId: string
    ): Promise<{
        error?: { code: 'bad_credentials' | 'model_not_found' | 'access_denied' } | { code: 'invalid_parameter'; parameterName: string; reason: string }
    }>

    /**
     * Set the state of a model. This is a destructive operation as it will replace the current state.
     * @param modelId The model's id.
     * @param state State to set. Can either be provided as a string of JSON format, or loaded from state storage using the stored state id.
     * @returns The state's id.
     */
    setModelState(
        modelId: string,
        storedStateId: string
    ): Promise<{
        error?:
            | { code: 'bad_credentials' | 'model_not_found' | 'state_not_found' | 'access_denied' }
            | { code: 'invalid_parameter'; parameterName: string; reason: string }
    }>

    /**
     * Delete a stored state.
     * @param modelId The model's id.
     * @param stateId The state's id.
     */
    deleteStoredModelState(
        modelId: string,
        stateId: string
    ): Promise<{
        error?:
            | { code: 'bad_credentials' | 'model_not_found' | 'model_not_stateful' | 'model_state_not_found' | 'access_denied' }
            | { code: 'invalid_parameter'; parameterName: string; reason: string }
    }>

    /**
     * Retrieve the parameter definitions for a model.
     * @param modelId The model's id.
     */
    getParameterDefinitions(
        modelId: string
    ): Promise<{
        failed?: {
            error: { code: 'bad_credentials' | 'model_not_found' } | { code: 'invalid_parameter'; parameterName: string; reason: string }
        }
        success?: {
            parameterDefinitions: StatefulParameterDefinitions | StatelessParameterDefinitions
        }
    }>

    /**
     * Start a new training session.
     * @param modelId The model's id.
     * @param params Parameters to pass to the blueprint. All parameters specified by the blueprint must be included.
     * @returns The id of the created training session, used for further reference.
     */
    train(
        modelId: string,
        newStateName: string,
        params: IParameter[],
        maxDurationsSeconds?: {
            launchSession: number
            instantiateModel: number
            train: number
            trainingSession: number
        }
    ): Promise<{
        failed?: {
            error:
                | {
                      code:
                          | 'bad_credentials'
                          | 'model_not_found'
                          | 'model_not_stateful'
                          | 'launcher_terminated'
                          | 'session_terminated'
                          | 'maxDurationExceeded'
                          | 'access_denied'
                          | 'cancelled'
                          | 'unknown'
                  }
                | { code: 'dataset_not_found'; datasetId: string }
                | { code: 'invalid_parameter'; parameterName: string; reason: string }
                | { code: 'uncaught_exception'; at: 'launchSession' | 'instantiateModel' | 'train'; errorDetails?: string }
            durations: {
                total: number
                createLauncher?: number
                createSession?: number
                createInstantiatedModel?: number
                train?: number
            }
            executedOnLauncher?:
                | {
                      type: 'persistent'
                      persistentLauncherId: string
                  }
                | {
                      type: 'createdNew'
                      launcherSpec: LauncherSpec
                  }
        }
        success?: {
            trainingSessionId?: string
            durations: {
                total: number
                createLauncher?: number
                createSession?: number
                createInstantiatedModel?: number
                train: number
            }
            executingOnLauncher:
                | {
                      type: 'persistent'
                      persistentLauncherId: string
                  }
                | {
                      type: 'createdNew'
                      launcherSpec: LauncherSpec
                  }
        }
    }>

    /**
     * Retrieve the status of a training job.
     */
    getTrainingStatus(
        trainingSessionId: string
    ): Promise<{
        failed?: {
            error?: { code: 'bad_credentials' | 'training_session_not_found' } | { code: 'invalid_parameter'; parameterName: string; reason: string }
        }
        success?: {
            trainingSession: TrainingSession
        }
    }>

    /**
     * Cancel an ongoing training job.
     */
    cancelTrainingSession(
        trainingSessionId: string
    ): Promise<{
        error?:
            | { code: 'bad_credentials' | 'training_session_not_found' | 'training_session_not_running' | 'access_denied' }
            | { code: 'invalid_parameter'; parameterName: string; reason: string }
    }>

    /**
     * Clear the data of a finished training session.
     * @param trainingSessionId The training session's ID.
     */
    clearPreviousTrainingSession(
        trainingSessionId: string
    ): Promise<{
        error?:
            | { code: 'bad_credentials' | 'training_session_not_found' | 'training_session_not_clearable' | 'access_denied' }
            | { code: 'invalid_parameter'; parameterName: string; reason: string }
    }>

    /**
     * Get evaluations from a model, given the provided input data.
     * @param modelId The model's id.
     * @param params Parameters to pass to the executor.
     */
    evaluate(
        modelId: string,
        params: IParameter[]
    ): Promise<{
        failed?: {
            error:
                | {
                      code:
                          | 'bad_credentials'
                          | 'model_not_found'
                          | 'response_not_serializable'
                          | 'launcher_terminated'
                          | 'session_terminated'
                          | 'maxDurationExceeded'
                          | 'free_quota_exceeded'
                          | 'cancelled'
                          | 'unknown'
                  }
                | { code: 'invalid_parameter'; parameterName: string; reason: string }
                | { code: 'dataset_not_found'; datasetId: string }
                | { code: 'uncaught_exception'; at: 'launchSession' | 'instantiateModel' | 'evaluate'; errorDetails?: string }
            durations: {
                total: number
                createLauncher?: number
                createSession?: number
                createInstantiatedModel?: number
                evaluate?: number
            }
            executedOnLauncher?:
                | {
                      type: 'persistent'
                      persistentLauncherId: string
                  }
                | {
                      type: 'createdNew'
                      launcherSpec: LauncherSpec
                  }
        }
        success?: {
            result: IParameter[]
            durations: {
                total: number
                createLauncher?: number
                createSession?: number
                createInstantiatedModel?: number
                evaluate: number
            }
            executedOnLauncher?:
                | {
                      type: 'persistent'
                      persistentLauncherId: string
                  }
                | {
                      type: 'createdNew'
                      launcherSpec: LauncherSpec
                  }
        }
    }>

    /**
     * Get running evaluations on a model.
     * @param modelId The model's ID.
     */
    getRunningEvaluations(
        modelId: string
    ): Promise<{
        failed?: {
            error: { code: 'bad_credentials' | 'model_not_found' } | { code: 'invalid_parameter'; parameterName: string; reason: string }
        }
        success?: {
            evaluations: { id: string; startedAt: number }[]
        }
    }>

    /**
     * Cancel an ongoing evaluation.
     * @param evalutionId The ID of this evaluation.
     */
    cancelEvaluation(
        evalutionId: string
    ): Promise<{
        error?: { code: 'bad_credentials' | 'evaluation_not_found' | 'access_denied' } | { code: 'invalid_parameter'; parameterName: string; reason: string }
    }>

    /**
     * Configure which PersistentLaunchers a model should use.
     * @param modelId The model's id.
     * @param method Which method this configuration should apply to.
     * @param persistentLaunchers A list of info for each persistent launcher.
     */
    setUsedPersistentLaunchers(
        modelId: string,
        method: 'createModelState' | 'train' | 'evaluate',
        persistentLaunchers: { persistentLauncherId: string; level: 'launcher' | 'session' | 'instantiatedModel' }[]
    ): Promise<{
        error?:
            | { code: 'bad_credentials' | 'persistentLauncher_not_found' | 'model_not_found' | 'invalid_executor_type' | 'access_denied' }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
    }>

    /**
     * Retrieve which persistent launchers the model is configured to use.
     * @param modelId The model's id.
     * @param method Which method the configuration applies to.
     */
    getUsedPersistentLaunchers(
        modelId: string,
        method: 'createModelState' | 'train' | 'evaluate'
    ): Promise<{
        failed?: {
            error:
                | { code: 'bad_credentials' | 'model_not_found' }
                | {
                      code: 'invalid_parameter'
                      parameterName: string
                      reason: string
                  }
        }
        success?: {
            usedPersistentLaunchers: { persistentLauncherId: string; level: 'launcher' | 'session' | 'instantiatedModel' }[]
        }
    }>

    /**
     * Retrieve usage statistics for a model.
     * All returned durations are in seconds, and all returned timestamps are in seconds sin Jan 01 1970.
     * @param modelId The model's ID.
     * @param billingCycle Which billing cycle to fetch for. Defaults to the current billing cycle.
     */
    getUsageStats(
        modelId: string,
        billingCycle?: {
            year: number
            month: 'JAN' | 'FEB' | 'MAR' | 'APR' | 'MAY' | 'JUN' | 'JUL' | 'AUG' | 'SEP' | 'OCT' | 'NOV' | 'DEC'
        }
    ): Promise<{
        error?:
            | { code: 'bad_credentials' | 'model_not_found' }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        stats?: {
            year: number
            month: 'JAN' | 'FEB' | 'MAR' | 'APR' | 'MAY' | 'JUN' | 'JUL' | 'AUG' | 'SEP' | 'OCT' | 'NOV' | 'DEC'
            evaluations: { timestamp: number; launcher?: { spec: LauncherSpec; duration: number } }[]
            createStates: { timestamp: number; launcher?: { spec: LauncherSpec; duration: number } }[]
            trainingSessions: { timestamp: number; launcher?: { spec: LauncherSpec; duration: number } }[]
        }
    }>
}
