import { EventEmitter } from 'events'
import * as JsonBuffer from 'json-buffer'

import { RpcClient, Converter, RpcError } from '@decthings/ds-nodes'

import {
    IDebugRpc,
    IBlueprintRpc,
    ITerminalRpc,
    IDatasetRpc,
    IModelRpc,
    IAuthRpc,
    ITeamRpc,
    IUserRpc,
    ILanguageRpc,
    IPersistentLauncherRpc
} from '../types/RpcInterfaces/RpcInterfaces'

import { FileSystem, configureFileSystem } from './fs/Fs'
import { IDecthingsFs } from '../types/DecthingsFs'

export const config: {
    transport: typeof import('@decthings/ds-nodes').BrowserWebSocketTransport | typeof import('@decthings/ds-nodes').WebSocketTransport
    defaultWsAddress: string
} = {
    transport: null,
    defaultWsAddress: 'wss://app.decthings.com/api'
}

export declare interface DecthingsClient {
    on(event: 'close', listener: () => void): this
    emit(event: 'close'): boolean
    removeListener(event: 'close', listener: () => void): this

    on(event: 'login', listener: (userid: string) => void): this
    emit(event: 'login', userid: string): boolean
    removeListener(event: 'login', listener: (userid: string) => void): this
}

type DecthingsClientOptions = { silent?: boolean; serverAddress?: string }

export class DecthingsClient extends EventEmitter {
    private options: DecthingsClientOptions
    private transport: import('@decthings/ds-nodes').BrowserWebSocketTransport | import('@decthings/ds-nodes').WebSocketTransport
    private rpcClient: RpcClient

    private didLogin = false

    public token: string
    public currentUserid?: string

    constructor(options: DecthingsClientOptions = {}) {
        super()

        this.options = {
            silent: options.silent || false,
            serverAddress: options.serverAddress || config.defaultWsAddress
        }

        this.rpcClient = new RpcClient([])
        let stringifier = new Converter([this.rpcClient], (message) => {
            return JsonBuffer.stringify(message)
        })
        this.transport = new config.transport([stringifier], { address: this.options.serverAddress })
        let parser = new Converter([this.transport], (message: any) => {
            return JsonBuffer.parse(message.toString())
        })
        parser.pipe(this.rpcClient)

        this.authRpc = this.rpcClient.api('AuthRpc')
        this.freeModelRpc = this.rpcClient.api('ModelRpc')
    }

    private promiseLoginToServer(): Promise<void> {
        return new Promise((resolve) => {
            if (this.didLogin) {
                resolve()
                return
            }
            let handler = () => {
                this.removeListener('login', handler)
                resolve()
            }
            this.on('login', handler)
        })
    }

    public authRpc: IAuthRpc

    private _decthingsFs: IDecthingsFs
    public decthingsFs = new Proxy(
        {},
        {
            get: (target, p) => {
                return async (...args: any) => {
                    await this.promiseLoginToServer()
                    return this._decthingsFs[p](...args)
                }
            }
        }
    ) as IDecthingsFs

    private _fs: FileSystem
    public fs = new Proxy(
        {},
        {
            get: (target, p) => {
                return new Proxy(
                    {},
                    {
                        get: (target, p2) => {
                            return async (...args: any) => {
                                await this.promiseLoginToServer()
                                return this._fs[p][p2](...args)
                            }
                        }
                    }
                )
            }
        }
    ) as FileSystem

    private _debugRpc: IDebugRpc
    public debugRpc = new Proxy(
        {},
        {
            get: (target, p) => {
                return async (...args: any) => {
                    await this.promiseLoginToServer()
                    return this._debugRpc[p](...args)
                }
            }
        }
    ) as IDebugRpc

    private _blueprintRpc: IBlueprintRpc
    public blueprintRpc = new Proxy(
        {},
        {
            get: (target, p) => {
                return async (...args: any) => {
                    await this.promiseLoginToServer()
                    return this._blueprintRpc[p](...args)
                }
            }
        }
    ) as IBlueprintRpc

    private _terminalRpc: ITerminalRpc
    public terminalRpc = new Proxy(
        {},
        {
            get: (target, p) => {
                return async (...args: any) => {
                    await this.promiseLoginToServer()
                    return this._terminalRpc[p](...args)
                }
            }
        }
    ) as ITerminalRpc

