export interface UserRpc {
    /**
     * Retrieves a list of matching users from a given search string. Will compare the searchTerm to the user's
     * username.
     */
    findMatchingUsers(params: {
        /** The term to search for. */
        searchTerm: string
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
            users: {
                userId: string
                username: string
            }[]
        }
    }>

    /**
     * Retrieve information about users. If the requested user wasn't returned, it means that the user doesn't exist.
     */
    getUsers(params: {
        /** Which users to fetch */
        userIds: string[]
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
            users: {
                userId: string
                username: string
            }[]
        }
    }>

    /**
     * Get notifications for the logged in user. If the requested notification wasn't returned, it means that the
     * notification doesn't exist.
     */
    getNotifications(params: {
        /** Which notifications to fetch. If unspecified, all notifications will be fetched. */
        notificationIds?: string[]
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
            notifications: {
                id: string
                timestamp: number
                viewed: boolean
                data:
                    | {
                          type: 'accountRegistered'
                      }
                    | {
                          type: 'trainingFinished'
                          modelId: string
                          trainingSessionId: string
                          newStateName: string
                          state: 'failed' | 'completed'
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
            }[]
        }
    }>

    /**
     * Delete or set status to viewed for a notification.
     */
    setNotification(params: {
        /** The notification's id. */
        notificationId: string
        /** Whether to delete or set the notification as viewed. */
        action: 'delete' | 'viewed'
    }): Promise<{
        error?:
            | {
                  code: 'notification_not_found' | 'bad_credentials' | 'too_many_requests' | 'payment_required' | 'unknown'
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {}
    }>

    /**
     * Retrieve stats for used resources in the specified billing cycle. All costs are specified in USD.
     */
    getBillingStats(params: {
        /** Month to fetch. Defaults to the current billing cycle. */
        billingCycle?: {
            year: number
            month: 'JAN' | 'FEB' | 'MAR' | 'APR' | 'MAY' | 'JUN' | 'JUL' | 'AUG' | 'SEP' | 'OCT' | 'NOV' | 'DEC'
        }
        /**
         * Identifiers of models, datasets or persistent launchers. Will only include data from these resources. If
         * unspecified, all data will be included.
         */
        resources?: string[]
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
            year: number
            month: 'JAN' | 'FEB' | 'MAR' | 'APR' | 'MAY' | 'JUN' | 'JUL' | 'AUG' | 'SEP' | 'OCT' | 'NOV' | 'DEC'
            totalCost: number
            perDay: {
                day: number
                models: {
                    statesMebibyteMinutes: number
                    statesCost: number
                    filesystemsMebibyteMinutes: number
                    filesystemsCost: number
                    evaluations: {
                        amount: number
                        baseCost: number
                        inputData: {
                            bytes: number
                            cost: number
                        }
                        outputData: {
                            bytes: number
                            cost: number
                        }
                        launchers: {
                            duringWarmup: {
                                cpuCoreMinutes: number
                                cpuCost: number
                                memoryMebibyteMinutes: number
                                memoryCost: number
                                diskMebibyteMinutes: number
                                diskCost: number
                            }
                            afterWarmup: {
                                cpuCoreMinutes: number
                                cpuCost: number
                                memoryMebibyteMinutes: number
                                memoryCost: number
                                diskMebibyteMinutes: number
                                diskCost: number
                            }
                        }
                    }
                    createStates: {
                        amount: number
                        baseCost: number
                        launchers: {
                            duringWarmup: {
                                cpuCoreMinutes: number
                                cpuCost: number
                                memoryMebibyteMinutes: number
                                memoryCost: number
                                diskMebibyteMinutes: number
                                diskCost: number
                            }
                            afterWarmup: {
                                cpuCoreMinutes: number
                                cpuCost: number
                                memoryMebibyteMinutes: number
                                memoryCost: number
                                diskMebibyteMinutes: number
                                diskCost: number
                            }
                        }
                    }
                    trainingSessions: {
                        amount: number
                        baseCost: number
                        launchers: {
                            duringWarmup: {
                                cpuCoreMinutes: number
                                cpuCost: number
                                memoryMebibyteMinutes: number
                                memoryCost: number
                                diskMebibyteMinutes: number
                                diskCost: number
                            }
                            afterWarmup: {
                                cpuCoreMinutes: number
                                cpuCost: number
                                memoryMebibyteMinutes: number
                                memoryCost: number
                                diskMebibyteMinutes: number
                                diskCost: number
                            }
                        }
                    }
                    terminals: {
                        amount: number
                        baseCost: number
                        launchers: {
                            duringWarmup: {
                                cpuCoreMinutes: number
                                cpuCost: number
                                memoryMebibyteMinutes: number
                                memoryCost: number
                                diskMebibyteMinutes: number
                                diskCost: number
                            }
                            afterWarmup: {
                                cpuCoreMinutes: number
                                cpuCost: number
                                memoryMebibyteMinutes: number
                                memoryCost: number
                                diskMebibyteMinutes: number
                                diskCost: number
                            }
                        }
                    }
                    spawnedCommands: {
                        amount: number
                        baseCost: number
                        launchers: {
                            duringWarmup: {
                                cpuCoreMinutes: number
                                cpuCost: number
                                memoryMebibyteMinutes: number
                                memoryCost: number
                                diskMebibyteMinutes: number
                                diskCost: number
                            }
                            afterWarmup: {
                                cpuCoreMinutes: number
                                cpuCost: number
                                memoryMebibyteMinutes: number
                                memoryCost: number
                                diskMebibyteMinutes: number
                                diskCost: number
                            }
                        }
                    }
                    debugSessions: {
                        amount: number
                        baseCost: number
                        launchers: {
                            duringWarmup: {
                                cpuCoreMinutes: number
                                cpuCost: number
                                memoryMebibyteMinutes: number
                                memoryCost: number
                                diskMebibyteMinutes: number
                                diskCost: number
                            }
                            afterWarmup: {
                                cpuCoreMinutes: number
                                cpuCost: number
                                memoryMebibyteMinutes: number
                                memoryCost: number
                                diskMebibyteMinutes: number
                                diskCost: number
                            }
                        }
                        operations: {
                            amount: number
                            baseCost: number
                            evaluateInputData: {
                                bytes: number
                                cost: number
                            }
                            evaluateOutputData: {
                                bytes: number
                                cost: number
                            }
                        }
                    }
                }
                datasets: {
                    dataMebibyteMinutes: number
                    dataCost: number
                }
                persistentLaunchers: {
                    duringWarmup: {
                        cpuCoreMinutes: number
                        cpuCost: number
                        memoryMebibyteMinutes: number
                        memoryCost: number
                        diskMebibyteMinutes: number
                        diskCost: number
                    }
                    afterWarmup: {
                        cpuCoreMinutes: number
                        cpuCost: number
                        memoryMebibyteMinutes: number
                        memoryCost: number
                        diskMebibyteMinutes: number
                        diskCost: number
                    }
                }
            }[]
        }
    }>

    /**
     * Estimates the amount that has not been paid, in USD.
     */
    estimateAmountDue(): Promise<{
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
            amount: number
        }
    }>

    /**
     * Retrieve quotas and quota usage history.
     */
    getQuotas(): Promise<{
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
            quotas: {
                name: string
                unit: string
                limit: number
                used: number
                history: {
                    hourTimestamp: number
                    maxUsed: number
                }[]
            }[]
        }
    }>
}
