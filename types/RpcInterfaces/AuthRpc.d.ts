export interface IAuthRpc {
    /**
     * Retrieve a JWT to use for further authentication.
     */
    getToken(
        username: string,
        password: string
    ): Promise<{
        error?: { code: 'bad_credentials' | 'user_not_activated' } | { code: 'invalid_parameter'; parameterName: string; reason: string }
        token?: string
    }>

    /**
     * Checks if a token is valid and if so, returns the userid.
     */
    verifyToken(
        token: string
    ): Promise<{
        error?: { code: 'bad_credentials' } | { code: 'invalid_parameter'; parameterName: string; reason: string }
        userId?: string
    }>
}
