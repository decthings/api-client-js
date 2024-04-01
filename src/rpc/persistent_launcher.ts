import { LauncherSpec } from '../types'

export interface PersistentLauncherRpc {
    /**
     * Create a new persistent launcher.
     */
    createPersistentLauncher(params: {
        /** A name for the launcher. */
        name: string
        /** Launcher specification to use. */
        spec: LauncherSpec
    }): Promise<{
        error?:
            | {
                  code: 'quota_exceeded' | 'bad_credentials' | 'too_many_requests' | 'payment_required' | 'unknown'
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {
            /** A unique identifier which you should use in subsequent API calls. */
            persistentLauncherId: string
        }
    }>

    /**
     * Retrieve information about persistent launchers. If the requested launcher wasn't returned, it means that the
     * launcher doesn't exist (or you don't have access to it).
     */
    getPersistentLaunchers(params: {
        /** Which launchers to fetch. If unspecified, all persistent launchers will be fetched. */
        persistentLauncherIds?: string[]
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
            persistentLaunchers: {
                id: string
                name: string
                spec: LauncherSpec
                state:
                    | {
                          type: 'creating' | 'active' | 'deleting'
                      }
                    | {
                          type: 'recreating'
                          previous: 'exit' | 'unknown'
                      }
                createdAt?: number
                running: {
                    id: string
                    type: 'terminal' | 'spawned' | 'debug' | 'createModelState' | 'train' | 'evaluate'
                }[]
            }[]
        }
    }>

    /**
     * Retrieve system information for a persistent launcher, such as CPU, memory and disk usage.
     */
    getSysinfo(params: {
        /** The persistent launcher's id. */
        persistentLauncherId: string
        /** If specified, only data points after this time are included. */
        fromTimestamp?: number
    }): Promise<{
        error?:
            | {
                  code: 'persistent_launcher_not_found' | 'bad_credentials' | 'too_many_requests' | 'payment_required' | 'unknown'
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
     * Delete a persistent launcher. The persistent launcher will be kept alive until it has nothing running on it. In
     * this case, the launcher state will be set to deleting.
     */
    deletePersistentLauncher(params: {
        /** The persistent launcher's id. */
        persistentLauncherId: string
    }): Promise<{
        error?:
            | {
                  code:
                      | 'persistent_launcher_not_found'
                      | 'persistent_launcher_being_deleted'
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
}
