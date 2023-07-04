import { Team, Role } from '../types'
import { GenericError } from './Error'

export interface ITeamRpc {
    /**
     * Create a new team.
     * @param name The team's name.
     * @param description A description of the team.
     * @returns The id of the created team.
     */
    createTeam(params: { name: string; description: string }): Promise<{
        error?: { code: 'quota_exceeded' } | GenericError
        result?: {
            teamId: string
        }
    }>

    /**
     * Change information about a team.
     * @param teamId The team's id.
     * @param properties Properties and values to change. Undefined fields will not be changed.
     */
    updateTeam(params: {
        teamId: string
        properties: {
            name?: string
            description?: string
        }
    }): Promise<{
        error?: { code: 'team_not_found' | 'access_denied' } | GenericError
        result?: {}
    }>

    /**
     * Retrieve information about teams on the account.
     * If the requested team wasn't returned, it means that the team doesn't exist (or you don't have access to it).
     * @param teamIds Which teams to fetch. If unspecified, all teams will be fetched.
     */
    getTeams(params: { teamIds?: string[] }): Promise<{
        error?: GenericError
        result?: {
            teams: Team[]
        }
    }>

    /**
     * Invite users to a team.
     * @param teamId The team's id.
     * @param users Users to invite. If "role" is unspecified, the user will be assigned the role "Member".
     */
    inviteUsersToTeam(params: { teamId: string; users: { userId: string; role?: string }[] }): Promise<{
        error?: { code: 'team_not_found' | 'user_not_found' | 'role_not_found' | 'access_denied' } | GenericError
        result?: {}
    }>

    /**
     * Remove users from a team.
     * @param teamId The team's id.
     * @param userIds userId of each user to remove.
     */
    removeUsersFromTeam(params: { teamId: string; userIds: string[] }): Promise<{
        error?: { code: 'team_not_found' | 'member_not_found' | 'access_denied' } | GenericError
        result?: {}
    }>

    /**
     * Join a team that you have been invited to.
     * @param teamId The team's id.
     */
    acceptTeamInvitation(params: { teamId: string }): Promise<{
        error?: { code: 'team_not_found' | 'invite_already_accepted' } | GenericError
        result?: {}
    }>

    /**
     * Reject a team invitation.
     * @param teamId The team's id.
     */
    denyTeamInvitation(params: { teamId: string }): Promise<{
        error?: { code: 'team_not_found' | 'invite_already_accepted' } | GenericError
        result?: {}
    }>

    /**
     * Set whether a model should be shared within a team.
     * @param modelId The model's id.
     * @param teamId The team's id.
     * @param share Whether to share the model or not.
     */
    setShareModelWithTeam(params: { modelId: string; teamId: string; share: boolean }): Promise<{
        error?: { code: 'team_not_found' | 'model_not_found' | 'model_not_owned' | 'access_denied' } | GenericError
        result?: {}
    }>

    /**
     * Set whether a dataset should be shared within a team.
     * @param datasetId The dataset's id.
     * @param teamId The team's id.
     * @param share Whether to share the dataset or not.
     */
    setShareDatasetWithTeam(params: { datasetId: string; teamId: string; share: boolean }): Promise<{
        error?: { code: 'team_not_found' | 'dataset_not_found' | 'dataset_not_owned' | 'access_denied' } | GenericError
        result?: {}
    }>

    /**
     * Define a new role within a team.
     */
    createRole(params: { teamId: string; roleName: string; role: Role }): Promise<{
        error?: { code: 'team_not_found' | 'role_name_already_used' | 'access_denied' } | GenericError
        result?: {}
    }>

    /**
     * Edit an existing role.
     */
    editRole(params: { teamId: string; roleName: string; newRole: { name: string; role: Role } }): Promise<{
        error?: { code: 'team_not_found' | 'role_not_found' | 'role_name_already_used' | 'access_denied' } | GenericError
        result?: {}
    }>

    /**
     * Remove a role within a team.
     * @param teamId The team's id.
     * @param roleName Name of the role to remove.
     * @param changeUsersTo If specified, all users with the removed role will be assigned this role. If unspecified and there are users assigned the removed role, the role will not be removed and an error will be returned.
     */
    removeRole(params: { teamId: string; roleName: string; changeUsersTo?: string }): Promise<{
        error?: { code: 'team_not_found' | 'role_not_found' | 'role_used' | 'access_denied' } | GenericError
        result?: {}
    }>

    /**
     * Assign a role to a user.
     * @param teamId The team's id.
     * @param userId id of the user to assign.
     * @param roleName Role to assign.
     */
    assignRole(params: { teamId: string; userId: string; roleName: string }): Promise<{
        error?: { code: 'team_not_found' | 'role_not_found' | 'access_denied' | 'member_not_found' | 'cannot_be_owner' | 'user_is_owner' } | GenericError
        result?: {}
    }>
}
