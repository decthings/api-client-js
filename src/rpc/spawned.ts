import { EventEmitter } from 'events'
import { LauncherConfig, LauncherSpec } from '../types'

export type SpawnedCommandTerminatedReason =
    | {
          code: 'terminated_on_request' | 'launcher_terminated' | 'inactive_timeout' | 'unknown'
      }
    | {
          code: 'process_exit'
          exitCode?: number
          signal?: string
          oom: boolean
      }

export interface SpawnedRpc extends EventEmitter {
    /**
     * Event emitted when a spawned command exits.
     */
    on(event: 'exit', handler: (params: { spawnedCommandId: string; reason: SpawnedCommandTerminatedReason }) => void): this
    emit(
        event: 'exit',
        params: {
            spawnedCommandId: string
            reason: SpawnedCommandTerminatedReason
        }
    ): boolean
    removeListener(event: 'exit', handler: (params: { spawnedCommandId: string; reason: SpawnedCommandTerminatedReason }) => void): this

    /**
     * Event emitted when output for a spawned command is received on standard output (for example
     * "console.log(msg)").
     */
    on(event: 'stdout', handler: (params: { spawnedCommandId: string; data: Buffer }) => void): this
    emit(
        event: 'stdout',
        params: {
            spawnedCommandId: string
            data: Buffer
        }
    ): boolean
    removeListener(event: 'stdout', handler: (params: { spawnedCommandId: string; data: Buffer }) => void): this

    /**
     * Event emitted when output for a spawned command is received on standard output (for example
     * "console.error(msg)").
     */
    on(event: 'stderr', handler: (params: { spawnedCommandId: string; data: Buffer }) => void): this
    emit(
        event: 'stderr',
        params: {
            spawnedCommandId: string
            data: Buffer
        }
    ): boolean
    removeListener(event: 'stderr', handler: (params: { spawnedCommandId: string; data: Buffer }) => void): this

    /**
     * Spawn a command which is running in an empty filesystem.
     */
    spawnCommand(params: {
        /** Which launcher to use for running the command. */
        executionLocation:
            | {
                  type: 'persistentLauncher'
                  persistentLauncherId: string
              }
            | {
                  type: 'temporaryLauncher'
                  spec: LauncherSpec
              }
        /** Name of the command to run, without any arguments. */
        command: string
        /** Arguments to pass to the command */
        args: string[]
        options?: {
            /** Will automatically terminate the command after this amount of time. Default: 3600. */
            timeoutSeconds?: number
            /**
             * Will automatically terminate the command if no output is received from the process for this amount of time.
             * Default: 600.
             */
            timeoutAfterInactiveSeconds?: number
            /** LauncherConfig to use. */
            launcherConfig?: LauncherConfig
        }
        /**
         * If true, immediately subscribes you to events "stdout", "stderr" and "exit" for the spawned command. Default:
         * true.
         */
        subscribeToEvents?: boolean
    }): Promise<{
        error?:
            | {
                  code:
                      | 'persistent_launcher_not_found'
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
            spawnedCommandId: string
        }
    }>

    /**
     * Spawn a command which executes with access to the model's filesystem.
     */
    spawnCommandForModel(params: {
        /** The model's id. */
        modelId: string
        /** Which launcher to use for running the command. */
        executionLocation:
            | {
                  type: 'persistentLauncher'
                  persistentLauncherId: string
              }
            | {
                  type: 'temporaryLauncher'
                  spec: LauncherSpec
              }
        /** Name of the command to run, without any arguments. */
        command: string
        /** Arguments to pass to the command */
        args: string[]
        options?: {
            /** Adds filesystem access for additional models. Useful for copying files between models for example. */
            addFilesystemAccess?: {
                modelId: string
            }[]
            /** Will automatically terminate the command after this amount of time. Default: 3600. */
            timeoutSeconds?: number
            /**
             * Will automatically terminate the command if no output is received from the process for this amount of time.
             * Default: 600.
             */
            timeoutAfterInactiveSeconds?: number
        }
        /**
         * If true, immediately subscribes you to events "stdout", "stderr" and "exit" for the spawned command. Default:
         * true.
         */
        subscribeToEvents?: boolean
    }): Promise<{
        error?:
            | {
                  code:
                      | 'model_not_found'
                      | 'persistent_launcher_not_found'
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
            spawnedCommandId: string
        }
    }>

    /**
     * Terminates a running spawned command.
     */
    terminateSpawnedCommand(params: {
        /** The spawned command's id. */
        spawnedCommandId: string
    }): Promise<{
        error?:
            | {
                  code: 'spawned_command_not_found' | 'bad_credentials' | 'too_many_requests' | 'payment_required' | 'unknown'
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {}
    }>

    /**
     * Retrieve information about running spawned commands. If the requested command wasn't returned, it means it
     * doesn't exist (or you don't have access to it).
     */
    getSpawnedCommands(params: {
        /** Which spawned commands to fetch. If unspecified, all running commands will be fetched. */
        spawnedCommandIds?: string[]
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
            spawnedCommands: {
                id: string
                startedAt: number
                modelId?: string
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
     * Writes data to the stdin of a spawned command.
     */
    writeToSpawnedCommand(params: {
        /** The spawned command's id. */
        spawnedCommandId: string
        data: string | Buffer
    }): Promise<{
        error?:
            | {
                  code: 'spawned_command_not_found' | 'bad_credentials' | 'too_many_requests' | 'payment_required' | 'unknown'
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {}
    }>

    /**
     * Subscribe to events for a spawned command. This will allow you to receive output and exit events. Subscriptions
     * are based on the WebSocket connection. If you reconnect with a new WebSocket, you must call this again.
     */
    subscribeToEvents(params: {
        /** The spawned command's id. */
        spawnedCommandId: string
    }): Promise<{
        error?:
            | {
                  code: 'spawned_command_not_found' | 'bad_credentials' | 'too_many_requests' | 'payment_required' | 'unknown'
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
        /** The spawned command's id. */
        spawnedCommandId: string
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
