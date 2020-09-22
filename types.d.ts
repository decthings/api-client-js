import { IDataType, IParameterDef, IDataProvider } from './types/DataTypes'

export type StatefulParameterDefinitions = {
    createModelState: IParameterDef[]
    train: IParameterDef[]
    evaluateInput: IParameterDef[]
    evaluateOutput: IParameterDef[]
}

export type StatelessParameterDefinitions = {
    evaluateInput: IParameterDef[]
    evaluateOutput: IParameterDef[]
}

export type CompositeModelDefinition = {
    nodes: {
        model: string
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
                      value: IDataProvider
                  }
                | {
                      type: 'input'
                      inputName: string
                  }
        }[]
    }[]
    outputs: {
        outputName: string
        from: {
            nodeIndex: number
            fromOutputName: string
        }
    }[]
}

/**
 * Launcher types.
 * - tiny: 0.1 cores, 100Mb memory.
 * - mini: 0.25 cores, 250Mb memory.
 * - small: 0.5 cores, 500Mb memory.
 * - medium: 1 core, 1Gb memory.
 * - large: 2 cores, 2Gb memory.
 */
export type LauncherSpec = 'c0.1-0.4' | 'c0.25-1' | 'c0.5-2' | 'c1-4' | 'c2-8'

export type StatefulExecutor =
    | {
          type: 'NodeJS_stateful'
          parameterDefinitions: StatefulParameterDefinitions
          defaultLauncherSpecs: {
              createModelState: LauncherSpec
              train: LauncherSpec
              evaluate: LauncherSpec
          }
          maxEvaluateDurationsSeconds: { launchSession: number; instantiateModel: number; evaluate: number }
      }
    | {
          type: 'Python2_stateful'
          parameterDefinitions: StatefulParameterDefinitions
          defaultLauncherSpecs: {
              createModelState: LauncherSpec
              train: LauncherSpec
              evaluate: LauncherSpec
          }
          maxEvaluateDurationsSeconds: { launchSession: number; instantiateModel: number; evaluate: number }
      }
    | {
          type: 'Python3_stateful'
          parameterDefinitions: StatefulParameterDefinitions
          defaultLauncherSpecs: {
              createModelState: LauncherSpec
              train: LauncherSpec
              evaluate: LauncherSpec
          }
          maxEvaluateDurationsSeconds: { launchSession: number; instantiateModel: number; evaluate: number }
      }
    | {
          type: 'blueprint'
          blueprintId: string
          blueprintVersion: string
          blueprintType: 'NodeJS_stateful' | 'Python2_stateful' | 'Python3_stateful'
          parameterDefinitions: StatefulParameterDefinitions
          defaultLauncherSpecs: {
              createModelState: LauncherSpec
              train: LauncherSpec
              evaluate: LauncherSpec
          }
          maxEvaluateDurationsSeconds: { launchSession: number; instantiateModel: number; evaluate: number }
      }

export type StatelessExecutor =
    | {
          type: 'NodeJS_stateless'
          parameterDefinitions: StatelessParameterDefinitions
          defaultLauncherSpecs: {
              evaluate: LauncherSpec
          }
          maxEvaluateDurationsSeconds: { launchSession: number; evaluate: number }
      }
    | {
          type: 'Python2_stateless'
          parameterDefinitions: StatelessParameterDefinitions
          defaultLauncherSpecs: {
              evaluate: LauncherSpec
          }
          maxEvaluateDurationsSeconds: { launchSession: number; evaluate: number }
      }
    | {
          type: 'Python3_stateless'
          parameterDefinitions: StatelessParameterDefinitions
          defaultLauncherSpecs: {
              evaluate: LauncherSpec
          }
          maxEvaluateDurationsSeconds: { launchSession: number; evaluate: number }
      }
    | {
          type: 'composite'
          tree: CompositeModelDefinition
      }

export type Executor = StatelessExecutor | StatefulExecutor

export type StatelessModel = {
    id: string
    name: string
    description: string
    owner: string
    access: 'read' | 'readwrite'
    executor: StatelessExecutor
    stateful: false
}

