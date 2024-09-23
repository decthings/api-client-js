import { DecthingsParameter, DecthingsParameterProvider, DecthingsTensor } from '../tensor'
import { LauncherSpec, ParameterDefinitions } from '../types'

export type ModelState = {
    id: string
    name: string
    /** Identifiers of all the training operations that have been performed to reach this state. */
    trainingOperations: string[]
    createdAt: number
    beingDeleted: boolean
    state: {
        key: string
        byteSize: number
    }[]
    mountedModels: {
        modelId: string
        snapshotId?: string
    }[]
}

export type Model = {
    id: string
    name: string
    description: string
    createdAt: number
    tags: {
        tag: string
        value: string
    }[]
    owner: {
        userId: string
        username: string
    }
    access: 'read' | 'readwrite'
    beingCreated: boolean
    language: 'go' | 'javascript' | 'typescript' | 'python' | 'rust'
    wasm: boolean
    image: {
        domain: string
        repository: string
        reference: string
        error?: string
    }
    parameterDefinitions: ParameterDefinitions
    defaultLauncherSpecs: {
        createState: LauncherSpec
        evaluate: LauncherSpec
    }
    maxDurationsSeconds: {
        codeStartup: number
        instantiateModel: number
        createState: number
        train: number
        evaluate: number
    }
    filesystemSizeMebibytes: number
    ongoingTrainingSessions: string[]
    trainingSessions: string[]
    states: ModelState[]
    activeState: string
    snapshots: {
        id: string
        name: string
        createdAt: number
        filesystemSizeMebibytes: number
        parameterDefinitions: ParameterDefinitions
        defaultLauncherSpecs: {
            createState: LauncherSpec
            evaluate: LauncherSpec
        }
        maxDurationsSeconds: {
            codeStartup: number
            instantiateModel: number
            createState: number
            train: number
            evaluate: number
        }
        image: {
            domain: string
            repository: string
            reference: string
        }
        state: {
            name: string
            state: {
                key: string
                byteSize: number
            }[]
            mountedModels: {
                modelId: string
                snapshotId?: string
            }[]
        }
    }[]
    basedOnSnapshot?: {
        modelId: string
        snapshotId: string
        noLongerExists: boolean
    }
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
        /** Required configuration for this model, such as model type, language to use, etc. */
        options:
            | {
                  type: 'code'
                  /** Tags are used to specify things like model type (image classifier, etc.) and other metadata. */
                  tags?: {
                      tag: string
                      value: string
                  }[]
                  parameterDefinitions?: ParameterDefinitions
                  language: 'go' | 'javascript' | 'typescript' | 'python' | 'rust'
                  /** At the time of writing, presets "none", "empty", "tensorflowjs", "pytorch" and "tensorflow" are available. */
                  preset?: string
                  wasm?: boolean
              }
            | {
                  type: 'upload'
                  /** Tags are used to specify things like model type (image classifier, etc.) and other metadata. */
                  tags?: {
                      tag: string
                      value: string
                  }[]
                  parameterDefinitions?: ParameterDefinitions
                  /** At the time of writing, formats "tflite" and "onnx" are available. */
                  format: string
                  data: Buffer
              }
            | {
                  type: 'basedOnModelSnapshot'
                  /** Tags are used to specify things like model type (image classifier, etc.) and other metadata. */
                  tags?: {
                      tag: string
                      value: string
                  }[]
                  modelId: string
                  snapshotId: string
                  initialState:
                      | {
                            method: 'copy'
                        }
                      | {
                            method: 'create'
                            name: string
                            params: DecthingsParameterProvider[]
                            launcherSpec: LauncherSpec
                        }
                      | {
                            method: 'upload'
                            name: string
                            data: {
                                key: string
                                data: Buffer
                            }[]
                        }
              }
            | {
                  type: 'fromExisting'
                  /** Tags are used to specify things like model type (image classifier, etc.) and other metadata. */
                  tags?: {
                      tag: string
                      value: string
                  }[]
                  modelId: string
                  snapshotId?: string
              }
    }): Promise<{
        error?:
            | {
                  code:
                      | 'model_not_found'
                      | 'snapshot_not_found'
                      | 'quota_exceeded'
                      | 'server_overloaded'
                      | 'invalid_executable_file'
                      | 'read_executable_file_failed'
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
            modelId: string
            /**
             * Will be true if an initial state is being create, which means the model is being created until the operation is
             * finished.
             */
            isNowCreating: boolean
        }
    }>

    /**
     * Wait for the model create to finish.
     */
    waitForModelToBeCreated(params: {
        /** The model's id. */
        modelId: string
    }): Promise<{
        error?:
            | {
                  code: 'model_not_found' | 'model_already_created' | 'bad_credentials' | 'too_many_requests' | 'payment_required' | 'unknown'
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {
            /** One of "createModelFailed" or "createModelSuccess" will be present. */
            createModelFailed?: {
                error:
                    | {
                          code: 'cancelled' | 'server_overloaded' | 'unknown'
                      }
                    | {
                          code: 'create_state_error'
                          details:
                              | {
                                    code: 'invalid_executable_file' | 'read_executable_file_failed' | 'launcher_terminated'
                                }
                              | {
                                    code: 'max_duration_exceeded'
                                    at: 'codeStartup' | 'createState'
                                }
                              | {
                                    code: 'code_terminated'
                                    exitCode?: number
                                    signal?: string
                                    oom: boolean
                                }
                              | {
                                    code: 'exception'
                                    at: 'codeStartup' | 'createState'
                                    exceptionDetails?: string
                                }
                          createInitialStateDurations: {
                              createLauncher: number
                              codeStartup?: number
                              createState?: number
                          }
                      }
            }
            createModelSuccess?: {
                createInitialStateDurations: {
                    createLauncher: number
                    codeStartup: number
                    createState: number
                }
            }
        }
    }>

    /**
     * Delete a model and the associated filesystem, snapshots, states etc. If the model is being created, it will be
     * cancelled.
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
     * Create a snapshot of a model.
     */
    snapshotModel(params: {
        /** The model's id. */
        modelId: string
        /** The name of the snapshot. */
        snapshotName: string
    }): Promise<{
        error?:
            | {
                  code:
                      | 'model_not_found'
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
        result?: {
            /** A unique identifier which you should use in subsequent API calls. */
            snapshotId: string
        }
    }>

    /**
     * Update information about a snapshot.
     */
    updateSnapshot(params: {
        /** The model's id. */
        modelId: string
        /** The snapshot's id. */
        snapshotId: string
        /** Properties and values to change. Empty fields will not be changed. */
        properties: {
            name?: string
        }
    }): Promise<{
        error?:
            | {
                  code: 'model_not_found' | 'snapshot_not_found' | 'access_denied' | 'bad_credentials' | 'too_many_requests' | 'payment_required' | 'unknown'
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {}
    }>

    /**
     * Delete a snapshot from a model.
     */
    deleteSnapshot(params: {
        /** The model's id. */
        modelId: string
        /** The snapshot's id. */
        snapshotId: string
    }): Promise<{
        error?:
            | {
                  code: 'model_not_found' | 'snapshot_not_found' | 'access_denied' | 'bad_credentials' | 'too_many_requests' | 'payment_required' | 'unknown'
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
            tags?: {
                tag: string
                value: string
            }[]
            parameterDefinitions?: ParameterDefinitions
            defaultLauncherSpecs?: {
                createState?: LauncherSpec
                evaluate?: LauncherSpec
            }
            maxDurationsSeconds?: {
                codeStartup: number
                instantiateModel: number
                createState: number
                train: number
                evaluate: number
            }
        }
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
            /** The total number of datasets that matched the filter. */
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
                      | 'invalid_executor_type'
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
     * Fetches usage statistics such as free blocks and free inodes.
     */
    getFilesystemUsage(params: {
        /** The model's id. */
        modelId: string
    }): Promise<{
        error?:
            | {
                  code:
                      | 'model_not_found'
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
        result?: {
            blockSize: number
            totalBlocks: number
            freeBlocks: number
            totalInodes: number
            freeInodes: number
        }
    }>

    /**
     * Change the Docker image used when executing the model.
     */
    setImage(params: {
        /** The model's id. */
        modelId: string
        /** The domain name to load from, i.e "docker.io" or "registry.decthings.com" */
        domain: string
        /** The repository to use, i.e "library/ubuntu" */
        repository: string
        /** The tag to use, to, i.e "latest" */
        reference: string
    }): Promise<{
        error?:
            | {
                  code: 'model_not_found' | 'access_denied' | 'image_not_found' | 'bad_credentials' | 'too_many_requests' | 'payment_required' | 'unknown'
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {}
    }>

    /**
     * Create a new model state by calling the createModelState function on the model. The created state will be added
     * to the model's state storage.
     */
    createState(params: {
        /** The model's id. */
        modelId: string
        /** Name of the new state. */
        name: string
        /** Parameters to provide to the createModelState function on the running model. */
        params: DecthingsParameterProvider[]
        /**
         * Allows your model to access to files and state of these additional models. Can be useful for merging models
         * together.
         */
        mountModels?: {
            /** Id of the other model to mount. */
            modelId: string
            /** Specifies which state on the other model to use. Defaults to the active state. */
            stateId?: string
            /**
             * If specified, this snapshot on the other model will be used. Cannot be used together with stateId, as the state
             * in the snapshot will be used if snapshotId is specified.
             */
            snapshotId?: string
        }[]
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
                      | 'model_to_mount_not_found'
                      | 'state_for_model_to_mount_not_found'
                      | 'snapshot_for_model_to_mount_not_found'
                      | 'persistent_launcher_not_found'
                      | 'snapshot_no_longer_exists'
                      | 'access_denied'
                      | 'quota_exceeded'
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
            /** One of failed or success will be present */
            failed?: {
                durations: {
                    total: number
                    createLauncher?: number
                    codeStartup?: number
                    createState?: number
                }
                error:
                    | {
                          code:
                              | 'launcher_terminated'
                              | 'cancelled'
                              | 'server_overloaded'
                              | 'invalid_executable_file'
                              | 'read_executable_file_failed'
                              | 'unknown'
                      }
                    | {
                          code: 'max_duration_exceeded'
                          at: 'codeStartup' | 'createState'
                      }
                    | {
                          code: 'code_terminated'
                          exitCode?: number
                          signal?: string
                          oom: boolean
                      }
                    | {
                          code: 'exception'
                          at: 'codeStartup' | 'createState'
                          exceptionDetails?: string
                      }
            }
            success?: {
                durations: {
                    total: number
                    createLauncher?: number
                    codeStartup?: number
                    createState: number
                }
                stateId: string
            }
        }
    }>

    /**
     * Create a new model state by uploading data.
     */
    uploadState(params: {
        /** The model's id. */
        modelId: string
        /** Name of the new state. */
        name: string
        /** Data to upload. */
        data: {
            key: string
            data: Buffer
        }[]
        /**
         * If provided, these states will be deleted when the new state has been uploaded, in a single atomic operation.
         * If either the upload or the delete fails, both the upload and the delete operations are aborted and an error is
         * returned.
         */
        deleteStates?: string[]
        /** Allows your model to access to files of these additional models. Can be useful for merging models together. */
        mountModels?: {
            /** Id of the other model to mount. */
            modelId: string
            /** If specified, this snapshot on the other model will be used. */
            snapshotId?: string
        }[]
    }): Promise<{
        error?:
            | {
                  code:
                      | 'model_not_found'
                      | 'model_to_mount_not_found'
                      | 'snapshot_for_model_to_mount_not_found'
                      | 'access_denied'
                      | 'quota_exceeded'
                      | 'state_not_found'
                      | 'state_is_active'
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
            stateId: string
        }
    }>

    /**
     * Cancel the creation of a state.
     */
    cancelCreateState(params: {
        /** The model's id. */
        modelId: string
        /** The state's id. */
        stateId: string
    }): Promise<{
        error?:
            | {
                  code:
                      | 'model_not_found'
                      | 'state_not_found'
                      | 'state_already_created'
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
     * Get all states that are being created on a model.
     */
    getCreatingStates(params: {
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
            states: {
                id: string
                name: string
                startedAt: number
            }[]
        }
    }>

    /**
     * Wait for a state that is being created to finish.
     */
    waitForStateToBeCreated(params: {
        /** The model's id. */
        modelId: string
        /** The state's id. */
        stateId: string
    }): Promise<{
        error?:
            | {
                  code:
                      | 'model_not_found'
                      | 'state_not_found'
                      | 'state_already_created'
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
            /** One of failed or success will be present */
            failed?: {
                durations: {
                    total: number
                    createLauncher?: number
                    codeStartup?: number
                    createState?: number
                }
                error:
                    | {
                          code:
                              | 'launcher_terminated'
                              | 'cancelled'
                              | 'server_overloaded'
                              | 'invalid_executable_file'
                              | 'read_executable_file_failed'
                              | 'unknown'
                      }
                    | {
                          code: 'max_duration_exceeded'
                          at: 'codeStartup' | 'createState'
                      }
                    | {
                          code: 'code_terminated'
                          exitCode?: number
                          signal?: string
                          oom: boolean
                      }
                    | {
                          code: 'exception'
                          at: 'codeStartup' | 'createState'
                          exceptionDetails?: string
                      }
            }
            success?: {
                durations: {
                    total: number
                    createLauncher?: number
                    codeStartup?: number
                    createState: number
                }
                stateId: string
            }
        }
    }>

    /**
     * Modify fields of a state.
     */
    updateModelState(params: {
        /** The model's id. */
        modelId: string
        /** The state's id. */
        stateId: string
        /** Properties and values to change. Empty fields will not be changed. */
        properties: {
            name?: string
        }
    }): Promise<{
        error?:
            | {
                  code: 'model_not_found' | 'state_not_found' | 'access_denied' | 'bad_credentials' | 'too_many_requests' | 'payment_required' | 'unknown'
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {}
    }>

    /**
     * Set the active state of a model.
     */
    setActiveModelState(params: {
        /** The model's id. */
        modelId: string
        /** The state's id. */
        stateId: string
    }): Promise<{
        error?:
            | {
                  code: 'model_not_found' | 'state_not_found' | 'access_denied' | 'bad_credentials' | 'too_many_requests' | 'payment_required' | 'unknown'
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {}
    }>

    /**
     * Delete a state.
     */
    deleteModelState(params: {
        /** The model's id. */
        modelId: string
        /** The state's id. */
        stateId: string
    }): Promise<{
        error?:
            | {
                  code:
                      | 'model_not_found'
                      | 'state_not_found'
                      | 'state_is_active'
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
     * Download the data of a model state.
     */
    getModelState(params: {
        /** The model's id. */
        modelId: string
        /** The state's id. Defaults to the active state. */
        stateId?: string
        /** Which keys to fetch. Defaults to all keys. */
        keys?: string[]
    }): Promise<{
        error?:
            | {
                  code: 'model_not_found' | 'state_not_found' | 'state_key_not_found' | 'bad_credentials' | 'too_many_requests' | 'payment_required' | 'unknown'
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
     * Download the data of a state which belongs to a snapshot.
     */
    getSnapshotState(params: {
        /** The model's id. */
        modelId: string
        /** The snapshot's id. */
        snapshotId: string
        /** Which keys to fetch. Defaults to all keys. */
        keys?: string[]
    }): Promise<{
        error?:
            | {
                  code:
                      | 'model_not_found'
                      | 'snapshot_not_found'
                      | 'state_key_not_found'
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
     * Start a new training session.
     */
    train(params: {
        /** The model's id. */
        modelId: string
        /** Which state to use when instantiating the model. Defaults to the active state. */
        stateId?: string
        /** A name to give the new state once it is created. */
        newStateName: string
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
                      | 'persistent_launcher_not_found'
                      | 'snapshot_no_longer_exists'
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
            newStateName: string
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
                          createInstantiatedModel?: number
                      }
                      progress: number
                  }
                | {
                      state: 'gettingState'
                      startDurations: {
                          createLauncher?: number
                          codeStartup?: number
                          createInstantiatedModel?: number
                      }
                      trainDuration: number
                  }
                | {
                      state: 'completed'
                      startDurations: {
                          createLauncher?: number
                          codeStartup?: number
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
                          codeStartup?: number
                          createInstantiatedModel?: number
                      }
                      trainDuration?: number
                      getStateDuration?: number
                      finishedAt: number
                      failReason:
                          | {
                                code:
                                    | 'cancelled'
                                    | 'launcher_terminated'
                                    | 'server_overloaded'
                                    | 'invalid_executable_file'
                                    | 'read_executable_file_failed'
                                    | 'unknown'
                            }
                          | {
                                code: 'exception'
                                at: 'codeStartup' | 'instantiateModel' | 'train' | 'getState'
                                exceptionDetails?: string
                            }
                          | {
                                code: 'code_terminated'
                                exitCode?: number
                                signal?: string
                                oom: boolean
                            }
                          | {
                                code: 'max_duration_exceeded'
                                at: 'codeStartup' | 'instantiateModel' | 'train' | 'getState'
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
     * Get evaluations from a model, given the provided input data.
     */
    evaluate(params: {
        /** The model's id. */
        modelId: string
        /** Parameters to provide to the train function on the running model. */
        params: DecthingsParameterProvider[]
        /** If provided, the snapshot with this id will be evaluated. */
        snapshotId?: string
    }): Promise<{
        error?:
            | {
                  code:
                      | 'model_not_found'
                      | 'snapshot_not_found'
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
            /** One of failed or success will be present */
            failed?: {
                totalDuration: number
                durations: {
                    createLauncher?: number
                    codeStartup?: number
                    createInstantiatedModel?: number
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
                error:
                    | {
                          code:
                              | 'launcher_terminated'
                              | 'cancelled'
                              | 'server_overloaded'
                              | 'invalid_executable_file'
                              | 'read_executable_file_failed'
                              | 'unknown'
                      }
                    | {
                          code: 'max_duration_exceeded'
                          at: 'codeStartup' | 'instantiateModel' | 'evaluate'
                      }
                    | {
                          code: 'code_terminated'
                          exitCode?: number
                          signal?: string
                          oom: boolean
                      }
                    | {
                          code: 'exception'
                          at: 'codeStartup' | 'instantiateModel' | 'evaluate'
                          exceptionDetails?: string
                      }
                    | {
                          code: 'invalid_output'
                          reason: 'invalid' | 'not_applicable_to_parameter_definitions'
                          details: string
                      }
            }
            success?: {
                totalDuration: number
                durations: {
                    createLauncher?: number
                    codeStartup?: number
                    createInstantiatedModel?: number
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
        }
    }>

    /**
     * Get running and finished evaluations of a model.
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
                startedAt: number
            }[]
            finished: {
                id: string
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
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {
            /** One of failed or success will be present */
            failed?: {
                totalDuration: number
                durations: {
                    createLauncher?: number
                    codeStartup?: number
                    createInstantiatedModel?: number
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
                error:
                    | {
                          code:
                              | 'launcher_terminated'
                              | 'cancelled'
                              | 'server_overloaded'
                              | 'invalid_executable_file'
                              | 'read_executable_file_failed'
                              | 'unknown'
                      }
                    | {
                          code: 'max_duration_exceeded'
                          at: 'codeStartup' | 'instantiateModel' | 'evaluate'
                      }
                    | {
                          code: 'code_terminated'
                          exitCode?: number
                          signal?: string
                          oom: boolean
                      }
                    | {
                          code: 'exception'
                          at: 'codeStartup' | 'instantiateModel' | 'evaluate'
                          exceptionDetails?: string
                      }
                    | {
                          code: 'invalid_output'
                          reason: 'invalid' | 'not_applicable_to_parameter_definitions'
                          details: string
                      }
            }
            success?: {
                totalDuration: number
                durations: {
                    createLauncher?: number
                    codeStartup?: number
                    createInstantiatedModel?: number
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
                      | 'snapshot_no_longer_exists'
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
            usedPersistentLaunchers: {
                persistentLauncherId: string
                level: 'launcher' | 'codeStart' | 'instantiatedModel'
            }[]
        }
    }>
}
