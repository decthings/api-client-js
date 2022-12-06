import { EventEmitter } from 'events'
import { Buffer } from 'buffer'
import { IDatasetRpc, IDebugRpc, IFsRpc, ILanguageRpc, IModelRpc, IPersistentLauncherRpc, ISpawnedRpc, ITeamRpc, ITerminalRpc, IUserRpc } from './RpcInterfaces'
import { Data, DataElement, Parameter, ParameterProvider } from './DataTypes'
import { DecthingsClient } from './Client'

function convertParameterProviders(params: ParameterProvider[]): [ParameterProvider[], Buffer[]] {
    if (!Array.isArray(params)) {
        throw new Error('Invalid ParameterProviders: Expected an array.')
    }
    const newParams: ParameterProvider[] = []
    const data: Buffer[] = []
    params.forEach((param) => {
        if (!param) {
            throw new Error('Invalid ParameterProviders: Expected each parameter to be an object.')
        }
        if (param.data instanceof Data) {
            newParams.push({ ...param, data: undefined })
            data.push(param.data.serialize())
        } else if (Buffer.isBuffer(param.data)) {
            newParams.push({ ...param, data: undefined })
            data.push(param.data)
        } else {
            if (param.data.type !== 'dataset') {
                throw new Error(
                    'Invalid ParameterProviders: Expected the field "data" of each element to be an instance of Data, Buffer or an object like { type: "dataset", datasetId: string }.'
                )
            }
            newParams.push(param)
        }
    })
    return [newParams, data]
}

function passthroughCall(client: DecthingsClient, api: string, method: string) {
    return async (...args: any[]) => {
        const res = await client.rawMethodCall(api, method, args, [])
        if (res.error) {
            return { error: res.error }
        }
        return { result: res.result }
    }
}

export function makeDatasetRpc(client: DecthingsClient): IDatasetRpc {
    return {
        createDataset: passthroughCall(client, 'Dataset', 'createDataset'),
        updateDataset: passthroughCall(client, 'Dataset', 'updateDataset'),
        deleteDataset: passthroughCall(client, 'Dataset', 'deleteDataset'),
        getDatasets: passthroughCall(client, 'Dataset', 'getDatasets'),
        addEntries: async (...args: Parameters<IDatasetRpc['addEntries']>) => {
            if (!Array.isArray(args[1])) {
                throw new Error('Invalid entries: Expected an array.')
            }
            const newArgs = [args[0], ...args.slice(2)]
            const res = await client.rawMethodCall(
                'Dataset',
                'addEntries',
                newArgs,
                args[1].map((el: Data | DataElement) => el.serialize())
            )
            if (res.error) {
                return { error: res.error }
            }
            return { result: res.result }
        },
        addEntriesToNeedsReview: async (...args: Parameters<IDatasetRpc['addEntriesToNeedsReview']>) => {
            if (!Array.isArray(args[1])) {
                throw new Error('Invalid entries: Expected an array.')
            }
            const newArgs = [args[0], ...args.slice(2)]
            const res = await client.rawMethodCall(
                'Dataset',
                'addEntriesToNeedsReview',
                newArgs,
                args[1].map((el: Data | DataElement) => el.serialize())
            )
            if (res.error) {
                return { error: res.error }
            }
            return { result: res.result }
        },
        finalizeNeedsReviewEntries: async (...args: Parameters<IDatasetRpc['finalizeNeedsReviewEntries']>) => {
            if (!Array.isArray(args[1])) {
                throw new Error('Invalid entries: Expected an array.')
            }
            const data: Buffer[] = []
            const newEntries = args[1].map((entry) => {
                if (!entry) {
                    throw new Error('Invalid entries: Expected each element to be an object.')
                }
                if (!(entry.data instanceof Data) && !(entry.data instanceof DataElement)) {
                    throw new Error('Invalid entries: Expected the field "data" of each element to be an instance of Data or DataElement.')
                }
                data.push(entry.data.serialize())
                const newEntry = { ...entry }
                delete newEntry.data
                return newEntry
            })

            const newArgs = [...args]
            newArgs[1] = newEntries

            const res = await client.rawMethodCall('Dataset', 'finalizeNeedsReviewEntries', args, data)

            if (res.error) {
                return { error: res.error }
            }
            return { result: res.result }
        },
        getEntries: async (...args: Parameters<IDatasetRpc['getEntries']>) => {
            const res = await client.rawMethodCall('Dataset', 'getEntries', args, [])
            if (res.data.length === 0 || !res.result) {
                return res.result ? { result: res.result } : { error: res.error }
            }
            let pos = 0
            return {
                result: {
                    ...res.result,
                    entries: res.result.entries.map((entry: any) => {
                        const newEntry = {
                            ...entry,
                            data: Data.deserializeDataOrDataElement(res.data[pos])
                        }
                        pos += 1
                        return newEntry
                    })
                }
            }
        },
        getNeedsReviewEntries: async (...args: Parameters<IDatasetRpc['getNeedsReviewEntries']>) => {
            const res = await client.rawMethodCall('Dataset', 'getNeedsReviewEntries', args, [])
            if (res.data.length === 0 || !res.result) {
                return res.result ? { result: res.result } : { error: res.error }
            }
            let pos = 0
            return {
                result: {
                    ...res.result,
                    entries: res.result.entries.map((entry: any) => {
                        const newEntry = {
                            ...entry,
                            data: Data.deserializeDataOrDataElement(res.data[pos])
                        }
                        pos += 1
                        return newEntry
                    })
                }
            }
        },
        removeEntries: passthroughCall(client, 'Dataset', 'removeEntries'),
        removeNeedsReviewEntries: passthroughCall(client, 'Dataset', 'removeNeedsReviewEntries')
    }
}

