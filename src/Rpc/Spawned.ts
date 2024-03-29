import { EventEmitter } from 'events'
import { LauncherConfig, LauncherSpec } from '../types'
import { GenericError } from './Error'

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
     * Event emitted when output for a spawned command is received on standard output.
     */
    on(event: 'stdout', handler: (params: { spawnedCommandId: string; data: Buffer }) => void): this
    emit(event: 'stdout', params: { spawnedCommandId: string; data: Buffer }): boolean
    removeListener(event: 'stdout', handler: (params: { spawnedCommandId: string; data: Buffer }) => void): this

    /**
     * Event emitted when output for a spawned command is received on standard error.
     */
    on(event: 'stderr', handler: (params: { spawnedCommandId: string; data: Buffer }) => void): this
    emit(event: 'stderr', params: { spawnedCommandId: string; data: Buffer }): boolean
    removeListener(event: 'stderr', handler: (params: { spawnedCommandId: string; data: Buffer }) => void): this

    /**
     * Event emitted when a spawned command exits.
     */
    on(event: 'exit', handler: (params: { spawnedCommandId: string; reason: SpawnedCommandTerminatedReason }) => void): this
    emit(event: 'exit', params: { spawnedCommandId: string; reason: SpawnedCommandTerminatedReason }): boolean
    removeListener(event: 'exit', handler: (params: { spawnedCommandId: string; reason: SpawnedCommandTerminatedReason }) => void): this

    /**
     * Spawn a command which is running in an empty filesystem.
     * @param executionLocation Which launcher to use for running the command.
     * @param options
     * timeoutSeconds: Will automatically terminate the command after this amount of time. Default: 3600.
     * timeoutAfterInactiveSeconds: Will automatically terminate the command if no output is received from the process for this amount of time. Default: 600.
     * @param subscribeToEvents If true and connection is WebSocket, immediately subscribes you to events "stdout", "stderr" and "exit" for the spawned command. Default: true.
     */
    spawnCommand(params: {
        executionLocation: { type: 'persistentLauncher'; persistentLauncherId: string } | { type: 'temporaryLauncher'; spec: LauncherSpec }
        command: string
        args: string[]
        options?: {
            timeoutSeconds?: number
            timeoutAfterInactiveSeconds?: number
            launcherConfig?: LauncherConfig
        }
        subscribeToEvents?: boolean
    }): Promise<{
        error?:
            | {
                  code: 'persistent_launcher_not_found' | 'quota_exceeded' | 'server_overloaded'
              }
            | GenericError
        result?: {
            spawnedCommandId: string
        }
    }>

    /**
     * Spawn a command which executes with access to the model's filesystem.
     * @param modelId The model's id.
     * @param executionLocation Which launcher to use for running the command.
     * @param options
     * addFilesystemAccess: Adds filesystem access for additional models. Useful for copying files between models for example.
     * timeoutSeconds: Will automatically terminate the command after this amount of time. Default: 3600.
     * timeoutAfterInactiveSeconds: Will automatically terminate the command if no output is received from the process for this amount of time. Default: 600.
     * @param subscribeToEvents If true and connection is WebSocket, immediately subscribes you to events "stdout", "stderr" and "exit" for the spawned command. Default: true.
     */
    spawnCommandForModel(params: {
        modelId: string
        executionLocation: { type: 'persistentLauncher'; persistentLauncherId: string } | { type: 'temporaryLauncher'; spec: LauncherSpec }
        command: string
        args: string[]
        options?: {
            addFilesystemAccess?: { modelId: string }[]
            timeoutSeconds?: number
            timeoutAfterInactiveSeconds?: number
        }
        subscribeToEvents?: boolean
    }): Promise<{
        error?:
            | {
                  code: 'model_not_found' | 'invalid_executor_type' | 'persistent_launcher_not_found' | 'quota_exceeded' | 'server_overloaded'
              }
            | GenericError
        result?: {
            spawnedCommandId: string
        }
    }>

    /**
     * Terminates a running spawned command.
     * @param spawnedCommandId The spawned command's id.
     */
    terminateSpawnedCommand(params: { spawnedCommandId: string }): Promise<{
        error?: { code: 'spawned_command_not_found' } | GenericError
        result?: {}
    }>

    /**
     * Retrieve information about running spawned commands. If the requested command wasn't returned, it means it doesn't exist (or you don't have access to it).
     * @param spawnedCommandIds Which spawned commands to fetch. If unspecified, all running commands will be fetched.
     */
    getSpawnedCommands(params: { spawnedCommandIds?: string[] }): Promise<{
        error?: GenericError
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
     * @param spawnedCommandId The spawned command's id.
     * @param data Data to write.
     */
    writeToSpawnedCommand(params: { spawnedCommandId: string; data: string | Buffer }): Promise<{
        error?: { code: 'spawned_command_not_found' } | GenericError
        result?: {}
    }>

    /**
     * Subscribe to events for a spawned command. This will allow you to receive output and exit events.
     *
     * Subscriptions are based on the WebSocket connection. If you reconnect with a new WebSocket, you must call this again.
     * @param spawnedCommandId The spawned command's id.
     */
    subscribeToEvents(params: { spawnedCommandId: string }): Promise<{
        error?: { code: 'spawned_command_not_found' } | GenericError
        result?: {}
    }>

    /**
     * Remove the subscription.
     * @param spawnedCommandId The spawned command's id.
     */
    unsubscribeFromEvents(params: { spawnedCommandId: string }): Promise<{
        error?: { code: 'not_subscribed' | 'too_many_requests' | 'unknown' } | { code: 'invalid_parameter'; parameterName: string; reason: string }
        result?: {}
    }>
}
