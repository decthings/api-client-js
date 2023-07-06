import { LauncherSpec } from '../types'
import { GenericError } from './Error'

export interface PersistentLauncherRpc {
    /**
     * Create a new persistent launcher.
     * @param name A name for the launcher.
     * @returns The id of the created persistent launcher.
     */
    createPersistentLauncher(params: { name: string; spec: LauncherSpec }): Promise<{
        error?: { code: 'quota_exceeded' } | GenericError
        result?: {
            persistentLauncherId: string
        }
    }>

    /**
     * Retrieve information about persistent launchers. If the requested launcher wasn't returned, it means that the
     * launcher doesn't exist (or you don't have access to it).
     * @param persistentLauncherIds Which launchers to fetch. If unspecified, all launchers will be fetched.
     */
    getPersistentLaunchers(params: { persistentLauncherIds?: string[] }): Promise<{
        error?: GenericError
        result?: {
            persistentLaunchers: {
                id: string
                name: string
                spec: LauncherSpec
                state: { type: 'creating' | 'active' | 'deleting' } | { type: 'recreating'; previous: 'exit' | 'unknown' }
                createdAt?: number
                running: { id: string; type: 'terminal' | 'spawned' | 'debug' | 'createModelState' | 'train' | 'evaluate' }[]
            }[]
        }
    }>

    /**
     * Retrieve system information for a persistent launcher, such as CPU, memory and disk usage.
     * @param persistentLauncherId The persistent launcher's id.
     * @param fromTimestamp If specified, only data points after this time is included.
     */
    getSysinfo(params: { persistentLauncherId: string; fromTimestamp?: number }): Promise<{
        error?: { code: 'persistent_launcher_not_found' } | GenericError
        result?: {
            sysinfo: { timestamp: number; cpus: number; memory: number; disk?: number }[]
        }
    }>

    /**
     * Delete a persistent launcher. The persistent launcher will be kept alive until it has nothing running on it. In this
     * case, the launcher state will be set to "{ type: 'deleting' }".
     * @param persistentLauncherId The persistent launcher's id.
     */
    deletePersistentLauncher(params: { persistentLauncherId: string }): Promise<{
        error?: { code: 'persistent_launcher_not_found' | 'persistent_launcher_being_deleted' } | GenericError
        result?: {}
    }>
}