class DebugRpc extends EventEmitter implements IDebugRpc {
    #internal: {
        client: DecthingsClient
        addKeepalive: (id: string) => void
        removeKeepalive: (id: string) => void
    }
    constructor(client: DecthingsClient, addKeepalive: (id: string) => void, removeKeepalive: (id: string) => void) {
        super()
        this.#internal = {
            client,
            addKeepalive,
            removeKeepalive
        }
    }
    async launchDebugSession(...args: Parameters<IDebugRpc['launchDebugSession']>) {
        const subscribed = args[3] !== false
        const res = await this.#internal.client.rawMethodCall('Debug', 'launchDebugSession', args, [], subscribed ? 'ws' : 'http')
        if (subscribed && res.result) {
            this.#internal.addKeepalive(res.result.debugSessionId)
        }
        return res.result ? { result: res.result } : { error: res.error }
    }
    async getDebugSessions(...args: Parameters<IDebugRpc['getDebugSessions']>) {
        const res = await this.#internal.client.rawMethodCall('Debug', 'getDebugSessions', args, [])
        if (res.error) {
            return { error: res.error }
        }
        return { result: res.result }
    }
    async terminateDebugSession(...args: Parameters<IDebugRpc['terminateDebugSession']>) {
        const res = await this.#internal.client.rawMethodCall('Debug', 'terminateDebugSession', args, [])
        if (res.error) {
            return { error: res.error }
        }
        return { result: res.result }
    }
    async callCreateModelState(...args: Parameters<IDebugRpc['callCreateModelState']>) {
        const [newParams, data] = convertParameterProviders(args[1])
        const newArgs = [...args]
        newArgs[1] = newParams
        const res = await this.#internal.client.rawMethodCall('Debug', 'callCreateModelState', newArgs, data)
        if (res.error) {
            return { error: res.error }
        }
        return { result: res.result }
    }
    async callInstantiateModel(...args: Parameters<IDebugRpc['callInstantiateModel']>) {
        if (!args[1]) {
            throw new Error('Expected the second argument to be an object.')
        }
        let newArgs = [...args]
        let dataToSend: Buffer[]
        if (args[1].type === 'data') {
            if (!Array.isArray(args[1].data) || args[1].data.some((el) => !Buffer.isBuffer(el))) {
                throw new Error('For type="data", expected the field "data" of the second argument to be an array of Buffers.')
            }
            dataToSend = args[1].data
            newArgs[1] = { ...args[1] }
            delete newArgs[1].data
        } else {
            dataToSend = []
        }

        const res = await this.#internal.client.rawMethodCall('Debug', 'callInstantiateModel', newArgs, dataToSend)
        if (res.error) {
            return { error: res.error }
        }
        return { result: res.result }
    }
    async callTrain(...args: Parameters<IDebugRpc['callTrain']>) {
        const [newParams, data] = convertParameterProviders(args[2])
        const newArgs = [...args]
        newArgs[2] = newParams
        const res = await this.#internal.client.rawMethodCall('Debug', 'callTrain', newArgs, data)
        if (res.error) {
            return { error: res.error }
        }
        return { result: res.result }
    }
    async getTrainingStatus(...args: Parameters<IDebugRpc['getTrainingStatus']>) {
        const res = await this.#internal.client.rawMethodCall('Debug', 'getTrainingStatus', args, [])
        if (res.error) {
            return { error: res.error }
        }
        return { result: res.result }
    }
    async getTrainingMetrics(...args: Parameters<IDebugRpc['getTrainingMetrics']>) {
        const res = await this.#internal.client.rawMethodCall('Debug', 'getTrainingMetrics', args, [])
        if (res.data.length === 0 || res.error) {
            return res.result ? { result: res.result } : { error: res.error }
        }
        let pos = 0
        return {
            result: {
                ...res.result,
                metrics: res.result.metrics.map((metric: any) => {
                    return {
                        ...metric,
                        entries: metric.entries.map((entry: any) => {
                            const newEntry = {
                                ...entry,
                                data: Data.deserializeDataOrDataElement(res.data[pos])
                            }
                            pos += 1
                            return newEntry
                        })
                    }
                })
            }
        }
    }
    async cancelTrainingSession(...args: Parameters<IDebugRpc['cancelTrainingSession']>) {
        const res = await this.#internal.client.rawMethodCall('Debug', 'cancelTrainingSession', args, [])
        if (res.error) {
            return { error: res.error }
        }
        return { result: res.result }
    }
    async callEvaluate(...args: Parameters<IDebugRpc['callEvaluate']>) {
        const [newParams, data] = convertParameterProviders(args[2])
        const newArgs = [...args]
        newArgs[2] = newParams
        const res = await this.#internal.client.rawMethodCall('Debug', 'callEvaluate', newArgs, data)
        if (res.data.length === 0 || res.error) {
            return res.result ? { result: res.result } : { error: res.error }
        }
        let pos = 0
        const newOutput: Parameter[] = res.result.output.map((el: { name: string }): Parameter => {
            const data = Data.deserialize(res.data[pos])
            pos += 1
            return {
                name: el.name,
                data
            }
        })
        return {
            result: {
                ...res.result,
                output: newOutput
            }
        }
    }
    async callGetModelState(...args: Parameters<IDebugRpc['callGetModelState']>) {
        const res = await this.#internal.client.rawMethodCall('Debug', 'callGetModelState', args, [])
        if (res.error) {
            return { error: res.error }
        }
        return { result: res.result }
    }
    async downloadStateData(...args: Parameters<IDebugRpc['downloadStateData']>) {
        const res = await this.#internal.client.rawMethodCall('Debug', 'downloadStateData', args, [])
        if (res.data.length === 0 || res.error) {
            return res.result ? { result: res.result } : { error: res.error }
        }
        return {
            result: {
                ...res.result,
                data: res.data
            }
        }
    }
    async sendToRemoteInspector(...args: Parameters<IDebugRpc['sendToRemoteInspector']>) {
        const res = await this.#internal.client.rawMethodCall('Debug', 'sendToRemoteInspector', args, [])
        if (res.error) {
            return { error: res.error }
        }
        return { result: res.result }
    }
    async subscribeToEvents(...args: Parameters<IDebugRpc['subscribeToEvents']>) {
        const res = await this.#internal.client.rawMethodCall('Debug', 'subscribeToEvents', args, [], 'ws')
        if (res.error) {
            return { error: res.error }
        }
        this.#internal.addKeepalive(args[0])
        return { result: res.result }
    }
    async unsubscribeFromEvents(...args: Parameters<IDebugRpc['unsubscribeFromEvents']>) {
        if (!this.#internal.client.hasWebSocket()) {
            return Promise.resolve({ error: { code: 'not_subscribed' as const } })
        }
        const res = await this.#internal.client.rawMethodCall('Debug', 'unsubscribeFromEvents', args, [], 'ws')
        if (res.error) {
            return { error: res.error }
        }
        this.#internal.removeKeepalive(args[0])
        return { result: res.result }
    }
}

