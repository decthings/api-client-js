import { DecthingsParameter, DecthingsParameterProvider, DecthingsTensor } from '../tensor'
import { LauncherSpec, ParameterDefinitions } from '../types'

export type ModelSource =
    | {
          type: 'code'
          filesystemSizeMebibytes: number
          blockSize: number
          totalBlocks: number
          freeBlocks: number
          totalInodes: number
          freeInodes: number
      }
    | {
          type: 'model'
          modelId: string
          versionId: string
      }

export type Model = {
    id: string
    name: string
    description: string
    publicAccess: boolean
    createdAt: number
    tags: {
        tag: string
        value: string
    }[]
    owner:
        | {
              type: 'user'
              userId: string
              username: string
          }
        | {
              type: 'organization'
              organizationId: string
              organizationName: string
          }
    access: 'read' | 'readwrite'
    source: ModelSource
    versions: {
        id: string
        name: string
        createdAt: number
        filesystemSizeMebibytes: number
        config: {
            parameterDefinitions: ParameterDefinitions
            defaultLauncherSpecs: {
                initializeWeights: LauncherSpec
                evaluate: LauncherSpec
            }
            maxDurationsSeconds: {
                codeStartup: number
                instantiateModel: number
                initializeWeights: number
                train: number
                evaluate: number
            }
            image: {
                domain: string
                repository: string
                reference: string
                digest: string
            }
        }
        mountedModels: {
            modelId: string
            versionId: string
        }[]
        /** IDs of all the training operations that have been performed to reach this state. */
        trainingOperations: string[]
        status:
            | {
                  state: 'initializingWeights'
              }
            | {
                  state: 'training'
                  trainingSessionId: string
              }
            | {
                  state: 'created'
                  weights: {
                      key: string
                      byteSize: number
                  }[]
              }
    }[]
}

export interface ModelRpc {
    /**
     * Create a new model.
     */
    createModel(params: {
        /** The model's name. */
        name: string
        /** A description of the model. */
        description: string
        /** If true, all Decthings users can find and use this model. Defaults to false. */
        publicAccess?: boolean
        /** Tags are used to specify things like model type (image classifier, etc.) and other metadata. */
        tags?: {
            tag: string
            value: string
        }[]
        /** Required configuration for this model, such as model type, language to use, etc. */
        options:
            | {
                  type: 'code'
                  parameterDefinitions?: ParameterDefinitions
                  language: 'javascript' | 'typescript' | 'python' | 'rust'
                  preset?: string
                  wasm?: boolean
              }
            | {
                  type: 'basedOnModel'
                  modelId: string
                  versionId: string
              }
            | {
                  type: 'duplicateExisting'
                  modelId: string
              }
    }): Promise<{
        error?:
            | {
                  code:
                      | 'name_already_used'
                      | 'organization_not_found'
                      | 'access_denied'
                      | 'model_not_found'
                      | 'model_version_not_found'
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
            modelId: string
        }
    }>

