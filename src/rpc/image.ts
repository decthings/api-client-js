export type Repository = {
    name: string
    description: string
    publicAccess: boolean
    createdAt: number
    owner:
        | {
              type: 'user'
              userId: string
              username: string
          }
        | {
              type: 'organization'
              organizationId: string
              organizationName: string
          }
    access: 'read' | 'readwrite'
}

export interface ImageRpc {
    /**
     * Create a new repository for storing Docker images.
     */
    createRepository(params: {
        /** The repository's name. */
        name: string
        /** A description of the repository. */
        description: string
        /** If true, all Decthings users can find and use this repository. Defaults to false. */
        publicAccess?: boolean
    }): Promise<{
        error?:
            | {
                  code:
                      | 'name_already_used'
                      | 'organization_not_found'
                      | 'access_denied'
                      | 'quota_exceeded'
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
     * Change repository information.
     */
    updateRepository(params: {
        /** The repository's id. */
        name: string
        /** Properties and values to change. Empty fields will not be changed. */
        properties: {
            description?: string
            publicAccess?: boolean
        }
    }): Promise<{
        error?:
            | {
                  code: 'repository_not_found' | 'access_denied' | 'bad_credentials' | 'too_many_requests' | 'payment_required' | 'unknown'
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {}
    }>

    /**
     * Delete a repository and all contents in it. This cannot be reverted.
     */
    deleteRepository(params: {
        /** The repository's name. */
        name: string
    }): Promise<{
        error?:
            | {
                  code: 'repository_not_found' | 'access_denied' | 'bad_credentials' | 'too_many_requests' | 'payment_required' | 'unknown'
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {}
    }>

    /**
     * Retrieve information about repositories. If the requested repository wasn't returned, it means it doesn't exist
     * (or you don't have access to it).
     */
    getRepositories(params: {
        /** Number of items from the results to skip. Defaults to 0. */
        offset?: number
        /** Max number of items to return. Defaults to 20. */
        limit?: number
        /** If specified, determines which items to retrieve. */
        filter?: {
            owners?: string[]
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
            repositories: Repository[]
            /** The total number of repositories that matched the filter. */
            total: number
            offset: number
            limit: number
        }
    }>
}