export function makeDebugRpc(client: DecthingsClient, addKeepalive: (id: string) => void, removeKeepalive: (id: string) => void): IDebugRpc {
    const rpc = new DebugRpc(client, addKeepalive, removeKeepalive)
    client.on('event', (api, eventName, params, data) => {
        if (api === 'Debug') {
            if (eventName === 'stdout' || eventName === 'stderr') {
                rpc.emit(eventName, params[0], data[0])
            } else {
                if (eventName === 'exit') {
                    removeKeepalive(params[0])
                }
                rpc.emit(eventName, ...params)
            }
        }
    })
    return rpc
}

export function makeFsRpc(client: DecthingsClient): IFsRpc {
    return {
        lookup: async (...args: Parameters<IFsRpc['lookup']>) => {
            const newArgs = [...args]
            if (typeof args[3] === 'string') {
                newArgs[3] = Buffer.from(args[3]).toString('base64')
            } else {
                if (!Buffer.isBuffer(args[3])) {
                    throw new Error('Invalid name: Expected a string or Buffer.')
                }
                newArgs[3] = args[3].toString('base64')
            }
            const res = await client.rawMethodCall('FS', 'lookup', newArgs, [])
            if (res.error) {
                return { error: res.error }
            }
            return { result: res.result }
        },
        setattr: passthroughCall(client, 'FS', 'setattr'),
        getattr: passthroughCall(client, 'FS', 'getattr'),
        mknod: async (...args: Parameters<IFsRpc['mknod']>) => {
            const newArgs = [...args]
            if (typeof args[2] === 'string') {
                newArgs[2] = Buffer.from(args[2]).toString('base64')
            } else {
                if (!Buffer.isBuffer(args[2])) {
                    throw new Error('Invalid name: Expected a string or Buffer.')
                }
                newArgs[2] = args[2].toString('base64')
            }
            const res = await client.rawMethodCall('FS', 'mknod', newArgs, [])
            if (res.error) {
                return { error: res.error }
            }
            return { result: res.result }
        },
        read: async (...args: Parameters<IFsRpc['read']>) => {
            const res = await client.rawMethodCall('FS', 'read', args, [])
            if (res.data.length === 0 || res.error) {
                return res.result ? { result: res.result } : { error: res.error }
            }
            return {
                result: {
                    ...res.result,
                    data: res.data[0]
                }
            }
        },
        write: async (...args: Parameters<IFsRpc['write']>) => {
            const newArgs = [...args]
            if (!Buffer.isBuffer(args[2])) {
                throw new Error('Invalid data: Expected a Buffer.')
            }
            newArgs.splice(2, 1)
            const res = await client.rawMethodCall('FS', 'write', newArgs, [args[2]])
            if (res.error) {
                return { error: res.error }
            }
            return { result: res.result }
        },
        symlink: async (...args: Parameters<IFsRpc['symlink']>) => {
            const newArgs = [...args]
            if (typeof args[2] === 'string') {
                newArgs[2] = Buffer.from(args[2]).toString('base64')
            } else {
                if (!Buffer.isBuffer(args[2])) {
                    throw new Error('Invalid name: Expected a string or Buffer.')
                }
                newArgs[2] = args[2].toString('base64')
            }
            const res = await client.rawMethodCall('FS', 'symlink', newArgs, [])
            if (res.error) {
                return { error: res.error }
            }
            return { result: res.result }
        },
        readlink: async (...args: Parameters<IFsRpc['readlink']>) => {
            const res = await client.rawMethodCall('FS', 'readlink', args, [])
            if (res.data.length === 0 || res.error) {
                return res.result ? { result: res.result } : { error: res.error }
            }
            return {
                result: {
                    ...res.result,
                    link: res.data[0]
                }
            }
        },
        mkdir: async (...args: Parameters<IFsRpc['mkdir']>) => {
            const newArgs = [...args]
            if (typeof args[2] === 'string') {
                newArgs[2] = Buffer.from(args[2]).toString('base64')
            } else {
                if (!Buffer.isBuffer(args[2])) {
                    throw new Error('Invalid name: Expected a string or Buffer.')
                }
                newArgs[2] = args[2].toString('base64')
            }
            const res = await client.rawMethodCall('FS', 'mkdir', newArgs, [])
            if (res.error) {
                return { error: res.error }
            }
            return { result: res.result }
        },
        unlink: async (...args: Parameters<IFsRpc['unlink']>) => {
            const newArgs = [...args]
            if (typeof args[2] === 'string') {
                newArgs[2] = Buffer.from(args[2]).toString('base64')
            } else {
                if (!Buffer.isBuffer(args[2])) {
                    throw new Error('Invalid name: Expected a string or Buffer.')
                }
                newArgs[2] = args[2].toString('base64')
            }
            const res = await client.rawMethodCall('FS', 'unlink', newArgs, [])
            if (res.error) {
                return { error: res.error }
            }
            return { result: res.result }
        },
        rmdir: async (...args: Parameters<IFsRpc['rmdir']>) => {
            const newArgs = [...args]
            if (typeof args[2] === 'string') {
                newArgs[2] = Buffer.from(args[2]).toString('base64')
            } else {
                if (!Buffer.isBuffer(args[2])) {
                    throw new Error('Invalid name: Expected a string or Buffer.')
                }
                newArgs[2] = args[2].toString('base64')
            }
            const res = await client.rawMethodCall('FS', 'rmdir', newArgs, [])
            if (res.error) {
                return { error: res.error }
            }
            return { result: res.result }
        },
        rename: async (...args: Parameters<IFsRpc['rename']>) => {
            const newArgs = [...args]
            if (typeof args[2] === 'string') {
                newArgs[2] = Buffer.from(args[2]).toString('base64')
            } else {
                if (!Buffer.isBuffer(args[2])) {
                    throw new Error('Invalid name: Expected a string or Buffer.')
                }
                newArgs[2] = args[2].toString('base64')
            }
            if (typeof args[4] === 'string') {
                newArgs[4] = Buffer.from(args[4]).toString('base64')
            } else {
                if (!Buffer.isBuffer(args[2])) {
                    throw new Error('Invalid newname: Expected a string or Buffer.')
                }
                newArgs[4] = args[4].toString('base64')
            }
            const res = await client.rawMethodCall('FS', 'rename', newArgs, [])
            if (res.error) {
                return { error: res.error }
            }
            return { result: res.result }
        },
        link: async (...args: Parameters<IFsRpc['link']>) => {
            const newArgs = [...args]
            if (typeof args[3] === 'string') {
                newArgs[3] = Buffer.from(args[3]).toString('base64')
            } else {
                if (!Buffer.isBuffer(args[2])) {
                    throw new Error('Invalid name: Expected a string or Buffer.')
                }
                newArgs[3] = args[3].toString('base64')
            }
            const res = await client.rawMethodCall('FS', 'link', newArgs, [])
            if (res.error) {
                return { error: res.error }
            }
            return { result: res.result }
        },
        readdir: async (...args: Parameters<IFsRpc['readdir']>) => {
            const res = await client.rawMethodCall('FS', 'readdir', args, [])
            if (res.error) {
                return { error: res.error }
            }
            return {
                result: {
                    entries: res.result.entries.map((entry: any) => {
                        return {
                            ...entry,
                            basename: Buffer.from(entry.basename, 'base64')
                        }
                    })
                }
            }
        },
        rmdirAll: async (...args: Parameters<IFsRpc['rmdirAll']>) => {
            const newArgs = [...args]
            if (typeof args[2] === 'string') {
                newArgs[2] = Buffer.from(args[2]).toString('base64')
            } else {
                if (!Buffer.isBuffer(args[2])) {
                    throw new Error('Invalid name: Expected a string or Buffer.')
                }
                newArgs[2] = args[2].toString('base64')
            }
            const res = await client.rawMethodCall('FS', 'rmdirAll', newArgs, [])
            if (res.error) {
                return { error: res.error }
            }
            return { result: res.result }
        },
        copy: async (...args: Parameters<IFsRpc['copy']>) => {
            const newArgs = [...args]
            if (typeof args[3] === 'string') {
                newArgs[3] = Buffer.from(args[3]).toString('base64')
            } else {
                if (!Buffer.isBuffer(args[3])) {
                    throw new Error('Invalid name: Expected a string or Buffer.')
                }
                newArgs[3] = args[3].toString('base64')
            }
            const res = await client.rawMethodCall('FS', 'copy', newArgs, [])
            if (res.error) {
                return { error: res.error }
            }
            return { result: res.result }
        }
    }
}

