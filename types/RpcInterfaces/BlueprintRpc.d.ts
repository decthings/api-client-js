import { IParameterDef } from '../DataTypes'
import { Blueprint, LauncherSpec } from '../../types'

export interface IBlueprintRpc {
    /**
     * Create a new blueprint.
     * @param name The blueprint's name.
     * @param description A short description of the blueprint.
     * @param empty If true, no files will be added to the directory of the blueprint.
     */
    createBlueprint(
        name: string,
        description: string,
        type: 'NodeJS_stateful' | 'Python2_stateful' | 'Python3_stateful',
        empty?: boolean
    ): Promise<{
        error?: { code: 'bad_credentials' | 'unknown' } | { code: 'invalid_parameter'; parameterName: string; reason: string }
        blueprintId?: string
    }>

    /**
     * Change information about a blueprint.
     * @param blueprintId The blueprint's id.
     * @param properties Properties and values to change. Undefined fields will not be changed.
     */
    updateBlueprint(
        blueprintId: string,
        properties: {
            name?: string
            description?: string
            parameterDefinitions?: {
                createModelState?: IParameterDef[]
                train?: IParameterDef[]
                evaluateInput: IParameterDef[]
                evaluateOutput: IParameterDef[]
            }
            recommendedLauncherSpecs?: { createModelState: LauncherSpec; train: LauncherSpec; evaluate: LauncherSpec }
        }
    ): Promise<{
        error?: { code: 'bad_credentials' | 'blueprint_not_found' | 'access_denied' } | { code: 'invalid_parameter'; parameterName: string; reason: string }
    }>

    /**
     * Retrieve information about blueprints. If the requested blueprint wasn't returned, it means it doesn't exist (or you don't have access to it).
     * @param blueprintIds Which blueprints to fetch. If unspecified, all blueprints will be fetched.
     */
    getBlueprints(
        blueprintIds?: string[]
    ): Promise<{
        error?: { code: 'bad_credentials' } | { code: 'invalid_parameter'; parameterName: string; reason: string }
        blueprints?: Blueprint[]
    }>

    /**
     * Make a new release of a blueprint.
     * @param blueprintId The blueprint's id.
     * @param versionName A version name of format "major.minor.patch". Visit https://semver.org for more information.
     */
    releaseBlueprint(
        blueprintId: string,
        versionName: string
    ): Promise<{
        error?:
            | { code: 'bad_credentials' | 'blueprint_not_found' | 'version_exists' | 'access_denied' | 'unknown' }
            | { code: 'invalid_parameter'; parameterName: string; reason: string }
    }>
}
