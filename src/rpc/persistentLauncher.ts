import { LauncherSpec } from '../types'

export type PersistentLauncher = {
    id: string
    name: string
    createdAt?: number
    spec: LauncherSpec
    state:
        | {
              type: 'creating' | 'active' | 'deleting'
          }
        | {
              type: 'recreating'
              previous: 'exit' | 'unknown'
          }
    running: {
        id: string
        type: 'terminal' | 'spawned' | 'debug' | 'train' | 'evaluate'
    }[]
}

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
        /** Number of items from the results to skip. Defaults to 0. */
        offset?: number
        /** Max number of items to return. Defaults to 20. */
        limit?: number
        /** If specified, determines which items to retrieve. */
        filter?: {
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
            persistentLaunchers: PersistentLauncher[]
            /** The total number of datasets that matched the filter. */
            total: number
            offset: number
            limit: number
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