class LanguageRpc extends EventEmitter implements ILanguageRpc {
    #internal: {
        client: DecthingsClient
        addKeepalive: (id: string) => void
        removeKeepalive: (id: string) => void
    }
    constructor(client: DecthingsClient, addKeepalive: (id: string) => void, removeKeepalive: (id: string) => void) {
        super()
        this.#internal = {
            client,
            addKeepalive,
            removeKeepalive
        }
    }
    async startLanguageServer(...args: Parameters<ILanguageRpc['startLanguageServer']>) {
        const res = await this.#internal.client.rawMethodCall('Language', 'startLanguageServer', args, [], 'ws')
        if (res.error) {
            return { error: res.error }
        }
        this.#internal.addKeepalive(res.result.languageServerId)
        return { result: res.result }
    }
    async writeToLanguageServer(...args: Parameters<ILanguageRpc['writeToLanguageServer']>) {
        if (!Buffer.isBuffer(args[1])) {
            throw new Error('Invalid data: Expected a Buffer.')
        }
        const newArgs = [...args]
        newArgs.splice(1, 1)
        const res = await this.#internal.client.rawMethodCall('Language', 'writeToLanguageServer', newArgs, [args[1]])
        if (res.error) {
            return { error: res.error }
        }
        return { result: res.result }
    }
    async unsubscribeFromEvents(...args: Parameters<ILanguageRpc['unsubscribeFromEvents']>) {
        if (!this.#internal.client.hasWebSocket()) {
            return Promise.resolve({ error: { code: 'not_subscribed' as const } })
        }
        const res = await this.#internal.client.rawMethodCall('Language', 'unsubscribeFromEvents', args, [], 'ws')
        if (res.error) {
            return { error: res.error }
        }
        this.#internal.removeKeepalive(args[0])
        return { result: res.result }
    }
}

