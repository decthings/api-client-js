import { ParameterDef, DataRules } from './DataTypes'

export type StatefulParameterDefinitions = {
    createState: ParameterDef[]
    train: ParameterDef[]
    evaluateInput: ParameterDef[]
    evaluateOutput: ParameterDef[]
}

export type StatelessParameterDefinitions = {
    evaluateInput: ParameterDef[]
    evaluateOutput: ParameterDef[]
}

export type CompositeModelDefinition = {
    maxNesting: number
    nodes: {
        modelId: string
        inputs: {
            parameterName: string
            from:
                | {
                      type: 'node'
                      nodeIndex: number
                      fromOutputName: string
                  }
                | {
                      type: 'constant'
                      index: number
                  }
                | {
                      type: 'input'
                      index: number
                  }
        }[]
        layout: {
            posX: number
            posY: number
        }
        /**
         * If any of these conditions are true,
         * the program will be pre-launched after the delay
         * specified in that conition.
         */
        prelaunchWhen?: {
            /**
             * When all of these nodes (specified by their index) have been completed, the condition is satisfied.
             */
            condition: number[]
            delay: number
        }[]
    }[]
    constants: {
        value:
            | {
                  type: 'dataset'
                  datasetId: string
              }
            | {
                  type: 'data'
                  id: string
              }
        layout: {
            posX: number
            posY: number
        }
    }[]
    inputs: {
        inputs: {
            name: string
        }[]
        layout: {
            posX: number
            posY: number
        }
    }
    outputs: {
        outputName: string
        from: {
            nodeIndex: number
            fromOutputName: string
        }
        layout: {
            posX: number
            posY: number
        }
    }[]
}

export type LauncherSpec = {
    cpus: 0.125 | 0.25 | 0.5 | 1 | 2
    memoryMebibytes: number
    diskMebibytes?: number
    swapMebibytes?: number
}

export type LauncherConfig = {
    nodeVersion?: string
    pythonVersion?: string
    packages: {
        python: {
            pytorchVersion?: string
            tensorflowVersion?: string
        }
    }
}

export type CompositeExecutor = {
    type: 'composite'
    definition: CompositeModelDefinition
    definitionBeingEdited: CompositeModelDefinition
    snapshots: {
        id: string
        name: string
        createdAt: number
        definition: CompositeModelDefinition
    }[]
}

export type CodeExecutor = {
    type: 'code'
    language: 'nodeJs' | 'python'
    parameterDefinitions: StatefulParameterDefinitions
    defaultLauncherSpecs: {
        createState: LauncherSpec
        evaluate: LauncherSpec
    }
    maxDurationsSeconds: { launchSession: number; instantiateModel: number; createState: number; train: number; evaluate: number }
    filesystemSizeMebibytes: number
    launcherConfig: LauncherConfig

    ongoingTrainingSessions: string[]
    trainingSessions: string[]
    states: ModelState[]
    currentState: string

    snapshots: {
        id: string
        name: string
        createdAt: number
        filesystemSizeMebibytes: number
        launcherConfig: LauncherConfig
        parameterDefinitions: StatefulParameterDefinitions
        defaultLauncherSpecs: {
            createState: LauncherSpec
            evaluate: LauncherSpec
        }
        maxDurationsSeconds: {
            launchSession: number
            instantiateModel: number
            createState: number
            train: number
            evaluate: number
        }
        state: {
            name: string
            byteSize: number
            segmentByteSizes: number[]
        }
    }[]

    basedOnSnapshot?: {
        modelId: string
        snapshotId: string
        noLongerExists: boolean
    }
}

export type Model = {
    id: string
    name: string
    description: string
    owner: string
    access: 'read' | 'readwrite'
    executor: CodeExecutor | CompositeExecutor
}

export type ModelState = {
    id: string
    name: string
    /**
     * Ids of all the training operations that has been performed to reach this state.
     */
    trainingOperations: string[]
    createdAt: number
    beingDeleted: boolean
    byteSize: number
    segmentByteSizes: number[]
}

export type FailedEvaluationResultDetails =
    | {
          modelType: 'code'
          durations: {
              createLauncher?: number
              createSession?: number
              createInstantiatedModel?: number
              evaluate?: number
          }
          executedOnLauncher?:
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
                    code: 'launcher_terminated' | 'cancelled' | 'server_overloaded' | 'unknown'
                }
              | { code: 'session_terminated'; exitCode?: number; signal?: string; oom: boolean }
              | { code: 'exception'; at: 'launchSession' | 'instantiateModel' | 'evaluate'; exceptionDetails?: string }
              | {
                    code: 'max_duration_exceeded'
                    at: 'launchSession' | 'instantiateModel' | 'evaluate'
                }
              | { code: 'invalid_output'; type: 'invalid' | 'not_applicable_to_parameter_definitions'; reason: string }
      }
    | {
          modelType: 'composite'
          nodes: {
              definition: CompositeModelDefinition['nodes'][0]
              failed?: FailedEvaluationResultDetails
              success?: EvaluationResultDetails
          }[]
          outputs: CompositeModelDefinition['outputs']
          inputs: CompositeModelDefinition['inputs']
          constants: {
              value: null
              layout: {
                  posX: number
                  posY: number
              }
          }[]
      }

export type EvaluationResultDetails =
    | {
          modelType: 'code'
          durations: {
              createLauncher?: number
              createSession?: number
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
      }
    | {
          modelType: 'composite'
          nodes: { definition: CompositeModelDefinition['nodes'][0]; details: EvaluationResultDetails }[]
          outputs: CompositeModelDefinition['outputs']
          inputs: CompositeModelDefinition['inputs']
          constants: {
              value: null
              layout: {
                  posX: number
                  posY: number
              }
          }[]
      }

export type Dataset = {
    id: string
    name: string
    description: string
    /**
     * The dataset's owner. If it is owned by a user, this will be the user's ID.
     *
     * If the dataset is provided by Decthings, this will be "decthings".
     */
    owner: string
    access: 'read' | 'readwrite'
    rules: DataRules
    entries: {
        count: number
        totalByteSize: number
    }
    needsReviewEntries: {
        count: number
        totalByteSize: number
    }
    entriesWaitingToBeDeleted: {
        count: number
        totalByteSize: number
    }
    versionId: string
}

export type Team = {
    id: string
    name: string
    description: string
    members: {
        userId: string
        role: string
    }[]
    roles: {
        name: string
        role: Role
    }[]
    pendingInvites: {
        userId: string
        role: string
    }[]
    resources: {
        /**
         * Models that are shared within the team.
         */
        models: string[]
        /**
         * Datasets that are shared within the team.
         */
        datasets: string[]
    }
}

export type Role = {
    canInvitePeople: boolean
    canKickPeople: boolean
    /**
     * Specifies which resources the user has access to.
     *
     * If the type is "include", resources in the elements array are given access to, and only those resource.
     * If the type is "exclude", all resources are included except the resources in the elements array.
     *
     * Therefore, to give access to all resources:
     *
     * ```javascript
     * {
     *     type: 'exclude',
     *     elements: []
     * }
     * ```
     *
     * To give access to no resources:
     *
     * ```javascript
     * {
     *     type: 'include',
     *     elements: []
     * }
     * ```
     */
    hasAccessToResources: {
        models: {
            type: 'include' | 'exclude'
            elements: string[]
        }
        datasets: {
            type: 'include' | 'exclude'
            elements: string[]
        }
    }
}
