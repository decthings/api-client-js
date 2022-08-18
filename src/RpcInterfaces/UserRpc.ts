import { FilesystemSize, LauncherSpec } from '../types'
import { GenericError } from './Error'

export interface IUserRpc {
    /**
     * Retrieves a list of matching users from a given search string. Will compare the searchTerm to the user's username.
     * @param searchTerm The term to compare to each username.
     */
    findMatchingUsers(searchTerm: string): Promise<{
        error?: GenericError
        result?: {
            users: {
                userId: string
                username: string
            }[]
        }
    }>

    /**
     * Retrieve information about users. If the requested user wasn't returned, it means that the user doesn't exist.
     * @param userIds Which users to fetch.
     */
    getUsers(userIds: string[]): Promise<{
        error?: GenericError
        result?: {
            users: {
                userId: string
                username: string
            }[]
        }
    }>

    /**
     * Retrieve information about notifications on the account.
     *
     * If the requested notification wasn't returned, it means that the notification doesn't exist.
     * @param notificationIds Which notifications to fetch. If unspecified, all notifications will be fetched.
     */
    getNotifications(notificationIds?: string[]): Promise<{
        error?: GenericError
        result?: {
            notifications: {
                id: string
                timestamp: number
                data:
                    | {
                          type: 'accountRegistered'
                      }
                    | {
                          type: 'teamInvite'
                          teamId: string
                          teamName: string
                          invitedBy: {
                              userId: string
                              username: string
                          }
                      }
                    | {
                          type: 'trainingFinished'
                          modelId: string
                          trainingSessionId: string
                          state: 'max_duration_exceeded' | 'failed' | 'completed'
                      }
                    | {
                          type: 'alert'
                          subject: string
                          message: string
                          fix?: {
                              name: string
                              url: string
                          }
                      }
                viewed: boolean
            }[]
        }
    }>

    /**
     * Delete or set status to viewed for a given notification.
     * @param notificationid The notification's id.
     * @param action Whether to delete or set the notification as viewed.
     */
    setNotification(
        notificationid: string,
        action: 'delete' | 'viewed'
    ): Promise<{
        error?: { code: 'notification_not_found' } | GenericError
        result?: {}
    }>

    /**
     * Retrieve stats for used resources in the specified billing cycle. All costs are specified in USD.
     * @param billingCycle Which billing cycle to fetch for. Defaults to the current billing cycle.
     * @param resources IDs of models, datasets or persistent launchers. Will only include data from these
     * resources. If unspecified, all data will be included.
     */
    getBillingStats(
        billingCycle?: {
            year: number
            month: 'JAN' | 'FEB' | 'MAR' | 'APR' | 'MAY' | 'JUN' | 'JUL' | 'AUG' | 'SEP' | 'OCT' | 'NOV' | 'DEC'
        },
        resources?: string[]
    ): Promise<{
        error?: GenericError
        result?: {
            year: number
            month: 'JAN' | 'FEB' | 'MAR' | 'APR' | 'MAY' | 'JUN' | 'JUL' | 'AUG' | 'SEP' | 'OCT' | 'NOV' | 'DEC'
            totalCost: number
            perDay: {
                day: number
                models: {
                    filesystems: {
                        [size in FilesystemSize]?: {
                            durationSeconds: number
                            cost: number
                        }
                    }
                    statesMebibyteMinutes: number
                    statesCost: number
                    evaluations: {
                        amount: number
                        baseCost: number
                        outputData: {
                            bytes: number
                            cost: number
                        }
                        dataReads: {
                            amount: number
                            cost: number
                        }
                        launchers: {
                            [spec in LauncherSpec]?: {
                                warmupDurationSeconds: number
                                afterWarmupDurationSeconds: number
                                warmupCost: number
                                afterWarmupCost: number
                            }
                        }
                    }
                    createStates: {
                        amount: number
                        baseCost: number
                        dataReads: {
                            amount: number
                            cost: number
                        }
                        launchers: {
                            [spec in LauncherSpec]?: {
                                warmupDurationSeconds: number
                                afterWarmupDurationSeconds: number
                                warmupCost: number
                                afterWarmupCost: number
                            }
                        }
                    }
                    trainingSessions: {
                        amount: number
                        baseCost: number
                        dataReads: {
                            amount: number
                            cost: number
                        }
                        launchers: {
                            [spec in LauncherSpec]?: {
                                warmupDurationSeconds: number
                                afterWarmupDurationSeconds: number
                                warmupCost: number
                                afterWarmupCost: number
                            }
                        }
                    }
                    terminals: {
                        amount: number
                        baseCost: number
                        launchers: {
                            [spec in LauncherSpec]?: {
                                warmupDurationSeconds: number
                                afterWarmupDurationSeconds: number
                                warmupCost: number
                                afterWarmupCost: number
                            }
                        }
                    }
                    spawnedCommands: {
                        amount: number
                        baseCost: number
                        launchers: {
                            [spec in LauncherSpec]?: {
                                warmupDurationSeconds: number
                                afterWarmupDurationSeconds: number
                                warmupCost: number
                                afterWarmupCost: number
                            }
                        }
                    }
                    debugSessions: {
                        amount: number
                        baseCost: number
                        dataReads: {
                            amount: number
                            cost: number
                        }
                        launchers: {
                            [spec in LauncherSpec]?: {
                                warmupDurationSeconds: number
                                afterWarmupDurationSeconds: number
                                warmupCost: number
                                afterWarmupCost: number
                            }
                        }
                    }
                }
                datasets: {
                    dataMebibyteMinutes: number
                    dataCost: number
                    addedEntries: number
                    addedEntriesCost: number
                }
                persistentLaunchers: {
                    [spec in LauncherSpec]?: {
                        warmupDurationSeconds: number
                        afterWarmupDurationSeconds: number
                        warmupCost: number
                        afterWarmupCost: number
                    }
                }
            }[]
        }
    }>

    /**
     * Estimates the amount that has not been paid, in USD.
     */
    estimateAmountDue(): Promise<{
        error?: GenericError
        result?: {
            amount: number
        }
    }>

    /**
     * Retrieve quotas and quota usage history.
     */
    getQuotas(): Promise<{
        error?: GenericError
        result?: {
            quotas: {
                name: string
                unit: string
                limit: number
                history: {
                    hourTimestamp: number
                    maxUsed: number
                }[]
            }[]
        }
    }>
}
