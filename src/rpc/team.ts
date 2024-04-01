export type Role = {
    canInvitePeople: boolean
    canKickPeople: boolean
    hasAccessToResources: {
        models: {
            type: 'include' | 'exclude'
            elements: string[]
        }
        datasets: {
            type: 'include' | 'exclude'
            elements: string[]
        }
    }
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
        models: string[]
        datasets: string[]
    }
}

export interface TeamRpc {
    /**
     * Create a new team.
     */
    createTeam(params: {
        /** The team's name. */
        name: string
        /** A description of the team */
        description: string
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
            teamId: string
        }
    }>

    /**
     * Change information about a team.
     */
    updateTeam(params: {
        /** The team's id. */
        teamId: string
        /** Properties and values to change. Undefined fields will not be changed. */
        properties: {
            name?: string
            description?: string
        }
    }): Promise<{
        error?:
            | {
                  code: 'team_not_found' | 'access_denied' | 'bad_credentials' | 'too_many_requests' | 'payment_required' | 'unknown'
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {}
    }>

    /**
     * Retrieve information about teams on the account. If the requested team wasn't returned, it means that the team
     * doesn't exist (or you don't have access to it).
     */
    getTeams(params: {
        /** Which teams to fetch. If unspecified, all teams will be fetched. */
        teamIds?: string[]
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
            teams: Team[]
        }
    }>

    /**
     * Invite users to a team.
     */
    inviteUsersToTeam(params: {
        /** The team's id. */
        teamId: string
        /** Users to invite. */
        users: {
            userId: string
            /** Role to assign. Defaults to "member". */
            role?: string
        }[]
    }): Promise<{
        error?:
            | {
                  code:
                      | 'team_not_found'
                      | 'user_not_found'
                      | 'role_not_found'
                      | 'access_denied'
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

    /**
     * Remove users from a team.
     */
    removeUsersFromTeam(params: {
        /** The team's id. */
        teamId: string
        /** User identifier for each user to remove. */
        userIds: string[]
    }): Promise<{
        error?:
            | {
                  code: 'team_not_found' | 'member_not_found' | 'access_denied' | 'bad_credentials' | 'too_many_requests' | 'payment_required' | 'unknown'
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {}
    }>

    /**
     * Join a team that you have been invited to.
     */
    acceptTeamInvitation(params: {
        /** The team's id. */
        teamId: string
    }): Promise<{
        error?:
            | {
                  code: 'team_not_found' | 'invite_already_accepted' | 'bad_credentials' | 'too_many_requests' | 'payment_required' | 'unknown'
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {}
    }>

    /**
     * Reject a team invitation.
     */
    denyTeamInvitation(params: {
        /** The team's id. */
        teamId: string
    }): Promise<{
        error?:
            | {
                  code: 'team_not_found' | 'invite_already_accepted' | 'bad_credentials' | 'too_many_requests' | 'payment_required' | 'unknown'
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {}
    }>

    /**
     * Set whether a model should be shared within a team.
     */
    setShareModelWithTeam(params: {
        /** The team's id. */
        teamId: string
        /** The model's id. */
        modelId: string
        /** Whether to share the model or not. */
        share: boolean
    }): Promise<{
        error?:
            | {
                  code:
                      | 'team_not_found'
                      | 'model_not_found'
                      | 'model_not_owned'
                      | 'access_denied'
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

    /**
     * Set whether a dataset should be shared within a team.
     */
    setShareDatasetWithTeam(params: {
        /** The team's id. */
        teamId: string
        /** The dataset's id. */
        datasetId: string
        /** Whether to share the model or not. */
        share: boolean
    }): Promise<{
        error?:
            | {
                  code:
                      | 'team_not_found'
                      | 'dataset_not_found'
                      | 'dataset_not_owned'
                      | 'access_denied'
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

    /**
     * Define a new role within a team.
     */
    createRole(params: {
        /** The team's id. */
        teamId: string
        /** A name for the role. */
        roleName: string
        /** Role definition */
        role: Role
    }): Promise<{
        error?:
            | {
                  code: 'team_not_found' | 'role_name_already_used' | 'access_denied' | 'bad_credentials' | 'too_many_requests' | 'payment_required' | 'unknown'
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {}
    }>

    /**
     * Edit an existing role.
     */
    editRole(params: {
        /** The team's id. */
        teamId: string
        /** Name of the role to edit. */
        roleName: string
        /** Role definition. */
        newRole: {
            name: string
            role: Role
        }
    }): Promise<{
        error?:
            | {
                  code:
                      | 'team_not_found'
                      | 'role_not_found'
                      | 'role_name_already_used'
                      | 'access_denied'
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

    /**
     * Remove a role within a team.
     */
    removeRole(params: {
        /** The team's id. */
        teamId: string
        /** Name of the role to remove */
        roleName: string
        /**
         * If specified, all users with the removed role will be assigned this role. Otherwise, if there are users
         * assigned the removed role, the role will not be removed and an error will be returned.
         */
        changeUsersTo?: string
    }): Promise<{
        error?:
            | {
                  code:
                      | 'team_not_found'
                      | 'role_not_found'
                      | 'role_used'
                      | 'access_denied'
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

    /**
     * Assign a role to a user.
     */
    assignRole(params: {
        /** The team's id. */
        teamId: string
        /** Identifier of the user to assign to. */
        userId: string
        /** Role to assign. */
        roleName: string
    }): Promise<{
        error?:
            | {
                  code:
                      | 'team_not_found'
                      | 'role_not_found'
                      | 'access_denied'
                      | 'member_not_found'
                      | 'cannot_be_owner'
                      | 'user_is_owned'
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