export function makeLanguageRpc(client: DecthingsClient, addKeepalive: (id: string) => void, removeKeepalive: (id: string) => void): ILanguageRpc {
    const rpc = new LanguageRpc(client, addKeepalive, removeKeepalive)
    client.on('event', (api, eventName, params, data) => {
        if (api === 'Language') {
            if (eventName === 'data') {
                rpc.emit(eventName, params[0], data[0])
            } else {
                if (eventName === 'exit') {
                    removeKeepalive(params[0])
                }
                rpc.emit(eventName, ...params)
            }
        }
    })
    return rpc
}

export function makeModelRpc(client: DecthingsClient): IModelRpc {
    return {
        createModel: async (...args: Parameters<IModelRpc['createModel']>) => {
            if (!args[2]) {
                throw new Error('Invalid executor: Expected an object.')
            }
            if (args[2].type === 'basedOnModelSnapshot') {
                if (!args[2].initialState) {
                    throw new Error('Invalid executor.initialState: Expected an object.')
                }
                if (args[2].initialState.method === 'create') {
                    const [newParams, data] = convertParameterProviders(args[2].initialState.params)
                    const newArgs = [...args]
                    newArgs[2] = {
                        ...args[2],
                        initialState: {
                            ...args[2].initialState,
                            params: newParams
                        }
                    }
                    const res = await client.rawMethodCall('Model', 'createModel', newArgs, data)
                    if (res.error) {
                        return { error: res.error }
                    }
                    return { result: res.result }
                }
                if (args[2].initialState.method === 'upload') {
                    const data = args[2].initialState.data
                    const newArgs = [...args]
                    newArgs[2] = {
                        ...args[2],
                        initialState: {
                            ...args[2].initialState,
                            data: undefined
                        }
                    }
                    const res = await client.rawMethodCall('Model', 'createModel', newArgs, data)
                    if (res.error) {
                        return { error: res.error }
                    }
                    return { result: res.result }
                }
            }
            const res = await client.rawMethodCall('Model', 'createModel', args, [])
            if (res.error) {
                return { error: res.error }
            }
            return { result: res.result }
        },
        waitForModelToBeCreated: passthroughCall(client, 'Model', 'waitForModelToBeCreated'),
        deleteModel: passthroughCall(client, 'Model', 'deleteModel'),
        snapshotModel: passthroughCall(client, 'Model', 'snapshotModel'),
        updateSnapshot: passthroughCall(client, 'Model', 'updateSnapshot'),
        deleteSnapshot: passthroughCall(client, 'Model', 'deleteSnapshot'),
        updateModel: passthroughCall(client, 'Model', 'updateModel'),
        getModels: passthroughCall(client, 'Model', 'getModels'),
        setFilesystemSize: passthroughCall(client, 'Model', 'setFilesystemSize'),
        createState: async (...args: Parameters<IModelRpc['createState']>) => {
            const [newParams, data] = convertParameterProviders(args[2])
            const newArgs = [...args]
            newArgs[2] = newParams
            const res = await client.rawMethodCall('Model', 'createState', newArgs, data)
            if (res.error) {
                return { error: res.error }
            }
            return { result: res.result }
        },
        uploadState: async (...args: Parameters<IModelRpc['uploadState']>) => {
            if (!Array.isArray(args[2]) || args[2].some((el) => !Buffer.isBuffer(el))) {
                throw new Error('Invalid data: Expected an array of Buffers.')
            }
            const newArgs = [...args]
            newArgs.splice(2, 1)
            const res = await client.rawMethodCall('Model', 'uploadState', newArgs, args[2])
            if (res.error) {
                return { error: res.error }
            }
            return { result: res.result }
        },
        cancelCreateState: passthroughCall(client, 'Model', 'cancelCreateState'),
        getCreatingStates: passthroughCall(client, 'Model', 'getCreatingStates'),
        waitForStateToBeCreated: passthroughCall(client, 'Model', 'waitForStateToBeCreated'),
        updateModelState: passthroughCall(client, 'Model', 'updateModelState'),
        setCurrentModelState: passthroughCall(client, 'Model', 'setCurrentModelState'),
        deleteModelState: passthroughCall(client, 'Model', 'deleteModelState'),
        getModelState: async (...args: Parameters<IModelRpc['getModelState']>) => {
            const res = await client.rawMethodCall('Model', 'getModelState', args, [])
            if (res.data.length === 0 || res.error) {
                return res.result ? { result: res.result } : { error: res.error }
            }
            return {
                result: {
                    ...res.result,
                    data: res.data
                }
            }
        },
        getSnapshotState: async (...args: Parameters<IModelRpc['getSnapshotState']>) => {
            const res = await client.rawMethodCall('Model', 'getSnapshotState', args, [])
            if (res.data.length === 0 || res.error) {
                return res.result ? { result: res.result } : { error: res.error }
            }
            return {
                result: {
                    ...res.result,
                    data: res.data
                }
            }
        },
        getParameterDefinitions: passthroughCall(client, 'Model', 'getParameterDefinitions'),
        train: async (...args: Parameters<IModelRpc['train']>) => {
            const [newParams, data] = convertParameterProviders(args[2])
            const newArgs = [...args]
            newArgs[2] = newParams
            const res = await client.rawMethodCall('Model', 'train', newArgs, data)
            if (res.error) {
                return { error: res.error }
            }
            return { result: res.result }
        },
        getTrainingStatus: passthroughCall(client, 'Model', 'getTrainingStatus'),
        getTrainingMetrics: async (...args: Parameters<IModelRpc['getTrainingMetrics']>) => {
            const res = await client.rawMethodCall('Model', 'getTrainingMetrics', args, [])
            if (res.data.length === 0 || res.error) {
                return res.result ? { result: res.result } : { error: res.error }
            }
            let pos = 0
            return {
                result: {
                    ...res.result,
                    metrics: res.result.metrics.map((metric: any) => {
                        return {
                            ...metric,
                            entries: metric.entries.map((entry: any) => {
                                const newEntry = {
                                    ...entry,
                                    data: Data.deserializeDataOrDataElement(res.data[pos])
                                }
                                pos += 1
                                return newEntry
                            })
                        }
                    })
                }
            }
        },
        getTrainingSysinfo: passthroughCall(client, 'Model', 'getTrainingSysinfo'),
        cancelTrainingSession: passthroughCall(client, 'Model', 'cancelTrainingSession'),
        clearPreviousTrainingSession: passthroughCall(client, 'Model', 'clearPreviousTrainingSession'),
        evaluate: async (...args: Parameters<IModelRpc['evaluate']>) => {
            const [newParams, data] = convertParameterProviders(args[1])
            const newArgs = [...args]
            newArgs[1] = newParams
            const res = await client.rawMethodCall('Model', 'evaluate', newArgs, data)
            if (res.data.length === 0 || res.error || !res.result.success) {
                return res.result ? { result: res.result } : { error: res.error }
            }
            let pos = 0
            const newOutput: Parameter[] = res.result.success.output.map((el: { name: string }): Parameter => {
                const data = Data.deserialize(res.data[pos])
                pos += 1
                return {
                    name: el.name,
                    data
                }
            })
            return {
                result: {
                    ...res.result,
                    success: {
                        ...res.result.success,
                        output: newOutput
                    }
                }
            }
        },
        getEvaluations: passthroughCall(client, 'Model', 'getEvaluations'),
        getFinishedEvaluationResult: async (...args: Parameters<IModelRpc['getFinishedEvaluationResult']>) => {
            const res = await client.rawMethodCall('Model', 'getFinishedEvaluationResult', args, [])
            if (res.data.length === 0 || res.error || !res.result.evaluationSuccess) {
                return res.result ? { result: res.result } : { error: res.error }
            }
            let pos = 0
            const newOutput: Parameter[] = res.result.evaluationSuccess.output.map((el: { name: string }): Parameter => {
                const data = Data.deserialize(res.data[pos])
                pos += 1
                return {
                    name: el.name,
                    data
                }
            })
            return {
                result: {
                    ...res.result,
                    evaluationSuccess: {
                        ...res.result.evaluationSuccess,
                        output: newOutput
                    }
                }
            }
        },
        cancelEvaluation: passthroughCall(client, 'Model', 'cancelEvaluation'),
        setUsedPersistentLaunchersForEvaluate: passthroughCall(client, 'Model', 'setUsedPersistentLaunchersForEvaluate'),
        getUsedPersistentLaunchersForEvaluate: passthroughCall(client, 'Model', 'getUsedPersistentLaunchersForEvaluate')
    }
}