    /**
     * Delete a model and the associated files, versions, etc.
     */
    deleteModel(params: {
        /** The model's id. */
        modelId: string
    }): Promise<{
        error?:
            | {
                  code: 'model_not_found' | 'access_denied' | 'bad_credentials' | 'too_many_requests' | 'payment_required' | 'unknown'
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {}
    }>

    /**
     * Change information about a model.
     */
    updateModel(params: {
        /** The model's id. */
        modelId: string
        /** Properties and values to change. Empty fields will not be changed. */
        properties: {
            name?: string
            description?: string
            publicAccess?: boolean
            tags?: {
                tag: string
                value: string
            }[]
        }
    }): Promise<{
        error?:
            | {
                  code: 'model_not_found' | 'access_denied' | 'name_already_used' | 'bad_credentials' | 'too_many_requests' | 'payment_required' | 'unknown'
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {}
    }>

    /**
     * Retrieve information about models. If the requested model wasn't returned, it means that the model doesn't
     * exist (or you don't have access to it).
     */
    getModels(params: {
        /** Number of items from the results to skip. Defaults to 0. */
        offset?: number
        /** Max number of items to return. Defaults to 20. */
        limit?: number
        /** If specified, determines which items to retrieve. */
        filter?: {
            owners?: string[]
            tags?: {
                tag: string
                value: string
            }[]
            ids?: string[]
            names?: string[]
            searchName?: string
        }
        /** Specifies a field in the returned items to sort by. Defaults to "createdAt". */
        sort?: string
        sortDirection?: 'asc' | 'desc'
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
            models: Model[]
            /** The total number of models that matched the filter. */
            total: number
            offset: number
            limit: number
        }
    }>

    /**
     * Change the size of the filesystem used. Increasing the amount will increase the monthly cost but allow you to
     * store more files within the filesystem.
     */
    setFilesystemSize(params: {
        /** The model's id. */
        modelId: string
        /** The new size to use. */
        newFilesystemSizeMebibytes: number
    }): Promise<{
        error?:
            | {
                  code:
                      | 'model_not_found'
                      | 'invalid_model_source_type'
                      | 'not_enough_space'
                      | 'access_denied'
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
        result?: {}
    }>

    /**
     * Create a new model version. This will build the model and then call the `initializeWeights` function to
     * initialize a new, untrained set of weights.
     */
    createModelVersion(params: {
        /** The model's id. */
        modelId: string
        /** The name of the version. */
        versionName: string
        /** Parameters to provide to the initializeWeights function on the running model. */
        params: DecthingsParameterProvider[]
        /** Allows your model to execute these additional models. Can be useful for merging models together. */
        mountModels?: {
            /** Id of the other model to mount. */
            modelId: string
            /** Version within the other model to mount. */
            versionId: string
        }[]
    }): Promise<{
        error?:
            | {
                  code:
                      | 'model_not_found'
                      | 'access_denied'
                      | 'quota_exceeded'
                      | 'model_to_mount_not_found'
                      | 'version_for_model_to_mount_not_found'
                      | 'server_overloaded'
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
                  code: 'initialize_weights_failed'
                  durations: {
                      total: number
                      createLauncher?: number
                      codeStartup?: number
                      initializeWeights?: number
                  }
                  reason:
                      | {
                            code:
                                | 'cancelled'
                                | 'invalid_executable_file'
                                | 'read_executable_file_failed'
                                | 'launcher_terminated'
                                | 'server_overloaded'
                                | 'unknown'
                        }
                      | {
                            code: 'max_duration_exceeded'
                            at: 'codeStartup' | 'initializeWeights' | 'loadWeights' | 'evaluate' | 'train' | 'getWeights'
                        }
                      | {
                            code: 'code_terminated'
                            exitCode?: number
                            signal?: string
                            oom: boolean
                        }
                      | {
                            code: 'exception'
                            at: 'codeStartup' | 'initializeWeights' | 'loadWeights' | 'evaluate' | 'train' | 'getWeights'
                            exceptionDetails?: string
                        }
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {
            /** A unique identifier which you should use in subsequent API calls. */
            versionId: string
            initializeWeightsDurations: {
                total: number
                createLauncher?: number
                codeStartup?: number
                initializeWeights: number
            }
        }
    }>

    /**
     * Create a new model version. This will use the weights uploaded as part of the request.
     */
    createModelVersionUploadWeights(params: {
        /** The model's id. */
        modelId: string
        /** The name of the version. */
        versionName: string
        /** Data to upload. */
        data: {
            key: string
            data: Buffer
        }[]
        /** Allows your model to execute these additional models. Can be useful for merging models together. */
        mountModels?: {
            /** Id of the other model to mount. */
            modelId: string
            /** Version within the other model to mount. */
            versionId: string
        }[]
    }): Promise<{
        error?:
            | {
                  code:
                      | 'model_not_found'
                      | 'access_denied'
                      | 'quota_exceeded'
                      | 'model_to_mount_not_found'
                      | 'version_for_model_to_mount_not_found'
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
            versionId: string
        }
    }>

    /**
     * Update information about a model version.
     */
    updateModelVersion(params: {
        /** The model's id. */
        modelId: string
        /** The version's id. */
        versionId: string
        /** Properties and values to change. Empty fields will not be changed. */
        properties: {
            name?: string
        }
    }): Promise<{
        error?:
            | {
                  code:
                      | 'model_not_found'
                      | 'model_version_not_found'
                      | 'access_denied'
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
     * Download the weight data of a model version.
     */
    getWeights(params: {
        /** The model's id. */
        modelId: string
        /** The model version's id. */
        versionId: string
        /** Which weight keys to fetch. Defaults to all keys. */
        keys?: string[]
    }): Promise<{
        error?:
            | {
                  code:
                      | 'model_not_found'
                      | 'model_version_not_found'
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
     * Delete a model version.
     */
    deleteModelVersion(params: {
        /** The model's id. */
        modelId: string
        /** The model version's id. */
        versionId: string
    }): Promise<{
        error?:
            | {
                  code:
                      | 'model_not_found'
                      | 'model_version_not_found'
                      | 'access_denied'
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
     * Start a new training session.
     */
    train(params: {
        /** The model's id. */
        modelId: string
        /** The model version to use. */
        versionId: string
        /** A name to give the new model version once it is created. */
        newVersionName: string
        /** Parameters to provide to the train function on the running model. */
        params: DecthingsParameterProvider[]
        /** Which launcher to use for running the operation. */
        executionLocation:
            | {
                  type: 'persistentLauncher'
                  persistentLauncherId: string
              }
            | {
                  type: 'temporaryLauncher'
                  spec: LauncherSpec
              }
    }): Promise<{
        error?:
            | {
                  code:
                      | 'model_not_found'
                      | 'model_version_not_found'
                      | 'persistent_launcher_not_found'
                      | 'access_denied'
                      | 'quota_exceeded'
                      | 'model_to_mount_no_longer_exists'
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
     * Retrieve the status of a training session.
     */
    getTrainingStatus(params: {
        /** The model's id. */
        modelId: string
        /** The training session's id. */
        trainingSessionId: string
    }): Promise<{
        error?:
            | {
                  code: 'model_not_found' | 'training_session_not_found' | 'bad_credentials' | 'too_many_requests' | 'payment_required' | 'unknown'
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {
            id: string
            modelId: string
            versionId: string
            newVersionName: string
            createdAt: number
            metrics: {
                name: string
                amount: number
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
            status:
                | {
                      state: 'starting'
                  }
                | {
                      state: 'running'
                      startDurations: {
                          createLauncher?: number
                          codeStartup?: number
                          instantiateModel?: number
                      }
                      progress: number
                  }
                | {
                      state: 'gettingWeights'
                      startDurations: {
                          createLauncher?: number
                          codeStartup?: number
                          instantiateModel?: number
                      }
                      trainDuration: number
                  }
                | {
                      state: 'completed'
                      startDurations: {
                          createLauncher?: number
                          codeStartup?: number
                          instantiateModel?: number
                      }
                      trainDuration: number
                      getWeightsDuration: number
                      finishedAt: number
                      createdVersionId: string
                  }
                | {
                      state: 'failed'
                      startDurations: {
                          createLauncher?: number
                          codeStartup?: number
                          instantiateModel?: number
                      }
                      trainDuration?: number
                      getWeightsDuration?: number
                      finishedAt: number
                      failReason:
                          | {
                                code:
                                    | 'cancelled'
                                    | 'invalid_executable_file'
                                    | 'read_executable_file_failed'
                                    | 'launcher_terminated'
                                    | 'server_overloaded'
                                    | 'unknown'
                            }
                          | {
                                code: 'max_duration_exceeded'
                                at: 'codeStartup' | 'initializeWeights' | 'loadWeights' | 'evaluate' | 'train' | 'getWeights'
                            }
                          | {
                                code: 'code_terminated'
                                exitCode?: number
                                signal?: string
                                oom: boolean
                            }
                          | {
                                code: 'exception'
                                at: 'codeStartup' | 'initializeWeights' | 'loadWeights' | 'evaluate' | 'train' | 'getWeights'
                                exceptionDetails?: string
                            }
                  }
        }
    }>

    /**
     * Retrieve the metrics of a training session.
     */
    getTrainingMetrics(params: {
        /** The model's id. */
        modelId: string
        /** The training session's id. */
        trainingSessionId: string
        /** Which metrics to fetch */
        metrics: {
            name: string
            startIndex: number
            amount: number
        }[]
    }): Promise<{
        error?:
            | {
                  code: 'model_not_found' | 'training_session_not_found' | 'bad_credentials' | 'too_many_requests' | 'payment_required' | 'unknown'
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
     * Retrieve system information for a training session, such as CPU, memory and disk usage.
     */
    getTrainingSysinfo(params: {
        /** The model's id. */
        modelId: string
        /** The training session's id. */
        trainingSessionId: string
        /** If specified, only data points after this time are included. */
        fromTimestamp?: number
    }): Promise<{
        error?:
            | {
                  code: 'model_not_found' | 'training_session_not_found' | 'bad_credentials' | 'too_many_requests' | 'payment_required' | 'unknown'
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {
            sysinfo: {
                timestamp: number
                cpus: number
                memory: number
                disk?: number
            }[]
        }
    }>

    /**
     * Cancel an ongoing training session.
     */
    cancelTrainingSession(params: {
        /** The model's id. */
        modelId: string
        /** The training session's id. */
        trainingSessionId: string
    }): Promise<{
        error?:
            | {
                  code:
                      | 'model_not_found'
                      | 'training_session_not_found'
                      | 'training_session_not_running'
                      | 'access_denied'
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
     * Clear the data of a finished training session.
     */
    clearPreviousTrainingSession(params: {
        /** The model's id. */
        modelId: string
        /** The training session's id. */
        trainingSessionId: string
    }): Promise<{
        error?:
            | {
                  code:
                      | 'model_not_found'
                      | 'training_session_not_found'
                      | 'training_session_running'
                      | 'access_denied'
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
     * Evaluate a model using the provided input data.
     */
    evaluate(params: {
        /** The model's id. */
        modelId: string
        /** Parameters to provide to the train function on the running model. */
        params: DecthingsParameterProvider[]
        /** The model version to evaluate. */
        versionId: string
    }): Promise<{
        error?:
            | {
                  code:
                      | 'model_not_found'
                      | 'model_version_not_found'
                      | 'quota_exceeded'
                      | 'model_to_mount_no_longer_exists'
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
                  code: 'evaluate_failed'
                  durations: {
                      total: number
                      createLauncher?: number
                      codeStartup?: number
                      instantiateModel?: number
                      evaluate?: number
                  }
                  executedOnLauncher:
                      | {
                            type: 'persistentLauncher'
                            persistentLauncherId: string
                            spec: LauncherSpec
                        }
                      | {
                            type: 'temporaryLauncher'
                            spec: LauncherSpec
                        }
                  reason:
                      | {
                            code:
                                | 'cancelled'
                                | 'invalid_executable_file'
                                | 'read_executable_file_failed'
                                | 'launcher_terminated'
                                | 'server_overloaded'
                                | 'unknown'
                        }
                      | {
                            code: 'max_duration_exceeded'
                            at: 'codeStartup' | 'initializeWeights' | 'loadWeights' | 'evaluate' | 'train' | 'getWeights'
                        }
                      | {
                            code: 'code_terminated'
                            exitCode?: number
                            signal?: string
                            oom: boolean
                        }
                      | {
                            code: 'exception'
                            at: 'codeStartup' | 'initializeWeights' | 'loadWeights' | 'evaluate' | 'train' | 'getWeights'
                            exceptionDetails?: string
                        }
                      | {
                            code: 'invalid_output'
                            reason: 'invalid' | 'not_applicable_to_parameter_definitions'
                            details: string
                        }
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {
            durations: {
                total: number
                createLauncher?: number
                codeStartup?: number
                instantiateModel?: number
                evaluate: number
            }
            executedOnLauncher:
                | {
                      type: 'persistentLauncher'
                      persistentLauncherId: string
                      spec: LauncherSpec
                  }
                | {
                      type: 'temporaryLauncher'
                      spec: LauncherSpec
                  }
            output: DecthingsParameter[]
        }
    }>

    /**
     * Get running and finished evaluations of a model. Finished evaluations are only visible for a few minutes.
     */
    getEvaluations(params: {
        /** The model's id. */
        modelId: string
    }): Promise<{
        error?:
            | {
                  code: 'model_not_found' | 'bad_credentials' | 'too_many_requests' | 'payment_required' | 'unknown'
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {
            running: {
                id: string
                versionId: string
                startedAt: number
            }[]
            finished: {
                id: string
                versionId: string
                startedAt: number
                finishedAt: number
                success: boolean
            }[]
        }
    }>

    /**
     * Get the results for a finished evaluation. If the evaluation is running, this function will wait for it to
     * finish and then return the results. Results for finished evaluations are only available for a few minutes.
     */
    getFinishedEvaluationResult(params: {
        /** The model's id. */
        modelId: string
        /** The evaluation's id. */
        evaluationId: string
    }): Promise<{
        error?:
            | {
                  code: 'model_not_found' | 'evaluation_not_found' | 'bad_credentials' | 'too_many_requests' | 'payment_required' | 'unknown'
              }
            | {
                  code: 'evaluate_failed'
                  durations: {
                      total: number
                      createLauncher?: number
                      codeStartup?: number
                      instantiateModel?: number
                      evaluate?: number
                  }
                  executedOnLauncher:
                      | {
                            type: 'persistentLauncher'
                            persistentLauncherId: string
                            spec: LauncherSpec
                        }
                      | {
                            type: 'temporaryLauncher'
                            spec: LauncherSpec
                        }
                  reason:
                      | {
                            code:
                                | 'cancelled'
                                | 'invalid_executable_file'
                                | 'read_executable_file_failed'
                                | 'launcher_terminated'
                                | 'server_overloaded'
                                | 'unknown'
                        }
                      | {
                            code: 'max_duration_exceeded'
                            at: 'codeStartup' | 'initializeWeights' | 'loadWeights' | 'evaluate' | 'train' | 'getWeights'
                        }
                      | {
                            code: 'code_terminated'
                            exitCode?: number
                            signal?: string
                            oom: boolean
                        }
                      | {
                            code: 'exception'
                            at: 'codeStartup' | 'initializeWeights' | 'loadWeights' | 'evaluate' | 'train' | 'getWeights'
                            exceptionDetails?: string
                        }
                      | {
                            code: 'invalid_output'
                            reason: 'invalid' | 'not_applicable_to_parameter_definitions'
                            details: string
                        }
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {
            durations: {
                total: number
                createLauncher?: number
                codeStartup?: number
                instantiateModel?: number
                evaluate: number
            }
            executedOnLauncher:
                | {
                      type: 'persistentLauncher'
                      persistentLauncherId: string
                      spec: LauncherSpec
                  }
                | {
                      type: 'temporaryLauncher'
                      spec: LauncherSpec
                  }
            output: DecthingsParameter[]
        }
    }>

    /**
     * Cancel an ongoing evaluation.
     */
    cancelEvaluation(params: {
        /** The model's id. */
        modelId: string
        /** The evaluation's id. */
        evaluationId: string
    }): Promise<{
        error?:
            | {
                  code: 'model_not_found' | 'evaluation_not_found' | 'bad_credentials' | 'too_many_requests' | 'payment_required' | 'unknown'
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {}
    }>

    /**
     * Configure which PersistentLaunchers a model should use.
     */
    setUsedPersistentLaunchersForEvaluate(params: {
        /** The model's id. */
        modelId: string
        /** The model version's id. */
        versionId: string
        persistentLaunchers: {
            persistentLauncherId: string
            level: 'launcher' | 'codeStart' | 'instantiatedModel'
        }[]
    }): Promise<{
        error?:
            | {
                  code:
                      | 'persistent_launcher_not_found'
                      | 'model_not_found'
                      | 'model_version_not_found'
                      | 'access_denied'
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
     * Retrieve which persistent launchers the model is configured to use.
     */
    getUsedPersistentLaunchersForEvaluate(params: {
        /** The model's id. */
        modelId: string
        /** The model version's id. */
        versionId: string
    }): Promise<{
        error?:
            | {
                  code: 'model_not_found' | 'model_version_not_found' | 'bad_credentials' | 'too_many_requests' | 'payment_required' | 'unknown'
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {
            usedPersistentLaunchers: {
                persistentLauncherId: string
                level: 'launcher' | 'codeStart' | 'instantiatedModel'
            }[]
        }
    }>
}