export type StatefulModel = {
    id: string
    name: string
    description: string
    owner: string
    access: 'read' | 'readwrite'
    executor: StatefulExecutor
    stateful: true
    ongoingTrainingSessions: string[]
    trainingSessions: string[]
    /**
     * A list of states associated with the model.
     */
    states: ModelState[]
    /**
     * A list of states that are being created.
     */
    statesBeingCreated: { title: string; id: string }[]
    /**
     * The current state.
     */
    currentState: string
    /**
     * A list of states that will be kept in storage.
     */
    storedModelStates: string[]
}

export type Model = StatelessModel | StatefulModel

export type ExecutionSpecs = {
    modelId: string
    method: 'createModelState' | 'train' | 'evaluate'
    default: LauncherSpec
    executionSpecs: {
        persistentLauncherId: string
        level: 'launcher' | 'session' | 'instantiatedModel'
    }[]
}

export type ModelState = {
    id: string
    title: string
    /**
     * Ids of all the training operations that has been performed to reach this state.
     */
    trainingOperations: string[]
    /**
     * Timestamp for when this state was created.
     */
    timestamp: number
}

export type TrainingSession = {
    id: string
    modelId: string
    /**
     * running: The training session is running.
     * finishing: The training session is completed and the new state is being created.
     * completed: The training session is completed and the new state has been applied to the model.
     * failed: The training session did not complete successfully.
     * cancelled: The user has cancelled the session.
     */
    status: 'running' | 'finishing' | 'completed' | 'failed' | 'cancelled'
    startedAt: number
    finishedAt?: number
    metrics: { name: string; entries: { value: any; timestamp: number }[] }[]
    /**
     * The reason that the training session failed, as reported by the executor.
     */
    failReason?: string
    error?: { code: 'response_not_serializable' } | { code: 'uncaught_exception'; errorDetails?: string }
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
    rules: {
        type: IDataType | 'any'
        array: 'one-dimensional' | 'multi-dimensional'
    }
    entries: {
        count: number
        totalByteSize: number
    }
    needsReviewEntries?: {
        count: number
        totalByteSize: number
    }
}

export type Blueprint = {
    id: string
    name: string
    description: string
    type: 'NodeJS_stateful' | 'Python2_stateful' | 'Python3_stateful'
    /**
     * The blueprint's owner. If it is owned by a user, this will be the user's ID.
     *
     * If the blueprint is provided by Decthings, this will be "decthings".
     */
    owner: string
    access: 'read' | 'readwrite'
    /**
     * Defines what parameters the user must pass when using this blueprint.
     */
    parameterDefinitions: StatefulParameterDefinitions
    recommendedLauncherSpecs: { createModelState: LauncherSpec; train: LauncherSpec; evaluate: LauncherSpec }
    releases: {
        version: string
        releasedAt: number
        /**
         * Defines what parameters the user must pass when using this blueprint.
         */
        parameterDefinitions: StatefulParameterDefinitions
        recommendedLauncherSpecs: { createModelState: LauncherSpec; train: LauncherSpec; evaluate: LauncherSpec }
    }[]
}

export type DebugSession = {
    id: string
    startedAt: number
    executor:
        | {
              type: 'blueprint'
              blueprintId: string
              parameterDefinitions: StatefulParameterDefinitions
          }
        | {
              type: 'model'
              modelId: string
              parameterDefinitions: StatefulParameterDefinitions | StatelessParameterDefinitions
          }
}

/**
 * Information that anyone can obtain.
 */
export type User_Public = {
    id: string
    username: string
}

/**
 * Information about the current user.
 */
export type CurrentUser = {
    id: string
    username: string
    email: string
}
export type Notification = {
    id: string
    timestamp: number
    data:
        | {
              type: 'accountRegistered'
          }
        | {
              type: 'teamInvite'
              teamId: string
              teamName: string
              invitedBy: User_Public
          }
        | {
              type: 'trainingFinished'
              modelId: string
              trainingSessionId: string
              state: 'maxDurationExceeded' | 'failed' | 'completed'
          }
    viewed: boolean
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
        /**
         * Blueprints that are shared within the team.
         */
        blueprints: string[]
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
        blueprints: {
            type: 'include' | 'exclude'
            elements: string[]
        }
    }
}
