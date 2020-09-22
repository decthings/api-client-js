import { CurrentUser, User_Public, LauncherSpec, Notification } from '../../types'

export interface IUserRpc {
    /**
     * Retrieves a list of matching users from a given search string. Will compare the searchTerm to the user's username.
     * @param searchTerm The term to compare to each username.
     */
    findMatchingUsers(
        searchTerm: string
    ): Promise<{
        error?: { code: 'bad_credentials' } | { code: 'invalid_parameter'; parameterName: string; reason: string }
        users?: User_Public[]
    }>

    /**
     * Retrieve information about users. If the requested user wasn't returned, it means that the user doesn't exist.
     * @param userIds Which users to fetch.
     */
    getUsers(
        userIds: string[]
    ): Promise<{
        error?: { code: 'bad_credentials' } | { code: 'invalid_parameter'; parameterName: string; reason: string }
        users?: User_Public[]
    }>

    /**
     * Retrieves information about the user you're currently logged in as.
     */
    getCurrentUser(): Promise<{
        error?: { code: 'bad_credentials' } | { code: 'invalid_parameter'; parameterName: string; reason: string }
        user?: CurrentUser
    }>

    /**
     * Retrieve information about notifications on the account.
     * If the requested notification wasn't returned, it means that the notification doesn't exist (or you don't have access to it).
     * @param notificationIds Which notifications to fetch. If unspecified, all notifications will be fetched.
     */
    getNotifications(
        notificationIds?: string[]
    ): Promise<{
        error?: { code: 'bad_credentials' } | { code: 'invalid_parameter'; parameterName: string; reason: string }
        notifications?: Notification[]
    }>

    /**
     * Delete or set status to viewed for a given notification.
     * @param notificationid The notification's id.
     * @param set Delete or set to viewed?
     */
    setNotification(
        notificationid: string,
        action: 'delete' | 'viewed'
    ): Promise<{
        error?:
            | { code: 'bad_credentials' | 'notification_not_found' }
            | { code: 'invalid_parameter'; parameterName: string; reason: string }
    }>

    /**
     * Retrieve stats for used resources in the specified billing cycle.
     * All returned durations are in seconds, and all returned timestamp are in seconds since Jan 01, 1970.
     * @param stats The product to fetch stats for.
     * @param billingCycle Which billing cycle to fetch for. Defaults to the current billing cycle.
     */
    getBillingStats(
        stats: 'eval' | 'createState' | 'training' | 'terminal' | 'debug' | 'persistentLaunchers',
        billingCycle?: {
            year: number
            month: 'JAN' | 'FEB' | 'MAR' | 'APR' | 'MAY' | 'JUN' | 'JUL' | 'AUG' | 'SEP' | 'OCT' | 'NOV' | 'DEC'
        }
    ): Promise<{
        error?: { code: 'bad_credentials' } | { code: 'invalid_parameter'; parameterName: string; reason: string }
        stats?: {
            year: number
            month: 'JAN' | 'FEB' | 'MAR' | 'APR' | 'MAY' | 'JUN' | 'JUL' | 'AUG' | 'SEP' | 'OCT' | 'NOV' | 'DEC'
            evaluations?: { timestamp: number; modelId: string; launcher?: { spec: LauncherSpec; duration: number } }[]
            createStates?: { timestamp: number; modelId: string; launcher?: { spec: LauncherSpec; duration: number } }[]
            trainingSessions?: { timestamp: number; modelId: string; launcher?: { spec: LauncherSpec; duration: number } }[]
            terminalSessions?: { timestamp: number; launcher?: { spec: LauncherSpec; duration: number } }[]
            debugSessions?: { timestamp: number; launcher?: { spec: LauncherSpec; duration: number } }[]
            persistentLaunchers?: { startedAt?: number; launcherSpec: LauncherSpec; finishedAt?: number }[]
        }
    }>
}
