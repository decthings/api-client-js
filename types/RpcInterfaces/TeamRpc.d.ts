import { Team, Role } from '../../types'

export interface ITeamRpc {
    /**
     * Create a new team.
     * @param name The team's name.
     * @param description A short description of the team.
     * @returns The id of the created team.
     */
    createTeam(
        name: string,
        description: string
    ): Promise<{
        error?: { code: 'bad_credentials' } | { code: 'invalid_parameter'; parameterName: string; reason: string }
        teamId?: string
    }>

    /**
     * Change information about a team.
     * @param teamId The team's id.
     * @param properties Properties and values to change. Undefined fields will not be changed.
     */
    updateTeam(
        teamId: string,
        properties: {
            name?: string
            description?: string
        }
    ): Promise<{
        error?:
            | { code: 'bad_credentials' | 'team_not_found' }
            | { code: 'invalid_parameter'; parameterName: string; reason: string }
    }>

    /**
     * Retrieve information about teams on the account.
     * If the requested team wasn't returned, it means that the team doesn't exist (or you don't have access to it).
     * @param teamIds Which teams to fetch. If unspecified, all teams will be fetched.
     */
    getTeams(
        teamIds?: string[]
    ): Promise<{
        error?: { code: 'bad_credentials' } | { code: 'invalid_parameter'; parameterName: string; reason: string }
        teams?: Team[]
    }>

    /**
     * Invite users to a team.
     * @param teamId The team's id.
     * @param users Users to invite. If "role" is unspecified, the user will be assigned the role "Member".
     */
    inviteUsersToTeam(
        teamId: string,
        users: { userId: string; role?: string }[]
    ): Promise<{
        error?:
            | { code: 'bad_credentials' | 'team_not_found' | 'user_not_found' | 'role_not_found' | 'permission_denied' }
            | { code: 'invalid_parameter'; parameterName: string; reason: string }
    }>

    /**
     * Remove users from a team.
     * @param teamId The team's id.
     * @param userIds userId of each user to remove.
     */
    removeUsersFromTeam(
        teamId: string,
        userIds: string[]
    ): Promise<{
        error?:
            | { code: 'bad_credentials' | 'team_not_found' | 'member_not_found' | 'permission_denied' }
            | { code: 'invalid_parameter'; parameterName: string; reason: string }
    }>

    /**
     * Join a team that you have been invited to.
     * @param teamId The team's id.
     */
    acceptTeamInvitation(
        teamId: string
    ): Promise<{
        error?:
            | { code: 'bad_credentials' | 'team_not_found' | 'invite_already_accepted' }
            | { code: 'invalid_parameter'; parameterName: string; reason: string }
    }>

    /**
     * Reject a team invitation.
     * @param teamId The team's id.
     */
    denyTeamInvitation(
        teamId: string
    ): Promise<{
        error?:
            | { code: 'bad_credentials' | 'team_not_found' | 'invite_already_accepted' }
            | { code: 'invalid_parameter'; parameterName: string; reason: string }
    }>

    /**
     * Set whether a model should be shared within a team.
     * @param modelId The model's id.
     * @param teamId The team's id.
     * @param share Whether to share the model or not.
     */
    setShareModelWithTeam(
        modelId: string,
        teamId: string,
        share: boolean
    ): Promise<{
        error?:
            | { code: 'bad_credentials' | 'team_not_found' | 'model_not_found' | 'model_not_shared' | 'permission_denied' }
            | { code: 'invalid_parameter'; parameterName: string; reason: string }
    }>

    /**
     * Set whether a dataset should be shared within a team.
     * @param datasetId The dataset's id.
     * @param teamId The team's id.
     * @param share Whether to share the dataset or not.
     */
    setShareDatasetWithTeam(
        datasetId: string,
        teamId: string,
        share: boolean
    ): Promise<{
        error?:
            | { code: 'bad_credentials' | 'team_not_found' | 'dataset_not_found' | 'dataset_not_shared' | 'permission_denied' }
            | { code: 'invalid_parameter'; parameterName: string; reason: string }
    }>

    /**
     * Set whether a blueprint should be shared within a team.
     * @param blueprintId The blueprint's id.
     * @param teamId The team's id.
     * @param share Whether to share the blueprint or not.
     */
    setShareBlueprintWithTeam(
        blueprintId: string,
        teamId: string,
        share: boolean
    ): Promise<{
        error?:
            | {
                  code:
                      | 'bad_credentials'
                      | 'team_not_found'
                      | 'blueprint_not_found'
                      | 'blueprint_not_shared'
                      | 'permission_denied'
              }
            | { code: 'invalid_parameter'; parameterName: string; reason: string }
    }>

    /**
     * Define a new role within a team.
     */
    createRole(
        teamId: string,
        roleName: string,
        role: Role
    ): Promise<{
        error?:
            | { code: 'bad_credentials' | 'team_not_found' | 'role_name_already_used' | 'permission_denied' }
            | { code: 'invalid_parameter'; parameterName: string; reason: string }
    }>

    /**
     * Edit an existing role.
     */
    editRole(
        teamId: string,
        roleName: string,
        newRole: { name: string; role: Role }
    ): Promise<{
        error?:
            | { code: 'bad_credentials' | 'team_not_found' | 'role_not_found' | 'role_name_already_used' | 'permission_denied' }
            | { code: 'invalid_parameter'; parameterName: string; reason: string }
    }>

    /**
     * Remove a role within a team.
     * @param teamId The team's id.
     * @param roleName Name of the role to remove.
     * @param changeUsersTo If specified, all users with the removed role will be assigned this role. If unspecified and there are users assigned the removed role, the role will not be removed and an error will be returned.
     */
    removeRole(
        teamId: string,
        roleName: string,
        changeUsersTo?: string
    ): Promise<{
        error?:
            | { code: 'bad_credentials' | 'team_not_found' | 'role_not_found' | 'role_used' | 'permission_denied' }
            | { code: 'invalid_parameter'; parameterName: string; reason: string }
    }>

    /**
     * Assign a role to a user.
     */
    assignRole(
        teamId: string,
        userId: string,
        roleName: string
    ): Promise<{
        error?:
            | {
                  code:
                      | 'bad_credentials'
                      | 'team_not_found'
                      | 'role_not_found'
                      | 'permission_denied'
                      | 'member_not_found'
                      | 'cannot_be_owner'
                      | 'user_is_owner'
                      | 'unknown'
              }
            | { code: 'invalid_parameter'; parameterName: string; reason: string }
    }>
}
