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
    return async (params?: any) => {
        const res = await client.rawMethodCall(api, method, params || {}, [])
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
        addEntries: async (params: Parameters<IDatasetRpc['addEntries']>[0]) => {
            if (!params || typeof params !== 'object') {
                throw new Error('Invalid parameters: Expected an object.')
            }
            if (!Array.isArray(params.entries)) {
                throw new Error('Invalid parameter "entries": Expected an array.')
            }
            const newParams = {
                ...params
            }
            delete newParams.entries
            const res = await client.rawMethodCall(
                'Dataset',
                'addEntries',
                newParams,
                params.entries.map((entry: Data | DataElement) => {
                    if (!(entry instanceof Data) && !(entry instanceof DataElement)) {
                        throw new Error('Invalid parameter "entries": Expected each element to be an instance of Data or DataElement.')
                    }
                    return entry.serialize()
                })
            )
            if (res.error) {
                return { error: res.error }
            }
            return { result: res.result }
        },
        addEntriesToNeedsReview: async (params: Parameters<IDatasetRpc['addEntriesToNeedsReview']>[0]) => {
            if (!params || typeof params !== 'object') {
                throw new Error('Invalid parameters: Expected an object.')
            }
            if (!Array.isArray(params.entries)) {
                throw new Error('Invalid parameter "entries": Expected an array.')
            }
            const newParams = {
                ...params
            }
            delete newParams.entries
            const res = await client.rawMethodCall(
                'Dataset',
                'addEntriesToNeedsReview',
                newParams,
                params.entries.map((entry: Data | DataElement) => {
                    if (!(entry instanceof Data) && !(entry instanceof DataElement)) {
                        throw new Error('Invalid parameter "entries": Expected each element to be an instance of Data or DataElement.')
                    }
                    return entry.serialize()
                })
            )
            if (res.error) {
                return { error: res.error }
            }
            return { result: res.result }
        },
        finalizeNeedsReviewEntries: async (params: Parameters<IDatasetRpc['finalizeNeedsReviewEntries']>[0]) => {
            if (!params || typeof params !== 'object') {
                throw new Error('Invalid parameters: Expected an object.')
            }
            if (!Array.isArray(params.entries)) {
                throw new Error('Invalid parameter "entries": Expected an array.')
            }
            const data: Buffer[] = []
            const newEntries = params.entries.map((entry) => {
                if (!entry || typeof entry !== 'object') {
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

            const newParams = {
                ...params
            }
            newParams.entries = newEntries

            const res = await client.rawMethodCall('Dataset', 'finalizeNeedsReviewEntries', newParams, data)

            if (res.error) {
                return { error: res.error }
            }
            return { result: res.result }
        },
        getEntries: async (params: Parameters<IDatasetRpc['getEntries']>[0]) => {
            const res = await client.rawMethodCall('Dataset', 'getEntries', params, [])
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
        getNeedsReviewEntries: async (params: Parameters<IDatasetRpc['getNeedsReviewEntries']>[0]) => {
            const res = await client.rawMethodCall('Dataset', 'getNeedsReviewEntries', params, [])
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
    async launchDebugSession(params: Parameters<IDebugRpc['launchDebugSession']>[0]) {
        if (!params || typeof params !== 'object') {
            throw new Error('Invalid parameters: Expected an object.')
        }
        const subscribed = params.subscribeToEvents !== false
        const res = await this.#internal.client.rawMethodCall('Debug', 'launchDebugSession', params, [], subscribed ? 'ws' : 'http')
        if (subscribed && res.result) {
            this.#internal.addKeepalive(res.result.debugSessionId)
        }
        return res.result ? { result: res.result } : { error: res.error }
    }
    async getDebugSessions(params: Parameters<IDebugRpc['getDebugSessions']>[0]) {
        const res = await this.#internal.client.rawMethodCall('Debug', 'getDebugSessions', params, [])
        if (res.error) {
            return { error: res.error }
        }
        return { result: res.result }
    }
    async terminateDebugSession(params: Parameters<IDebugRpc['terminateDebugSession']>[0]) {
        const res = await this.#internal.client.rawMethodCall('Debug', 'terminateDebugSession', params, [])
        if (res.error) {
            return { error: res.error }
        }
        return { result: res.result }
    }
    async callCreateModelState(params: Parameters<IDebugRpc['callCreateModelState']>[0]) {
        if (!params || typeof params !== 'object') {
            throw new Error('Invalid parameters: Expected an object.')
        }
        const [newParamProviders, data] = convertParameterProviders(params.params)
        const newParams = { ...params }
        newParams.params = newParamProviders
        const res = await this.#internal.client.rawMethodCall('Debug', 'callCreateModelState', newParams, data)
        if (res.error) {
            return { error: res.error }
        }
        return { result: res.result }
    }
    async callInstantiateModel(params: Parameters<IDebugRpc['callInstantiateModel']>[0]) {
        if (!params || typeof params !== 'object') {
            throw new Error('Invalid parameters: Expected an object.')
        }
        if (!params.stateData || typeof params.stateData !== 'object') {
            throw new Error('Invalid parameter "stateData": Expected an object.')
        }
        const newParams = { ...params }
        let dataToSend: Buffer[]
        if (params.stateData.type === 'data') {
            if (!Array.isArray(params.stateData.data) || params.stateData.data.some((el) => !Buffer.isBuffer(el))) {
                throw new Error('Invalid parameter "stateData": For type="data", expected the field "data" to be an array of Buffers.')
            }
            dataToSend = params.stateData.data
            newParams.stateData = { ...params.stateData }
            delete newParams.stateData.data
        } else {
            dataToSend = []
        }

        const res = await this.#internal.client.rawMethodCall('Debug', 'callInstantiateModel', newParams, dataToSend)
        if (res.error) {
            return { error: res.error }
        }
        return { result: res.result }
    }
    async callTrain(params: Parameters<IDebugRpc['callTrain']>[0]) {
        if (!params || typeof params !== 'object') {
            throw new Error('Invalid parameters: Expected an object.')
        }
        const [newParamProviders, data] = convertParameterProviders(params.params)
        const newParams = { ...params }
        newParams.params = newParamProviders
        const res = await this.#internal.client.rawMethodCall('Debug', 'callTrain', newParams, data)
        if (res.error) {
            return { error: res.error }
        }
        return { result: res.result }
    }
    async getTrainingStatus(params: Parameters<IDebugRpc['getTrainingStatus']>[0]) {
        const res = await this.#internal.client.rawMethodCall('Debug', 'getTrainingStatus', params, [])
        if (res.error) {
            return { error: res.error }
        }
        return { result: res.result }
    }
    async getTrainingMetrics(params: Parameters<IDebugRpc['getTrainingMetrics']>[0]) {
        const res = await this.#internal.client.rawMethodCall('Debug', 'getTrainingMetrics', params, [])
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
    async cancelTrainingSession(params: Parameters<IDebugRpc['cancelTrainingSession']>[0]) {
        const res = await this.#internal.client.rawMethodCall('Debug', 'cancelTrainingSession', params, [])
        if (res.error) {
            return { error: res.error }
        }
        return { result: res.result }
    }
    async callEvaluate(params: Parameters<IDebugRpc['callEvaluate']>[0]) {
        if (!params || typeof params !== 'object') {
            throw new Error('Invalid parameters: Expected an object.')
        }
        const [newParamProviders, data] = convertParameterProviders(params.params)
        const newParams = { ...params }
        newParams.params = newParamProviders
        const res = await this.#internal.client.rawMethodCall('Debug', 'callEvaluate', newParams, data)
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
    async callGetModelState(params: Parameters<IDebugRpc['callGetModelState']>[0]) {
        const res = await this.#internal.client.rawMethodCall('Debug', 'callGetModelState', params, [])
        if (res.error) {
            return { error: res.error }
        }
        return { result: res.result }
    }
    async downloadStateData(params: Parameters<IDebugRpc['downloadStateData']>[0]) {
        const res = await this.#internal.client.rawMethodCall('Debug', 'downloadStateData', params, [])
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
    async sendToRemoteInspector(params: Parameters<IDebugRpc['sendToRemoteInspector']>[0]) {
        if (!params || typeof params !== 'object') {
            throw new Error('Invalid parameters: Expected an object.')
        }
        let data: Buffer
        if (typeof params.data === 'string') {
            data = Buffer.from(params.data)
        } else {
            if (!Buffer.isBuffer(params.data)) {
                throw new Error('Invalid parameter "data": Expected a string or Buffer.')
            }
            data = params.data
        }
        const newParams = { ...params }
        delete newParams.data
        const res = await this.#internal.client.rawMethodCall('Debug', 'sendToRemoteInspector', params, [data])
        if (res.error) {
            return { error: res.error }
        }
        return { result: res.result }
    }
    async subscribeToEvents(params: Parameters<IDebugRpc['subscribeToEvents']>[0]) {
        if (!params || typeof params !== 'object') {
            throw new Error('Invalid parameters: Expected an object.')
        }
        const res = await this.#internal.client.rawMethodCall('Debug', 'subscribeToEvents', params, [], 'ws')
        if (res.error) {
            return { error: res.error }
        }
        this.#internal.addKeepalive(params.debugSessionId)
        return { result: res.result }
    }
    async unsubscribeFromEvents(params: Parameters<IDebugRpc['unsubscribeFromEvents']>[0]) {
        if (!params || typeof params !== 'object') {
            throw new Error('Invalid parameters: Expected an object.')
        }
        if (!this.#internal.client.hasWebSocket()) {
            return Promise.resolve({ error: { code: 'not_subscribed' as const } })
        }
        const res = await this.#internal.client.rawMethodCall('Debug', 'unsubscribeFromEvents', params, [], 'ws')
        if (res.error) {
            return { error: res.error }
        }
        this.#internal.removeKeepalive(params.debugSessionId)
        return { result: res.result }
    }
}

export function makeDebugRpc(client: DecthingsClient, addKeepalive: (id: string) => void, removeKeepalive: (id: string) => void): IDebugRpc {
    const rpc = new DebugRpc(client, addKeepalive, removeKeepalive)
    client.on('event', (api, eventName, params, data) => {
        if (api === 'Debug') {
            if (eventName === 'stdout' || eventName === 'stderr' || eventName == 'remoteInspectorData') {
                params.data = data[0]
                rpc.emit(eventName, params)
            } else {
                if (eventName === 'exit') {
                    removeKeepalive(params.debugSessionId)
                }
                rpc.emit(eventName, params)
            }
        }
    })
    return rpc
}

export function makeFsRpc(client: DecthingsClient): IFsRpc {
    return {
        lookup: async (params: Parameters<IFsRpc['lookup']>[0]) => {
            if (!params || typeof params !== 'object') {
                throw new Error('Invalid parameters: Expected an object.')
            }
            const newParams = { ...params }
            if (typeof params.name === 'string') {
                newParams.name = Buffer.from(params.name).toString('base64')
            } else {
                if (!Buffer.isBuffer(params.name)) {
                    throw new Error('Invalid parameter "name": Expected a string or Buffer.')
                }
                newParams.name = params.name.toString('base64')
            }
            const res = await client.rawMethodCall('FS', 'lookup', newParams, [])
            if (res.error) {
                return { error: res.error }
            }
            return { result: res.result }
        },
        setattr: passthroughCall(client, 'FS', 'setattr'),
        getattr: passthroughCall(client, 'FS', 'getattr'),
        mknod: async (params: Parameters<IFsRpc['mknod']>[0]) => {
            if (!params || typeof params !== 'object') {
                throw new Error('Invalid parameters: Expected an object.')
            }
            const newParams = { ...params }
            if (typeof params.name === 'string') {
                newParams.name = Buffer.from(params.name).toString('base64')
            } else {
                if (!Buffer.isBuffer(params.name)) {
                    throw new Error('Invalid parameter "name": Expected a string or Buffer.')
                }
                newParams.name = params.name.toString('base64')
            }
            const res = await client.rawMethodCall('FS', 'mknod', newParams, [])
            if (res.error) {
                return { error: res.error }
            }
            return { result: res.result }
        },
        read: async (params: Parameters<IFsRpc['read']>[0]) => {
            const res = await client.rawMethodCall('FS', 'read', params, [])
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
        write: async (params: Parameters<IFsRpc['write']>[0]) => {
            if (!params || typeof params !== 'object') {
                throw new Error('Invalid parameters: Expected an object.')
            }
            const newParams = { ...params }
            if (!Buffer.isBuffer(params.data)) {
                throw new Error('Invalid parameter "data": Expected a Buffer.')
            }
            delete newParams.data
            const res = await client.rawMethodCall('FS', 'write', newParams, [params.data])
            if (res.error) {
                return { error: res.error }
            }
            return { result: res.result }
        },
        symlink: async (params: Parameters<IFsRpc['symlink']>[0]) => {
            if (!params || typeof params !== 'object') {
                throw new Error('Invalid parameters: Expected an object.')
            }
            const newParams = { ...params }
            if (typeof params.name === 'string') {
                newParams.name = Buffer.from(params.name).toString('base64')
            } else {
                if (!Buffer.isBuffer(params.name)) {
                    throw new Error('Invalid parameter "name": Expected a string or Buffer.')
                }
                newParams.name = params.name.toString('base64')
            }
            if (typeof params.link === 'string') {
                newParams.link = Buffer.from(params.link).toString('base64')
            } else {
                if (!Buffer.isBuffer(params.link)) {
                    throw new Error('Invalid parameter "link": Expected a string or Buffer.')
                }
                newParams.link = params.link.toString('base64')
            }
            const res = await client.rawMethodCall('FS', 'symlink', newParams, [])
            if (res.error) {
                return { error: res.error }
            }
            return { result: res.result }
        },
        readlink: async (params: Parameters<IFsRpc['readlink']>[0]) => {
            const res = await client.rawMethodCall('FS', 'readlink', params, [])
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
        mkdir: async (params: Parameters<IFsRpc['mkdir']>[0]) => {
            if (!params || typeof params !== 'object') {
                throw new Error('Invalid parameters: Expected an object.')
            }
            const newParams = { ...params }
            if (typeof params.name === 'string') {
                newParams.name = Buffer.from(params.name).toString('base64')
            } else {
                if (!Buffer.isBuffer(params.name)) {
                    throw new Error('Invalid parameter "name": Expected a string or Buffer.')
                }
                newParams.name = params.name.toString('base64')
            }
            const res = await client.rawMethodCall('FS', 'mkdir', newParams, [])
            if (res.error) {
                return { error: res.error }
            }
            return { result: res.result }
        },
        unlink: async (params: Parameters<IFsRpc['unlink']>[0]) => {
            if (!params || typeof params !== 'object') {
                throw new Error('Invalid parameters: Expected an object.')
            }
            const newParams = { ...params }
            if (typeof params.name === 'string') {
                newParams.name = Buffer.from(params.name).toString('base64')
            } else {
                if (!Buffer.isBuffer(params.name)) {
                    throw new Error('Invalid parameter "name": Expected a string or Buffer.')
                }
                newParams.name = params.name.toString('base64')
            }
            const res = await client.rawMethodCall('FS', 'unlink', newParams, [])
            if (res.error) {
                return { error: res.error }
            }
            return { result: res.result }
        },
        rmdir: async (params: Parameters<IFsRpc['rmdir']>[0]) => {
            if (!params || typeof params !== 'object') {
                throw new Error('Invalid parameters: Expected an object.')
            }
            const newParams = { ...params }
            if (typeof params.name === 'string') {
                newParams.name = Buffer.from(params.name).toString('base64')
            } else {
                if (!Buffer.isBuffer(params.name)) {
                    throw new Error('Invalid parameter "name": Expected a string or Buffer.')
                }
                newParams.name = params.name.toString('base64')
            }
            const res = await client.rawMethodCall('FS', 'rmdir', newParams, [])
            if (res.error) {
                return { error: res.error }
            }
            return { result: res.result }
        },
        rename: async (params: Parameters<IFsRpc['rename']>[0]) => {
            if (!params || typeof params !== 'object') {
                throw new Error('Invalid parameters: Expected an object.')
            }
            const newParams = { ...params }
            if (typeof params.name === 'string') {
                newParams.name = Buffer.from(params.name).toString('base64')
            } else {
                if (!Buffer.isBuffer(params.name)) {
                    throw new Error('Invalid parameter "name": Expected a string or Buffer.')
                }
                newParams.name = params.name.toString('base64')
            }
            if (typeof params.newname === 'string') {
                newParams.newname = Buffer.from(params.newname).toString('base64')
            } else {
                if (!Buffer.isBuffer(params.newname)) {
                    throw new Error('Invalid parameter "newname": Expected a string or Buffer.')
                }
                newParams.newname = params.newname.toString('base64')
            }
            const res = await client.rawMethodCall('FS', 'rename', newParams, [])
            if (res.error) {
                return { error: res.error }
            }
            return { result: res.result }
        },
        link: async (params: Parameters<IFsRpc['link']>[0]) => {
            if (!params || typeof params !== 'object') {
                throw new Error('Invalid parameters: Expected an object.')
            }
            const newParams = { ...params }
            if (typeof params.newname === 'string') {
                newParams.newname = Buffer.from(params.newname).toString('base64')
            } else {
                if (!Buffer.isBuffer(params.newname)) {
                    throw new Error('Invalid parameter "newname": Expected a string or Buffer.')
                }
                newParams.newname = params.newname.toString('base64')
            }
            const res = await client.rawMethodCall('FS', 'link', newParams, [])
            if (res.error) {
                return { error: res.error }
            }
            return { result: res.result }
        },
        readdir: async (params: Parameters<IFsRpc['readdir']>[0]) => {
            const res = await client.rawMethodCall('FS', 'readdir', params, [])
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
        rmdirAll: async (params: Parameters<IFsRpc['rmdirAll']>[0]) => {
            if (!params || typeof params !== 'object') {
                throw new Error('Invalid parameters: Expected an object.')
            }
            const newParams = { ...params }
            if (typeof params.name === 'string') {
                newParams.name = Buffer.from(params.name).toString('base64')
            } else {
                if (!Buffer.isBuffer(params.name)) {
                    throw new Error('Invalid parameter "name": Expected a string or Buffer.')
                }
                newParams.name = params.name.toString('base64')
            }
            const res = await client.rawMethodCall('FS', 'rmdirAll', newParams, [])
            if (res.error) {
                return { error: res.error }
            }
            return { result: res.result }
        },
        copy: async (params: Parameters<IFsRpc['copy']>[0]) => {
            if (!params || typeof params !== 'object') {
                throw new Error('Invalid parameters: Expected an object.')
            }
            const newParams = { ...params }
            if (typeof params.newname === 'string') {
                newParams.newname = Buffer.from(params.newname).toString('base64')
            } else {
                if (!Buffer.isBuffer(params.newname)) {
                    throw new Error('Invalid parameter "newname": Expected a string or Buffer.')
                }
                newParams.newname = params.newname.toString('base64')
            }
            const res = await client.rawMethodCall('FS', 'copy', newParams, [])
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
    async startLanguageServer(params: Parameters<ILanguageRpc['startLanguageServer']>[0]) {
        const res = await this.#internal.client.rawMethodCall('Language', 'startLanguageServer', params, [], 'ws')
        if (res.error) {
            return { error: res.error }
        }
        this.#internal.addKeepalive(res.result.languageServerId)
        return { result: res.result }
    }
    async writeToLanguageServer(params: Parameters<ILanguageRpc['writeToLanguageServer']>[0]) {
        if (!params || typeof params !== 'object') {
            throw new Error('Invalid parameters: Expected an object.')
        }
        if (!Buffer.isBuffer(params.data)) {
            throw new Error('Invalid data: Expected a Buffer.')
        }
        const newParams = { ...params }
        delete newParams.data
        const res = await this.#internal.client.rawMethodCall('Language', 'writeToLanguageServer', newParams, [params.data])
        if (res.error) {
            return { error: res.error }
        }
        return { result: res.result }
    }
    async unsubscribeFromEvents(params: Parameters<ILanguageRpc['unsubscribeFromEvents']>[0]) {
        if (!params || typeof params !== 'object') {
            throw new Error('Invalid parameters: Expected an object.')
        }
        if (!this.#internal.client.hasWebSocket()) {
            return Promise.resolve({ error: { code: 'not_subscribed' as const } })
        }
        const res = await this.#internal.client.rawMethodCall('Language', 'unsubscribeFromEvents', params, [], 'ws')
        if (res.error) {
            return { error: res.error }
        }
        this.#internal.removeKeepalive(params.languageServerId)
        return { result: res.result }
    }
}

export function makeLanguageRpc(client: DecthingsClient, addKeepalive: (id: string) => void, removeKeepalive: (id: string) => void): ILanguageRpc {
    const rpc = new LanguageRpc(client, addKeepalive, removeKeepalive)
    client.on('event', (api, eventName, params, data) => {
        if (api === 'Language') {
            if (eventName === 'data') {
                params.data = data[0]
                rpc.emit(eventName, params)
            } else {
                if (eventName === 'exit') {
                    removeKeepalive(params.languageServerId)
                }
                rpc.emit(eventName, params)
            }
        }
    })
    return rpc
}

export function makeModelRpc(client: DecthingsClient): IModelRpc {
    return {
        createModel: async (params: Parameters<IModelRpc['createModel']>[0]) => {
            if (!params || typeof params !== 'object') {
                throw new Error('Invalid parameters: Expected an object.')
            }
            if (!params.executor || typeof params.executor !== 'object') {
                throw new Error('Invalid parameter "executor": Expected an object.')
            }
            if (params.executor.type === 'basedOnModelSnapshot') {
                if (!params.executor.initialState) {
                    throw new Error('Invalid parameter "executor.initialState": Expected an object.')
                }
                if (params.executor.initialState.method === 'create') {
                    const [newParamProviders, data] = convertParameterProviders(params.executor.initialState.params)
                    const newParams = { ...params }
                    newParams.executor = {
                        ...params.executor,
                        initialState: {
                            ...params.executor.initialState,
                            params: newParamProviders
                        }
                    }
                    const res = await client.rawMethodCall('Model', 'createModel', newParams, data)
                    if (res.error) {
                        return { error: res.error }
                    }
                    return { result: res.result }
                }
                if (params.executor.initialState.method === 'upload') {
                    const data = params.executor.initialState.data
                    const newParams = { ...params }
                    newParams.executor = {
                        ...params.executor,
                        initialState: {
                            ...params.executor.initialState,
                            data: undefined
                        }
                    }
                    if (!Array.isArray(data) || data.some((el) => !Buffer.isBuffer(el))) {
                        throw new Error('Invalid parameter "executor.initialState.data": Expected an array of Buffers.')
                    }
                    const res = await client.rawMethodCall('Model', 'createModel', newParams, data)
                    if (res.error) {
                        return { error: res.error }
                    }
                    return { result: res.result }
                }
            }
            const res = await client.rawMethodCall('Model', 'createModel', params, [])
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
        createState: async (params: Parameters<IModelRpc['createState']>[0]) => {
            if (!params || typeof params !== 'object') {
                throw new Error('Invalid parameters: Expected an object.')
            }
            const [newParamProviders, data] = convertParameterProviders(params.params)
            const newParams = { ...params }
            newParams.params = newParamProviders
            const res = await client.rawMethodCall('Model', 'createState', newParams, data)
            if (res.error) {
                return { error: res.error }
            }
            return { result: res.result }
        },
        uploadState: async (params: Parameters<IModelRpc['uploadState']>[0]) => {
            if (!params || typeof params !== 'object') {
                throw new Error('Invalid parameters: Expected an object.')
            }
            if (!Array.isArray(params.data) || params.data.some((el) => !Buffer.isBuffer(el))) {
                throw new Error('Invalid parameter "data": Expected an array of Buffers.')
            }
            const newParams = { ...params }
            delete newParams.data
            const res = await client.rawMethodCall('Model', 'uploadState', newParams, params.data)
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
        getModelState: async (params: Parameters<IModelRpc['getModelState']>[0]) => {
            const res = await client.rawMethodCall('Model', 'getModelState', params, [])
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
        getSnapshotState: async (params: Parameters<IModelRpc['getSnapshotState']>[0]) => {
            const res = await client.rawMethodCall('Model', 'getSnapshotState', params, [])
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
        train: async (params: Parameters<IModelRpc['train']>[0]) => {
            if (!params || typeof params !== 'object') {
                throw new Error('Invalid parameters: Expected an object.')
            }
            const [newParamProviders, data] = convertParameterProviders(params.params)
            const newParams = { ...params }
            newParams.params = newParamProviders
            const res = await client.rawMethodCall('Model', 'train', newParams, data)
            if (res.error) {
                return { error: res.error }
            }
            return { result: res.result }
        },
        getTrainingStatus: passthroughCall(client, 'Model', 'getTrainingStatus'),
        getTrainingMetrics: async (params: Parameters<IModelRpc['getTrainingMetrics']>[0]) => {
            const res = await client.rawMethodCall('Model', 'getTrainingMetrics', params, [])
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
        evaluate: async (params: Parameters<IModelRpc['evaluate']>[0]) => {
            if (!params || typeof params !== 'object') {
                throw new Error('Invalid parameters: Expected an object.')
            }
            const [newParamProviders, data] = convertParameterProviders(params.params)
            const newParams = { ...params }
            newParams.params = newParamProviders
            const res = await client.rawMethodCall('Model', 'evaluate', newParams, data)
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
        getFinishedEvaluationResult: async (params: Parameters<IModelRpc['getFinishedEvaluationResult']>[0]) => {
            const res = await client.rawMethodCall('Model', 'getFinishedEvaluationResult', params, [])
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
    async spawnCommand(params: Parameters<ISpawnedRpc['spawnCommand']>[0]) {
        if (!params || typeof params !== 'object') {
            throw new Error('Invalid parameters: Expected an object.')
        }
        const subscribed = params.subscribeToEvents !== false
        const res = await this.#internal.client.rawMethodCall('Spawned', 'spawnCommand', params, [], subscribed ? 'ws' : 'http')
        if (res.error) {
            return { error: res.error }
        }
        if (subscribed) {
            this.#internal.addKeepalive(res.result.spawnedCommandId)
        }
        return { result: res.result }
    }
    async spawnCommandForModel(params: Parameters<ISpawnedRpc['spawnCommandForModel']>[0]) {
        if (!params || typeof params !== 'object') {
            throw new Error('Invalid parameters: Expected an object.')
        }
        const subscribed = params.subscribeToEvents !== false
        const res = await this.#internal.client.rawMethodCall('Spawned', 'spawnCommandForModel', params, [], subscribed ? 'ws' : 'http')
        if (res.error) {
            return { error: res.error }
        }
        if (subscribed) {
            this.#internal.addKeepalive(res.result.spawnedCommandId)
        }
        return { result: res.result }
    }
    async terminateSpawnedCommand(params: Parameters<ISpawnedRpc['terminateSpawnedCommand']>[0]) {
        const res = await this.#internal.client.rawMethodCall('Spawned', 'terminateSpawnedCommand', params, [])
        if (res.error) {
            return { error: res.error }
        }
        return { result: res.result }
    }
    async getSpawnedCommands(params: Parameters<ISpawnedRpc['getSpawnedCommands']>[0]) {
        const res = await this.#internal.client.rawMethodCall('Spawned', 'getSpawnedCommands', params, [])
        if (res.error) {
            return { error: res.error }
        }
        return { result: res.result }
    }
    async writeToSpawnedCommand(params: Parameters<ISpawnedRpc['writeToSpawnedCommand']>[0]) {
        if (!params || typeof params !== 'object') {
            throw new Error('Invalid parameters: Expected an object.')
        }
        let data: Buffer
        if (typeof params.data === 'string') {
            data = Buffer.from(params.data)
        } else {
            if (!Buffer.isBuffer(params.data)) {
                throw new Error('Invalid parameter "data": Expected a string or Buffer.')
            }
            data = params.data
        }
        const newParams = { ...params }
        delete newParams.data
        const res = await this.#internal.client.rawMethodCall('Spawned', 'writeToSpawnedCommand', newParams, [data])
        if (res.error) {
            return { error: res.error }
        }
        return { result: res.result }
    }
    async subscribeToEvents(params: Parameters<ISpawnedRpc['subscribeToEvents']>[0]) {
        if (!params || typeof params !== 'object') {
            throw new Error('Invalid parameters: Expected an object.')
        }
        const res = await this.#internal.client.rawMethodCall('Spawned', 'subscribeToEvents', params, [], 'ws')
        if (res.error) {
            return { error: res.error }
        }
        this.#internal.addKeepalive(params.spawnedCommandId)
        return { result: res.result }
    }
    async unsubscribeFromEvents(params: Parameters<ISpawnedRpc['unsubscribeFromEvents']>[0]) {
        if (!params || typeof params !== 'object') {
            throw new Error('Invalid parameters: Expected an object.')
        }
        if (!this.#internal.client.hasWebSocket()) {
            return Promise.resolve({ error: { code: 'not_subscribed' as const } })
        }
        const res = await this.#internal.client.rawMethodCall('Spawned', 'unsubscribeFromEvents', params, [], 'ws')
        if (res.error) {
            return { error: res.error }
        }
        this.#internal.removeKeepalive(params.spawnedCommandId)
        return { result: res.result }
    }
}

export function makeSpawnedRpc(client: DecthingsClient, addKeepalive: (id: string) => void, removeKeepalive: (id: string) => void): ISpawnedRpc {
    const rpc = new SpawnedRpc(client, addKeepalive, removeKeepalive)
    client.on('event', (api, eventName, params, data) => {
        if (api === 'Spawned') {
            if (eventName === 'stdout' || eventName === 'stderr') {
                params.data = data[0]
                rpc.emit(eventName, params)
            } else {
                if (eventName === 'exit') {
                    removeKeepalive(params.spawnedCommandId)
                }
                rpc.emit(eventName, params)
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
    async launchTerminalSession(params: Parameters<ITerminalRpc['launchTerminalSession']>[0]) {
        if (!params || typeof params !== 'object') {
            throw new Error('Invalid parameters: Expected an object.')
        }
        const subscribed = params.subscribeToEvents !== false
        const res = await this.#internal.client.rawMethodCall('Terminal', 'launchTerminalSession', params, [], subscribed ? 'ws' : 'http')
        if (res.error) {
            return { error: res.error }
        }
        if (subscribed) {
            this.#internal.addKeepalive(res.result.terminalSessionId)
        }
        return { result: res.result }
    }
    async terminateTerminalSession(params: Parameters<ITerminalRpc['terminateTerminalSession']>[0]) {
        const res = await this.#internal.client.rawMethodCall('Terminal', 'terminateTerminalSession', params, [])
        if (res.error) {
            return { error: res.error }
        }
        return { result: res.result }
    }
    async getTerminalSessions(params: Parameters<ITerminalRpc['getTerminalSessions']>[0]) {
        const res = await this.#internal.client.rawMethodCall('Terminal', 'getTerminalSessions', params, [])
        if (res.error) {
            return { error: res.error }
        }
        return { result: res.result }
    }
    async writeToTerminalSession(params: Parameters<ITerminalRpc['writeToTerminalSession']>[0]) {
        if (!params || typeof params !== 'object') {
            throw new Error('Invalid parameters: Expected an object.')
        }
        let data: Buffer
        if (typeof params.data === 'string') {
            data = Buffer.from(params.data)
        } else {
            if (!Buffer.isBuffer(params.data)) {
                throw new Error('Invalid parameter "data": Expected a string or Buffer.')
            }
            data = params.data
        }
        const newParams = { ...params }
        delete newParams.data
        const res = await this.#internal.client.rawMethodCall('Terminal', 'writeToTerminalSession', newParams, [data])
        if (res.error) {
            return { error: res.error }
        }
        return { result: res.result }
    }
    async resizeTerminalSession(params: Parameters<ITerminalRpc['resizeTerminalSession']>[0]) {
        const res = await this.#internal.client.rawMethodCall('Terminal', 'resizeTerminalSession', params, [])
        if (res.error) {
            return { error: res.error }
        }
        return { result: res.result }
    }
    async addFilesystemAccessForTerminalSession(params: Parameters<ITerminalRpc['addFilesystemAccessForTerminalSession']>[0]) {
        const res = await this.#internal.client.rawMethodCall('Terminal', 'addFilesystemAccessForTerminalSession', params, [])
        if (res.error) {
            return { error: res.error }
        }
        return { result: res.result }
    }
    async subscribeToEvents(params: Parameters<ITerminalRpc['subscribeToEvents']>[0]) {
        if (!params || typeof params !== 'object') {
            throw new Error('Invalid parameters: Expected an object.')
        }
        const res = await this.#internal.client.rawMethodCall('Terminal', 'subscribeToEvents', params, [], 'ws')
        if (res.error) {
            return { error: res.error }
        }
        this.#internal.addKeepalive(params.terminalSessionId)
        return { result: res.result }
    }
    async unsubscribeFromEvents(params: Parameters<ITerminalRpc['unsubscribeFromEvents']>[0]) {
        if (!params || typeof params !== 'object') {
            throw new Error('Invalid parameters: Expected an object.')
        }
        if (!this.#internal.client.hasWebSocket()) {
            return Promise.resolve({ error: { code: 'not_subscribed' as const } })
        }
        const res = await this.#internal.client.rawMethodCall('Terminal', 'unsubscribeFromEvents', params, [], 'ws')
        if (res.error) {
            return { error: res.error }
        }
        this.#internal.removeKeepalive(params.terminalSessionId)
        return { result: res.result }
    }
}

export function makeTerminalRpc(client: DecthingsClient, addKeepalive: (id: string) => void, removeKeepalive: (id: string) => void): ITerminalRpc {
    const rpc = new TerminalRpc(client, addKeepalive, removeKeepalive)
    client.on('event', (api, eventName, params, data) => {
        if (api === 'Terminal') {
            if (eventName === 'data') {
                params.data = data[0]
                rpc.emit(eventName, params)
            } else {
                if (eventName === 'exit') {
                    removeKeepalive(params.terminalSessionId)
                }
                rpc.emit(eventName, params)
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