export function makePersistentLauncherRpc(client: DecthingsClient): IPersistentLauncherRpc {
    return {
        createPersistentLauncher: passthroughCall(client, 'PersistentLauncher', 'createPersistentLauncher'),
        getPersistentLaunchers: passthroughCall(client, 'PersistentLauncher', 'getPersistentLaunchers'),
        getSysinfo: passthroughCall(client, 'PersistentLauncher', 'getSysinfo'),
        deletePersistentLauncher: passthroughCall(client, 'PersistentLauncher', 'deletePersistentLauncher')
    }
}

class SpawnedRpc extends EventEmitter implements ISpawnedRpc {
    #internal: {
        client: DecthingsClient
        addKeepalive: (id: string) => void
        removeKeepalive: (id: string) => void
    }
    constructor(client: DecthingsClient, addKeepalive: (id: string) => void, removeKeepalive: (id: string) => void) {
        super()
        this.#internal = {
            client,
            addKeepalive,
            removeKeepalive
        }
    }
    async spawnCommand(...args: Parameters<ISpawnedRpc['spawnCommand']>) {
        const subscribed = args[4] !== false
        const res = await this.#internal.client.rawMethodCall('Spawned', 'spawnCommand', args, [], subscribed ? 'ws' : 'http')
        if (res.error) {
            return { error: res.error }
        }
        if (subscribed) {
            this.#internal.addKeepalive(res.result.spawnedCommandId)
        }
        return { result: res.result }
    }
    async spawnCommandForModel(...args: Parameters<ISpawnedRpc['spawnCommandForModel']>) {
        const subscribed = args[5] !== false
        const res = await this.#internal.client.rawMethodCall('Spawned', 'spawnCommandForModel', args, [], subscribed ? 'ws' : 'http')
        if (res.error) {
            return { error: res.error }
        }
        if (subscribed) {
            this.#internal.addKeepalive(res.result.spawnedCommandId)
        }
        return { result: res.result }
    }
    async terminateSpawnedCommand(...args: Parameters<ISpawnedRpc['terminateSpawnedCommand']>) {
        const res = await this.#internal.client.rawMethodCall('Spawned', 'terminateSpawnedCommand', args, [])
        if (res.error) {
            return { error: res.error }
        }
        return { result: res.result }
    }
    async getSpawnedCommands(...args: Parameters<ISpawnedRpc['getSpawnedCommands']>) {
        const res = await this.#internal.client.rawMethodCall('Spawned', 'getSpawnedCommands', args, [])
        if (res.error) {
            return { error: res.error }
        }
        return { result: res.result }
    }
    async writeToSpawnedCommand(...args: Parameters<ISpawnedRpc['writeToSpawnedCommand']>) {
        let data: Buffer
        if (typeof args[1] === 'string') {
            data = Buffer.from(args[1])
        } else {
            if (!Buffer.isBuffer(args[1])) {
                throw new Error('Invalid data: Expected a Buffer.')
            }
            data = args[1]
        }
        const newArgs = [...args]
        newArgs.splice(1, 1)
        const res = await this.#internal.client.rawMethodCall('Spawned', 'writeToSpawnedCommand', newArgs, [data])
        if (res.error) {
            return { error: res.error }
        }
        return { result: res.result }
    }
    async subscribeToEvents(...args: Parameters<ISpawnedRpc['subscribeToEvents']>) {
        const res = await this.#internal.client.rawMethodCall('Spawned', 'subscribeToEvents', args, [], 'ws')
        if (res.error) {
            return { error: res.error }
        }
        this.#internal.addKeepalive(args[0])
        return { result: res.result }
    }
    async unsubscribeFromEvents(...args: Parameters<ISpawnedRpc['unsubscribeFromEvents']>) {
        if (!this.#internal.client.hasWebSocket()) {
            return Promise.resolve({ error: { code: 'not_subscribed' as const } })
        }
        const res = await this.#internal.client.rawMethodCall('Spawned', 'unsubscribeFromEvents', args, [], 'ws')
        if (res.error) {
            return { error: res.error }
        }
        this.#internal.removeKeepalive(args[0])
        return { result: res.result }
    }
}

