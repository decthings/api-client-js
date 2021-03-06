import { LauncherSpec } from '../../types'

export interface IPersistentLauncherRpc {
    /**
     * Create a new persistent launcher.
     * @param name A name for the launcher.
     * @returns The id of the created persistent launcher.
     */
    createPersistentLauncher(
        name: string,
        spec: LauncherSpec
    ): Promise<{
        error?: { code: 'bad_credentials' } | { code: 'invalid_parameter'; parameterName: string; reason: string }
        persistentLauncherId?: string
    }>

    /**
     * Retrieve information about launchers. If the requested launcher wasn't returned, it means that the launcher doesn't exist (or you don't have access to it).
     * @param persistentLauncherIds Which launchers to fetch. If unspecified, all launchers will be fetched.
     */
    getPersistentLaunchers(
        persistentLauncherIds?: string[]
    ): Promise<{
        error?: { code: 'bad_credentials' } | { code: 'invalid_parameter'; parameterName: string; reason: string }
        persistentLaunchers?: {
            id: string
            name: string
            spec: LauncherSpec
            state: 'creating' | 'active' | 'deleting'
            createdAt?: number
            running: { id: string; type: 'terminal' | 'debug' | 'createModelState' | 'train' | 'evaluate' }[]
        }[]
    }>

    /**
     * Delete a persistent launcher.
     * @param persistentLauncherId Id of the launcher to delete.
     */
    deletePersistentLauncher(
        persistentLauncherId: string
    ): Promise<{
        error?:
            | { code: 'bad_credentials' | 'persistent_launcher_not_found' | 'persistent_launcher_being_deleted' }
            | { code: 'invalid_parameter'; parameterName: string; reason: string }
    }>
}
