export type Organization = {
    id: string
    name: string
    createdAt: number
    members: {
        userId: string
        username: string
        role: 'admin' | 'editor' | 'viewer'
    }
    pendingInvites: {
        email: string
    }
}

export interface OrganizationRpc {
    /**
     * Create a new organization.
     */
    createOrganization(params: {
        /** The organization's name. */
        name: string
    }): Promise<{
        error?:
            | {
                  code: 'name_in_use' | 'quota_exceeded' | 'bad_credentials' | 'too_many_requests' | 'payment_required' | 'unknown'
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {
            /** A unique identifier which you should use in subsequent API calls. */
            organizationId: string
        }
    }>

    /**
     * Retrieve information about organizations.
     */
    getOrganizations(params: {
        /** Number of items from the results to skip. Defaults to 0. */
        offset?: number
        /** Max number of items to return. Defaults to 20. */
        limit?: number
        /** If specified, determines which items to retrieve. */
        filter?: {
            ids?: string[]
            members?: string[]
            names?: string[]
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
            organizations: Organization[]
            /** The total number of organizations that matched the filter. */
            total: number
            offset: number
            limit: number
        }
    }>

    /**
     * Invite users to an organization.
     */
    inviteUsersToOrganization(params: {
        /** The organization's id. */
        organizationId: string
        /** Users to invite. */
        users: {
            email: string
        }[]
    }): Promise<{
        error?:
            | {
                  code: 'organization_not_found' | 'access_denied' | 'bad_credentials' | 'too_many_requests' | 'payment_required' | 'unknown'
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {}
    }>

    /**
     * Remove users from an organization.
     */
    removeUsersFromOrganization(params: {
        /** The organization's id. */
        organizationId: string
        /** Users to remove. */
        userIds: string[]
    }): Promise<{
        error?:
            | {
                  code:
                      | 'organization_not_found'
                      | 'member_not_found'
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
     * Accept or deny an invitation to an organization.
     */
    respondToOrganizationInvitation(params: {
        /** The organization's id. */
        organizationId: string
        accept: boolean
    }): Promise<{
        error?:
            | {
                  code: 'organization_not_found' | 'invite_not_found' | 'bad_credentials' | 'too_many_requests' | 'payment_required' | 'unknown'
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {}
    }>

    /**
     * Assign roles to users.
     */
    assignRoles(params: {
        /** The organization's id. */
        organizationId: string
        members: {
            userId: string
            role: 'admin' | 'editor' | 'viewer'
        }
    }): Promise<{
        error?:
            | {
                  code:
                      | 'organization_not_found'
                      | 'member_not_found'
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
     * Delete an organization.
     */
    deleteOrganization(params: {
        /** The organization's id. */
        organizationId: string
    }): Promise<{
        error?:
            | {
                  code: 'organization_not_found' | 'access_denied' | 'bad_credentials' | 'too_many_requests' | 'payment_required' | 'unknown'
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {}
    }>
}