export function makeSpawnedRpc(client: DecthingsClient, addKeepalive: (id: string) => void, removeKeepalive: (id: string) => void): ISpawnedRpc {
    const rpc = new SpawnedRpc(client, addKeepalive, removeKeepalive)
    client.on('event', (api, eventName, params, data) => {
        if (api === 'Spawned') {
            if (eventName === 'stdout' || eventName === 'stderr') {
                rpc.emit(eventName, params[0], data[0])
            } else {
                if (eventName === 'exit') {
                    removeKeepalive(params[0])
                }
                rpc.emit(eventName, ...params)
            }
        }
    })
    return rpc
}

export function makeTeamRpc(client: DecthingsClient): ITeamRpc {
    return {
        createTeam: passthroughCall(client, 'Team', 'createTeam'),
        updateTeam: passthroughCall(client, 'Team', 'updateTeam'),
        getTeams: passthroughCall(client, 'Team', 'getTeams'),
        inviteUsersToTeam: passthroughCall(client, 'Team', 'inviteUsersToTeam'),
        removeUsersFromTeam: passthroughCall(client, 'Team', 'removeUsersFromTeam'),
        acceptTeamInvitation: passthroughCall(client, 'Team', 'acceptTeamInvitation'),
        denyTeamInvitation: passthroughCall(client, 'Team', 'denyTeamInvitation'),
        setShareModelWithTeam: passthroughCall(client, 'Team', 'setShareModelWithTeam'),
        setShareDatasetWithTeam: passthroughCall(client, 'Team', 'setShareDatasetWithTeam'),
        createRole: passthroughCall(client, 'Team', 'createRole'),
        editRole: passthroughCall(client, 'Team', 'editRole'),
        removeRole: passthroughCall(client, 'Team', 'removeRole'),
        assignRole: passthroughCall(client, 'Team', 'assignRole')
    }
}