    private _datasetRpc: IDatasetRpc
    public datasetRpc = new Proxy(
        {},
        {
            get: (target, p) => {
                return async (...args: any) => {
                    await this.promiseLoginToServer()
                    return this._datasetRpc[p](...args)
                }
            }
        }
    ) as IDatasetRpc

    private _modelRpc: IModelRpc
    public modelRpc = new Proxy(
        {},
        {
            get: (target, p) => {
                return async (...args: any) => {
                    await this.promiseLoginToServer()
                    return this._modelRpc[p](...args)
                }
            }
        }
    ) as IModelRpc

    public freeModelRpc: IModelRpc

    private _teamRpc: ITeamRpc
    public teamRpc = new Proxy(
        {},
        {
            get: (target, p) => {
                return async (...args: any) => {
                    await this.promiseLoginToServer()
                    return this._teamRpc[p](...args)
                }
            }
        }
    ) as ITeamRpc

    private _userRpc: IUserRpc
    public userRpc = new Proxy(
        {},
        {
            get: (target, p) => {
                return async (...args: any) => {
                    await this.promiseLoginToServer()
                    return this._userRpc[p](...args)
                }
            }
        }
    ) as IUserRpc

    private _persistentLauncherRpc: IPersistentLauncherRpc
    public persistentLauncherRpc = new Proxy(
        {},
        {
            get: (target, p) => {
                return async (...args: any) => {
                    await this.promiseLoginToServer()
                    return this._persistentLauncherRpc[p](...args)
                }
            }
        }
    ) as IPersistentLauncherRpc

    private _languageRpc: ILanguageRpc
    public languageRpc = new Proxy(
        {},
        {
            get: (target, p) => {
                return async (...args: any) => {
                    await this.promiseLoginToServer()
                    return this._languageRpc[p](...args)
                }
            }
        }
    ) as ILanguageRpc

    public async loginWithToken(
        token: string
    ): Promise<{
        error?:
            | {
                  code: 'bad_credentials'
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        userId?: string
    }> {
        let tokenVerification = await this.authRpc.verifyToken(token)
        if (tokenVerification.error) {
            return { error: tokenVerification.error }
        }
        let userId = tokenVerification.userId

        this.token = token

        this._decthingsFs = this.rpcClient.api('Fs', this.token)
        this._debugRpc = this.rpcClient.api('DebugRpc', this.token)
        this._blueprintRpc = this.rpcClient.api('BlueprintRpc', this.token)
        this._terminalRpc = this.rpcClient.api('TerminalRpc', this.token)
        this._datasetRpc = this.rpcClient.api('DatasetRpc', this.token)
        this._modelRpc = this.rpcClient.api('ModelRpc', this.token)
        this._teamRpc = this.rpcClient.api('TeamRpc', this.token)
        this._userRpc = this.rpcClient.api('UserRpc', this.token)
        this._persistentLauncherRpc = this.rpcClient.api('PersistentLauncherRpc', this.token)
        this._languageRpc = this.rpcClient.api('LanguageRpc', this.token)

        let proxifiedDecthingsFs = new Proxy(
            {},
            {
                get: (_, prop) => {
                    return async (...args: any[]) => {
                        try {
                            return await this._decthingsFs[prop](...args)
                        } catch (e) {
                            if (e instanceof RpcError) {
                                throw e.errorDetails
                            } else {
                                throw e
                            }
                        }
                    }
                }
            }
        )

        this._fs = await configureFileSystem({
            fs: 'DecthingsFs',
            options: {
                backend: () => proxifiedDecthingsFs
            }
        })

        this.options.silent || console.log('Logged in to Decthings.')

        this.currentUserid = userId
        this.didLogin = true
        this.emit('login', userId)
        return { userId }
    }

    public async login(
        username: string,
        password: string
    ): Promise<{
        error?:
            | {
                  code: 'bad_credentials' | 'user_not_activated'
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        userid?: string
    }> {
        var data = await this.authRpc.getToken(username, password)
        if (data.error) {
            return { error: data.error }
        }
        return this.loginWithToken(data.token)
    }

    private isClosed = false
    public disconnect() {
        if (this.isClosed) {
            return
        }
        this.isClosed = true
        delete this.currentUserid
        this.transport.close()
        this.emit('close')
    }
}