class TerminalRpc extends EventEmitter implements ITerminalRpc {
    #internal: {
        client: DecthingsClient
        addKeepalive: (id: string) => void
        removeKeepalive: (id: string) => void
    }
    constructor(client: DecthingsClient, addKeepalive: (id: string) => void, removeKeepalive: (id: string) => void) {
        super()
        this.#internal = {
            client,
            addKeepalive,
            removeKeepalive
        }
    }
    async launchTerminalSession(...args: Parameters<ITerminalRpc['launchTerminalSession']>) {
        const subscribed = args[3] !== false
        const res = await this.#internal.client.rawMethodCall('Terminal', 'launchTerminalSession', args, [], subscribed ? 'ws' : 'http')
        if (res.error) {
            return { error: res.error }
        }
        if (subscribed) {
            this.#internal.addKeepalive(res.result.terminalSessionId)
        }
        return { result: res.result }
    }
    async terminateTerminalSession(...args: Parameters<ITerminalRpc['terminateTerminalSession']>) {
        const res = await this.#internal.client.rawMethodCall('Terminal', 'terminateTerminalSession', args, [])
        if (res.error) {
            return { error: res.error }
        }
        return { result: res.result }
    }
    async getTerminalSessions(...args: Parameters<ITerminalRpc['getTerminalSessions']>) {
        const res = await this.#internal.client.rawMethodCall('Terminal', 'getTerminalSessions', args, [])
        if (res.error) {
            return { error: res.error }
        }
        return { result: res.result }
    }
    async writeToTerminalSession(...args: Parameters<ITerminalRpc['writeToTerminalSession']>) {
        let data: Buffer
        if (typeof args[1] === 'string') {
            data = Buffer.from(args[1])
        } else {
            if (!Buffer.isBuffer(args[1])) {
                throw new Error('Invalid data: Expected a Buffer.')
            }
            data = args[1]
        }
        const newArgs = [...args]
        newArgs.splice(1, 1)
        const res = await this.#internal.client.rawMethodCall('Terminal', 'writeToTerminalSession', newArgs, [data])
        if (res.error) {
            return { error: res.error }
        }
        return { result: res.result }
    }
    async resizeTerminalSession(...args: Parameters<ITerminalRpc['resizeTerminalSession']>) {
        const res = await this.#internal.client.rawMethodCall('Terminal', 'resizeTerminalSession', args, [])
        if (res.error) {
            return { error: res.error }
        }
        return { result: res.result }
    }
    async addFilesystemAccessForTerminalSession(...args: Parameters<ITerminalRpc['addFilesystemAccessForTerminalSession']>) {
        const res = await this.#internal.client.rawMethodCall('Terminal', 'addFilesystemAccessForTerminalSession', args, [])
        if (res.error) {
            return { error: res.error }
        }
        return { result: res.result }
    }
    async subscribeToEvents(...args: Parameters<ITerminalRpc['subscribeToEvents']>) {
        const res = await this.#internal.client.rawMethodCall('Terminal', 'subscribeToEvents', args, [], 'ws')
        if (res.error) {
            return { error: res.error }
        }
        this.#internal.addKeepalive(args[0])
        return { result: res.result }
    }
    async unsubscribeFromEvents(...args: Parameters<ITerminalRpc['unsubscribeFromEvents']>) {
        if (!this.#internal.client.hasWebSocket()) {
            return Promise.resolve({ error: { code: 'not_subscribed' as const } })
        }
        const res = await this.#internal.client.rawMethodCall('Terminal', 'unsubscribeFromEvents', args, [], 'ws')
        if (res.error) {
            return { error: res.error }
        }
        this.#internal.removeKeepalive(args[0])
        return { result: res.result }
    }
}

export function makeTerminalRpc(client: DecthingsClient, addKeepalive: (id: string) => void, removeKeepalive: (id: string) => void): ITerminalRpc {
    const rpc = new TerminalRpc(client, addKeepalive, removeKeepalive)
    client.on('event', (api, eventName, params, data) => {
        if (api === 'Terminal') {
            if (eventName === 'data') {
                rpc.emit(eventName, params[0], data[0])
            } else {
                if (eventName === 'exit') {
                    removeKeepalive(params[0])
                }
                rpc.emit(eventName, ...params)
            }
        }
    })
    return rpc
}

export function makeUserRpc(client: DecthingsClient): IUserRpc {
    return {
        findMatchingUsers: passthroughCall(client, 'User', 'findMatchingUsers'),
        getUsers: passthroughCall(client, 'User', 'getUsers'),
        getNotifications: passthroughCall(client, 'User', 'getNotifications'),
        setNotification: passthroughCall(client, 'User', 'setNotification'),
        getBillingStats: passthroughCall(client, 'User', 'getBillingStats'),
        estimateAmountDue: passthroughCall(client, 'User', 'estimateAmountDue'),
        getQuotas: passthroughCall(client, 'User', 'getQuotas')
    }
}
