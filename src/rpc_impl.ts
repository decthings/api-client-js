import { EventEmitter } from 'events'
import { Buffer } from 'buffer'
import { DatasetRpc, DebugRpc, FsRpc, ImageRpc, LanguageRpc, ModelRpc, OrganizationRpc, PersistentLauncherRpc, SpawnedRpc, TerminalRpc, UserRpc } from './rpc'
import { DecthingsParameter, DecthingsParameterProvider, DecthingsTensor } from './tensor'
import { DecthingsClient, DecthingsClientInvalidRequestError } from './client'

function serializeParameterProviders(params: DecthingsParameterProvider[]): [DecthingsParameterProvider[], Buffer[]] {
    if (!Array.isArray(params)) {
        throw new DecthingsClientInvalidRequestError('Invalid ParameterProviders: Expected an array.')
    }
    if (params.length > 255) {
        throw new DecthingsClientInvalidRequestError('Invalid ParameterProviders: Cannot provide more than 255 parameters.')
    }
    const newParams: DecthingsParameterProvider[] = []
    const data: Buffer[] = []
    params.forEach((param) => {
        if (!param) {
            throw new DecthingsClientInvalidRequestError('Invalid ParameterProviders: Expected each parameter to be an object.')
        }
        if (Array.isArray(param.data)) {
            newParams.push({ ...param, data: undefined })
            data.push(
                Buffer.concat(
                    param.data.map((x) => {
                        if (!(x instanceof DecthingsTensor)) {
                            throw new DecthingsClientInvalidRequestError(
                                'Invalid ParameterProviders: Expected each element of the field "data" to be an instance of DecthingsTensor.'
                            )
                        }
                        return x.serialize()
                    })
                )
            )
        } else {
            if (param.data.type !== 'dataset') {
                throw new DecthingsClientInvalidRequestError(
                    'Invalid ParameterProviders: Expected the field "data" of each element to be an array or an object like { type: "dataset", datasetId: string, datasetKey: string }.'
                )
            }
            newParams.push(param)
        }
    })
    return [newParams, data]
}

function serializeAddDatasetData(
    keys: {
        key: string
        data: DecthingsTensor[]
    }[]
): [string[], Buffer[]] {
    if (!Array.isArray(keys) || keys.some((key) => typeof key != 'object' || !key)) {
        throw new DecthingsClientInvalidRequestError('Invalid parameter "keys": Expected an array of objects.')
    }
    if (keys.some((key) => typeof key.key !== 'string' || !Array.isArray(key.data) || key.data.some((x) => !(x instanceof DecthingsTensor)))) {
        throw new DecthingsClientInvalidRequestError('Invalid parameter "keys": Expected an array of objects like { key: string, data: DecthingsTensor[] }.')
    }
    if (keys.length === 0) {
        throw new DecthingsClientInvalidRequestError('Invalid parameter "keys": Got zero keys, but a dataset always has at least one key.')
    }

    const numEntries = keys[0].data.length
    for (const key of keys) {
        if (key.data.length != numEntries) {
            throw new DecthingsClientInvalidRequestError(
                `Invalid parameter "keys": All keys must contain the same amount of data. Key ${keys[0].key} had ${numEntries} elements, but key ${key.key} had ${key.data.length} elements.`
            )
        }
    }
    if (numEntries > 255) {
        throw new DecthingsClientInvalidRequestError('Invalid parameter "keys": Cannot add more than 255 elements to the dataset in a single request.')
    }

    const sortedKeys = keys.map((x) => x.key).sort()
    if (new Set(sortedKeys).size != sortedKeys.length) {
        throw new DecthingsClientInvalidRequestError(`Invalid parameter "keys": Got duplicate keys. Keys were: ${sortedKeys.join(', ')}`)
    }

    const res: Buffer[] = []
    for (let i = 0; i < numEntries; i++) {
        res.push(
            ...sortedKeys.map((key) => {
                const element = keys.find((x) => x.key === key).data[i]
                return element.serialize()
            })
        )
    }

    return [sortedKeys, res]
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

export function makeDatasetRpc(client: DecthingsClient): DatasetRpc {
    return {
        createDataset: passthroughCall(client, 'Dataset', 'createDataset'),
        updateDataset: passthroughCall(client, 'Dataset', 'updateDataset'),
        deleteDataset: passthroughCall(client, 'Dataset', 'deleteDataset'),
        getDatasets: passthroughCall(client, 'Dataset', 'getDatasets'),
        addEntries: async (params: Parameters<DatasetRpc['addEntries']>[0]): ReturnType<DatasetRpc['addEntries']> => {
            if (!params || typeof params !== 'object') {
                throw new DecthingsClientInvalidRequestError('Invalid parameters: Expected an object.')
            }
            const [keys, serialized] = serializeAddDatasetData(params.keys)
            const newParams: Omit<typeof params, 'keys'> & { keys: string[] } = {
                ...params,
                keys
            }
            const res = await client.rawMethodCall('Dataset', 'addEntries', newParams, serialized)
            if (res.error) {
                return { error: res.error }
            }
            return { result: res.result }
        },
        addEntriesToNeedsReview: async (params: Parameters<DatasetRpc['addEntriesToNeedsReview']>[0]): ReturnType<DatasetRpc['addEntriesToNeedsReview']> => {
            if (!params || typeof params !== 'object') {
                throw new DecthingsClientInvalidRequestError('Invalid parameters: Expected an object.')
            }
            const [keys, serialized] = serializeAddDatasetData(params.keys)
            const newParams: Omit<typeof params, 'keys'> & { keys: string[] } = {
                ...params,
                keys
            }
            const res = await client.rawMethodCall('Dataset', 'addEntriesToNeedsReview', newParams, serialized)
            if (res.error) {
                return { error: res.error }
            }
            return { result: res.result }
        },
        finalizeNeedsReviewEntries: async (
            params: Parameters<DatasetRpc['finalizeNeedsReviewEntries']>[0]
        ): ReturnType<DatasetRpc['finalizeNeedsReviewEntries']> => {
            if (!params || typeof params !== 'object') {
                throw new DecthingsClientInvalidRequestError('Invalid parameters: Expected an object.')
            }
            const [keys, serialized] = serializeAddDatasetData(params.keys)
            const newParams: Omit<typeof params, 'keys'> & { keys: string[] } = {
                ...params,
                keys
            }

            const res = await client.rawMethodCall('Dataset', 'finalizeNeedsReviewEntries', newParams, serialized)

            if (res.error) {
                return { error: res.error }
            }
            return { result: res.result }
        },
        getEntries: async (params: Parameters<DatasetRpc['getEntries']>[0]): ReturnType<DatasetRpc['getEntries']> => {
            const res = await client.rawMethodCall('Dataset', 'getEntries', params, [])
            if (res.data.length === 0 || !res.result) {
                return res.result ? { result: res.result } : { error: res.error }
            }

            const keys: Awaited<ReturnType<DatasetRpc['getEntries']>>['result']['keys'] = res.result.keys.map((key: string) => ({ name: key, data: [] }))

            let pos = 0
            for (const index of res.result.indexes) {
                for (let i = 0; i < keys.length; i++) {
                    keys[i].data.push({ index, data: DecthingsTensor.deserialize(res.data[pos])[0] })
                    pos += 1
                }
            }
            delete res.result.indexes

            return {
                result: {
                    ...res.result,
                    keys
                }
            }
        },
        getNeedsReviewEntries: async (params: Parameters<DatasetRpc['getNeedsReviewEntries']>[0]): ReturnType<DatasetRpc['getNeedsReviewEntries']> => {
            const res = await client.rawMethodCall('Dataset', 'getNeedsReviewEntries', params, [])
            if (res.data.length === 0 || !res.result) {
                return res.result ? { result: res.result } : { error: res.error }
            }

            const keys: Awaited<ReturnType<DatasetRpc['getEntries']>>['result']['keys'] = res.result.keys.map((key: string) => ({ name: key, data: [] }))

            let pos = 0
            for (const index of res.result.indexes) {
                for (let i = 0; i < keys.length; i++) {
                    keys[i].data.push({ index, data: DecthingsTensor.deserialize(res.data[pos])[0] })
                    pos += 1
                }
            }
            delete res.result.indexes

            return {
                result: {
                    ...res.result,
                    keys
                }
            }
        },
        removeEntries: passthroughCall(client, 'Dataset', 'removeEntries'),
        removeNeedsReviewEntries: passthroughCall(client, 'Dataset', 'removeNeedsReviewEntries')
    }
}

class DebugRpcImpl extends EventEmitter implements DebugRpc {
    _internal: {
        client: DecthingsClient
        addKeepalive: (id: string) => void
        removeKeepalive: (id: string) => void
    }
    constructor(client: DecthingsClient, addKeepalive: (id: string) => void, removeKeepalive: (id: string) => void) {
        super()
        this._internal = {
            client,
            addKeepalive,
            removeKeepalive
        }
    }
    async launchDebugSession(params: Parameters<DebugRpc['launchDebugSession']>[0]): ReturnType<DebugRpc['launchDebugSession']> {
        if (!params || typeof params !== 'object') {
            throw new DecthingsClientInvalidRequestError('Invalid parameters: Expected an object.')
        }
        const subscribed = params.subscribeToEvents !== false
        const res = await this._internal.client.rawMethodCall('Debug', 'launchDebugSession', params, [], subscribed ? 'ws' : 'http')
        if (subscribed && res.result) {
            this._internal.addKeepalive(res.result.debugSessionId)
        }
        return res.result ? { result: res.result } : { error: res.error }
    }
    async getDebugSessions(params: Parameters<DebugRpc['getDebugSessions']>[0]): ReturnType<DebugRpc['getDebugSessions']> {
        const res = await this._internal.client.rawMethodCall('Debug', 'getDebugSessions', params, [])
        if (res.error) {
            return { error: res.error }
        }
        return { result: res.result }
    }
    async terminateDebugSession(params: Parameters<DebugRpc['terminateDebugSession']>[0]): ReturnType<DebugRpc['terminateDebugSession']> {
        const res = await this._internal.client.rawMethodCall('Debug', 'terminateDebugSession', params, [])
        if (res.error) {
            return { error: res.error }
        }
        return { result: res.result }
    }
    async callInitializeWeights(params: Parameters<DebugRpc['callInitializeWeights']>[0]): ReturnType<DebugRpc['callInitializeWeights']> {
        if (!params || typeof params !== 'object') {
            throw new DecthingsClientInvalidRequestError('Invalid parameters: Expected an object.')
        }
        const [newParamProviders, data] = serializeParameterProviders(params.params)
        const newParams = { ...params }
        newParams.params = newParamProviders
        const res = await this._internal.client.rawMethodCall('Debug', 'callCreateModelState', newParams, data)
        if (res.error) {
            return { error: res.error }
        }
        return { result: res.result }
    }
    async callInstantiateModel(params: Parameters<DebugRpc['callInstantiateModel']>[0]): ReturnType<DebugRpc['callInstantiateModel']> {
        if (!params || typeof params !== 'object') {
            throw new DecthingsClientInvalidRequestError('Invalid parameters: Expected an object.')
        }
        if (!params.weights || typeof params.weights !== 'object') {
            throw new DecthingsClientInvalidRequestError('Invalid parameter "weights": Expected an object.')
        }
        const newParams = { ...params }
        let dataToSend: Buffer[]
        if (params.weights.type === 'data') {
            if (
                !Array.isArray(params.weights.data) ||
                params.weights.data.some((el) => el === null || !el || typeof el.key !== 'string' || !Buffer.isBuffer(el.data))
            ) {
                throw new DecthingsClientInvalidRequestError(
                    'Invalid parameter "weights": For type="data", expected the field "data" to be an array of objects like { key: string, data: Buffer }.'
                )
            }
            dataToSend = params.weights.data.map((x) => x.data)
            newParams.weights = { ...params.weights }
            delete newParams.weights.data
            ;(newParams as any).weightKeyNames = params.weights.data.map((x) => x.key)
        } else {
            dataToSend = []
        }

        const res = await this._internal.client.rawMethodCall('Debug', 'callInstantiateModel', newParams, dataToSend)
        if (res.error) {
            return { error: res.error }
        }
        return { result: res.result }
    }
    async callTrain(params: Parameters<DebugRpc['callTrain']>[0]): ReturnType<DebugRpc['callTrain']> {
        if (!params || typeof params !== 'object') {
            throw new DecthingsClientInvalidRequestError('Invalid parameters: Expected an object.')
        }
        const [newParamProviders, data] = serializeParameterProviders(params.params)
        const newParams = { ...params }
        newParams.params = newParamProviders
        const res = await this._internal.client.rawMethodCall('Debug', 'callTrain', newParams, data)
        if (res.error) {
            return { error: res.error }
        }
        return { result: res.result }
    }
    async getTrainingStatus(params: Parameters<DebugRpc['getTrainingStatus']>[0]): ReturnType<DebugRpc['getTrainingStatus']> {
        const res = await this._internal.client.rawMethodCall('Debug', 'getTrainingStatus', params, [])
        if (res.error) {
            return { error: res.error }
        }
        return { result: res.result }
    }
    async getTrainingMetrics(params: Parameters<DebugRpc['getTrainingMetrics']>[0]): ReturnType<DebugRpc['getTrainingMetrics']> {
        const res = await this._internal.client.rawMethodCall('Debug', 'getTrainingMetrics', params, [])
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
                                data: DecthingsTensor.deserialize(res.data[pos])[0]
                            }
                            pos += 1
                            return newEntry
                        })
                    }
                })
            }
        }
    }
    async cancelTrainingSession(params: Parameters<DebugRpc['cancelTrainingSession']>[0]): ReturnType<DebugRpc['cancelTrainingSession']> {
        const res = await this._internal.client.rawMethodCall('Debug', 'cancelTrainingSession', params, [])
        if (res.error) {
            return { error: res.error }
        }
        return { result: res.result }
    }
    async callEvaluate(params: Parameters<DebugRpc['callEvaluate']>[0]): ReturnType<DebugRpc['callEvaluate']> {
        if (!params || typeof params !== 'object') {
            throw new DecthingsClientInvalidRequestError('Invalid parameters: Expected an object.')
        }
        const [newParamProviders, data] = serializeParameterProviders(params.params)
        const newParams = { ...params }
        newParams.params = newParamProviders
        const res = await this._internal.client.rawMethodCall('Debug', 'callEvaluate', newParams, data)
        if (res.data.length === 0 || res.error) {
            return res.result ? { result: res.result } : { error: res.error }
        }
        let pos = 0
        const newOutput: DecthingsParameter[] = res.result.output.map((el: { name: string }): DecthingsParameter => {
            const data = DecthingsTensor.deserializeMany(res.data[pos])
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
    async callGetWeights(params: Parameters<DebugRpc['callGetWeights']>[0]): ReturnType<DebugRpc['callGetWeights']> {
        const res = await this._internal.client.rawMethodCall('Debug', 'callGetWeights', params, [])
        if (res.error) {
            return { error: res.error }
        }
        return { result: res.result }
    }
    async downloadWeightData(params: Parameters<DebugRpc['downloadWeightData']>[0]): ReturnType<DebugRpc['downloadWeightData']> {
        const res = await this._internal.client.rawMethodCall('Debug', 'downloadWeightData', params, [])
        if (res.data.length === 0 || res.error) {
            return res.result ? { result: res.result } : { error: res.error }
        }
        const result = {
            ...res.result,
            data: res.data.map((x, idx) => ({ key: res.result.weightKeyNames[idx], data: x }))
        }
        delete result.weightKeyNames
        return {
            result
        }
    }
    async sendToRemoteInspector(params: Parameters<DebugRpc['sendToRemoteInspector']>[0]): ReturnType<DebugRpc['sendToRemoteInspector']> {
        if (!params || typeof params !== 'object') {
            throw new DecthingsClientInvalidRequestError('Invalid parameters: Expected an object.')
        }
        let data: Buffer
        if (typeof params.data === 'string') {
            data = Buffer.from(params.data)
        } else {
            if (!Buffer.isBuffer(params.data)) {
                throw new DecthingsClientInvalidRequestError('Invalid parameter "data": Expected a string or Buffer.')
            }
            data = params.data
        }
        const newParams = { ...params }
        delete newParams.data
        const res = await this._internal.client.rawMethodCall('Debug', 'sendToRemoteInspector', params, [data])
        if (res.error) {
            return { error: res.error }
        }
        return { result: res.result }
    }
    async subscribeToEvents(params: Parameters<DebugRpc['subscribeToEvents']>[0]): ReturnType<DebugRpc['subscribeToEvents']> {
        if (!params || typeof params !== 'object') {
            throw new DecthingsClientInvalidRequestError('Invalid parameters: Expected an object.')
        }
        const res = await this._internal.client.rawMethodCall('Debug', 'subscribeToEvents', params, [], 'ws')
        if (res.error) {
            return { error: res.error }
        }
        this._internal.addKeepalive(params.debugSessionId)
        return { result: res.result }
    }
    async unsubscribeFromEvents(params: Parameters<DebugRpc['unsubscribeFromEvents']>[0]): ReturnType<DebugRpc['unsubscribeFromEvents']> {
        if (!params || typeof params !== 'object') {
            throw new DecthingsClientInvalidRequestError('Invalid parameters: Expected an object.')
        }
        const res = await this._internal.client.rawMethodCall('Debug', 'unsubscribeFromEvents', params, [], 'wsIfAvailableOtherwiseNone')
        if (res.error) {
            return { error: res.error }
        }
        this._internal.removeKeepalive(params.debugSessionId)
        if (res.notCalled) {
            return { error: { code: 'not_subscribed' } }
        }
        return { result: res.result }
    }
}

export function makeDebugRpc(client: DecthingsClient, addKeepalive: (id: string) => void, removeKeepalive: (id: string) => void): DebugRpc {
    const rpc = new DebugRpcImpl(client, addKeepalive, removeKeepalive)
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

export function makeFsRpc(client: DecthingsClient): FsRpc {
    return {
        lookup: async (params: Parameters<FsRpc['lookup']>[0]): ReturnType<FsRpc['lookup']> => {
            if (!params || typeof params !== 'object') {
                throw new DecthingsClientInvalidRequestError('Invalid parameters: Expected an object.')
            }
            const newParams = { ...params }
            if (typeof params.name === 'string') {
                newParams.name = Buffer.from(params.name).toString('base64')
            } else {
                if (!Buffer.isBuffer(params.name)) {
                    throw new DecthingsClientInvalidRequestError('Invalid parameter "name": Expected a string or Buffer.')
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
        mknod: async (params: Parameters<FsRpc['mknod']>[0]): ReturnType<FsRpc['mknod']> => {
            if (!params || typeof params !== 'object') {
                throw new DecthingsClientInvalidRequestError('Invalid parameters: Expected an object.')
            }
            const newParams = { ...params }
            if (typeof params.name === 'string') {
                newParams.name = Buffer.from(params.name).toString('base64')
            } else {
                if (!Buffer.isBuffer(params.name)) {
                    throw new DecthingsClientInvalidRequestError('Invalid parameter "name": Expected a string or Buffer.')
                }
                newParams.name = params.name.toString('base64')
            }
            const res = await client.rawMethodCall('FS', 'mknod', newParams, [])
            if (res.error) {
                return { error: res.error }
            }
            return { result: res.result }
        },
        read: async (params: Parameters<FsRpc['read']>[0]): ReturnType<FsRpc['read']> => {
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
        write: async (params: Parameters<FsRpc['write']>[0]): ReturnType<FsRpc['write']> => {
            if (!params || typeof params !== 'object') {
                throw new DecthingsClientInvalidRequestError('Invalid parameters: Expected an object.')
            }
            const newParams = { ...params }
            if (!Buffer.isBuffer(params.data)) {
                throw new DecthingsClientInvalidRequestError('Invalid parameter "data": Expected a Buffer.')
            }
            delete newParams.data
            const res = await client.rawMethodCall('FS', 'write', newParams, [params.data])
            if (res.error) {
                return { error: res.error }
            }
            return { result: res.result }
        },
        symlink: async (params: Parameters<FsRpc['symlink']>[0]): ReturnType<FsRpc['symlink']> => {
            if (!params || typeof params !== 'object') {
                throw new DecthingsClientInvalidRequestError('Invalid parameters: Expected an object.')
            }
            const newParams = { ...params }
            if (typeof params.name === 'string') {
                newParams.name = Buffer.from(params.name).toString('base64')
            } else {
                if (!Buffer.isBuffer(params.name)) {
                    throw new DecthingsClientInvalidRequestError('Invalid parameter "name": Expected a string or Buffer.')
                }
                newParams.name = params.name.toString('base64')
            }
            if (typeof params.link === 'string') {
                newParams.link = Buffer.from(params.link).toString('base64')
            } else {
                if (!Buffer.isBuffer(params.link)) {
                    throw new DecthingsClientInvalidRequestError('Invalid parameter "link": Expected a string or Buffer.')
                }
                newParams.link = params.link.toString('base64')
            }
            const res = await client.rawMethodCall('FS', 'symlink', newParams, [])
            if (res.error) {
                return { error: res.error }
            }
            return { result: res.result }
        },
        readlink: async (params: Parameters<FsRpc['readlink']>[0]): ReturnType<FsRpc['readlink']> => {
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
        mkdir: async (params: Parameters<FsRpc['mkdir']>[0]): ReturnType<FsRpc['mkdir']> => {
            if (!params || typeof params !== 'object') {
                throw new DecthingsClientInvalidRequestError('Invalid parameters: Expected an object.')
            }
            const newParams = { ...params }
            if (typeof params.name === 'string') {
                newParams.name = Buffer.from(params.name).toString('base64')
            } else {
                if (!Buffer.isBuffer(params.name)) {
                    throw new DecthingsClientInvalidRequestError('Invalid parameter "name": Expected a string or Buffer.')
                }
                newParams.name = params.name.toString('base64')
            }
            const res = await client.rawMethodCall('FS', 'mkdir', newParams, [])
            if (res.error) {
                return { error: res.error }
            }
            return { result: res.result }
        },
        unlink: async (params: Parameters<FsRpc['unlink']>[0]): ReturnType<FsRpc['unlink']> => {
            if (!params || typeof params !== 'object') {
                throw new DecthingsClientInvalidRequestError('Invalid parameters: Expected an object.')
            }
            const newParams = { ...params }
            if (typeof params.name === 'string') {
                newParams.name = Buffer.from(params.name).toString('base64')
            } else {
                if (!Buffer.isBuffer(params.name)) {
                    throw new DecthingsClientInvalidRequestError('Invalid parameter "name": Expected a string or Buffer.')
                }
                newParams.name = params.name.toString('base64')
            }
            const res = await client.rawMethodCall('FS', 'unlink', newParams, [])
            if (res.error) {
                return { error: res.error }
            }
            return { result: res.result }
        },
        rmdir: async (params: Parameters<FsRpc['rmdir']>[0]): ReturnType<FsRpc['rmdir']> => {
            if (!params || typeof params !== 'object') {
                throw new DecthingsClientInvalidRequestError('Invalid parameters: Expected an object.')
            }
            const newParams = { ...params }
            if (typeof params.name === 'string') {
                newParams.name = Buffer.from(params.name).toString('base64')
            } else {
                if (!Buffer.isBuffer(params.name)) {
                    throw new DecthingsClientInvalidRequestError('Invalid parameter "name": Expected a string or Buffer.')
                }
                newParams.name = params.name.toString('base64')
            }
            const res = await client.rawMethodCall('FS', 'rmdir', newParams, [])
            if (res.error) {
                return { error: res.error }
            }
            return { result: res.result }
        },
        rename: async (params: Parameters<FsRpc['rename']>[0]): ReturnType<FsRpc['rename']> => {
            if (!params || typeof params !== 'object') {
                throw new DecthingsClientInvalidRequestError('Invalid parameters: Expected an object.')
            }
            const newParams = { ...params }
            if (typeof params.name === 'string') {
                newParams.name = Buffer.from(params.name).toString('base64')
            } else {
                if (!Buffer.isBuffer(params.name)) {
                    throw new DecthingsClientInvalidRequestError('Invalid parameter "name": Expected a string or Buffer.')
                }
                newParams.name = params.name.toString('base64')
            }
            if (typeof params.newname === 'string') {
                newParams.newname = Buffer.from(params.newname).toString('base64')
            } else {
                if (!Buffer.isBuffer(params.newname)) {
                    throw new DecthingsClientInvalidRequestError('Invalid parameter "newname": Expected a string or Buffer.')
                }
                newParams.newname = params.newname.toString('base64')
            }
            const res = await client.rawMethodCall('FS', 'rename', newParams, [])
            if (res.error) {
                return { error: res.error }
            }
            return { result: res.result }
        },
        link: async (params: Parameters<FsRpc['link']>[0]): ReturnType<FsRpc['link']> => {
            if (!params || typeof params !== 'object') {
                throw new DecthingsClientInvalidRequestError('Invalid parameters: Expected an object.')
            }
            const newParams = { ...params }
            if (typeof params.newname === 'string') {
                newParams.newname = Buffer.from(params.newname).toString('base64')
            } else {
                if (!Buffer.isBuffer(params.newname)) {
                    throw new DecthingsClientInvalidRequestError('Invalid parameter "newname": Expected a string or Buffer.')
                }
                newParams.newname = params.newname.toString('base64')
            }
            const res = await client.rawMethodCall('FS', 'link', newParams, [])
            if (res.error) {
                return { error: res.error }
            }
            return { result: res.result }
        },
        readdir: async (params: Parameters<FsRpc['readdir']>[0]): ReturnType<FsRpc['readdir']> => {
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
        rmdirAll: async (params: Parameters<FsRpc['rmdirAll']>[0]): ReturnType<FsRpc['rmdirAll']> => {
            if (!params || typeof params !== 'object') {
                throw new DecthingsClientInvalidRequestError('Invalid parameters: Expected an object.')
            }
            const newParams = { ...params }
            if (typeof params.name === 'string') {
                newParams.name = Buffer.from(params.name).toString('base64')
            } else {
                if (!Buffer.isBuffer(params.name)) {
                    throw new DecthingsClientInvalidRequestError('Invalid parameter "name": Expected a string or Buffer.')
                }
                newParams.name = params.name.toString('base64')
            }
            const res = await client.rawMethodCall('FS', 'rmdirAll', newParams, [])
            if (res.error) {
                return { error: res.error }
            }
            return { result: res.result }
        },
        copy: async (params: Parameters<FsRpc['copy']>[0]): ReturnType<FsRpc['copy']> => {
            if (!params || typeof params !== 'object') {
                throw new DecthingsClientInvalidRequestError('Invalid parameters: Expected an object.')
            }
            const newParams = { ...params }
            if (typeof params.newname === 'string') {
                newParams.newname = Buffer.from(params.newname).toString('base64')
            } else {
                if (!Buffer.isBuffer(params.newname)) {
                    throw new DecthingsClientInvalidRequestError('Invalid parameter "newname": Expected a string or Buffer.')
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

export function makeImageRpc(client: DecthingsClient): ImageRpc {
    return {
        createRepository: passthroughCall(client, 'Image', 'createRepository'),
        updateRepository: passthroughCall(client, 'Image', 'updateRepository'),
        deleteRepository: passthroughCall(client, 'Image', 'deleteRepository'),
        getRepositories: passthroughCall(client, 'Image', 'getRepositories')
    }
}

class LanguageRpcImpl extends EventEmitter implements LanguageRpc {
    _internal: {
        client: DecthingsClient
        addKeepalive: (id: string) => void
        removeKeepalive: (id: string) => void
    }
    constructor(client: DecthingsClient, addKeepalive: (id: string) => void, removeKeepalive: (id: string) => void) {
        super()
        this._internal = {
            client,
            addKeepalive,
            removeKeepalive
        }
    }
    async startLanguageServer(params: Parameters<LanguageRpc['startLanguageServer']>[0]): ReturnType<LanguageRpc['startLanguageServer']> {
        const res = await this._internal.client.rawMethodCall('Language', 'startLanguageServer', params, [], 'ws')
        if (res.error) {
            return { error: res.error }
        }
        this._internal.addKeepalive(res.result.languageServerId)
        return { result: res.result }
    }
    async writeToLanguageServer(params: Parameters<LanguageRpc['writeToLanguageServer']>[0]): ReturnType<LanguageRpc['writeToLanguageServer']> {
        if (!params || typeof params !== 'object') {
            throw new DecthingsClientInvalidRequestError('Invalid parameters: Expected an object.')
        }
        if (!Buffer.isBuffer(params.data)) {
            throw new DecthingsClientInvalidRequestError('Invalid data: Expected a Buffer.')
        }
        const newParams = { ...params }
        delete newParams.data
        const res = await this._internal.client.rawMethodCall('Language', 'writeToLanguageServer', newParams, [params.data], 'ws')
        if (res.error) {
            return { error: res.error }
        }
        return { result: res.result }
    }
    async unsubscribeFromEvents(params: Parameters<LanguageRpc['unsubscribeFromEvents']>[0]): ReturnType<LanguageRpc['unsubscribeFromEvents']> {
        if (!params || typeof params !== 'object') {
            throw new DecthingsClientInvalidRequestError('Invalid parameters: Expected an object.')
        }
        const res = await this._internal.client.rawMethodCall('Language', 'unsubscribeFromEvents', params, [], 'wsIfAvailableOtherwiseNone')
        if (res.error) {
            return { error: res.error }
        }
        this._internal.removeKeepalive(params.languageServerId)
        if (res.notCalled) {
            return { error: { code: 'not_subscribed' } }
        }
        return { result: res.result }
    }
}

export function makeLanguageRpc(client: DecthingsClient, addKeepalive: (id: string) => void, removeKeepalive: (id: string) => void): LanguageRpc {
    const rpc = new LanguageRpcImpl(client, addKeepalive, removeKeepalive)
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

export function makeModelRpc(client: DecthingsClient): ModelRpc {
    return {
        createModel: passthroughCall(client, 'Model', 'createModel'),
        deleteModel: passthroughCall(client, 'Model', 'deleteModel'),
        updateModel: passthroughCall(client, 'Model', 'updateModel'),
        getModels: passthroughCall(client, 'Model', 'getModels'),
        setFilesystemSize: passthroughCall(client, 'Model', 'setFilesystemSize'),
        createModelVersion: async (params: Parameters<ModelRpc['createModelVersion']>[0]): ReturnType<ModelRpc['createModelVersion']> => {
            if (!params || typeof params !== 'object') {
                throw new DecthingsClientInvalidRequestError('Invalid parameters: Expected an object.')
            }
            const [newParamProviders, data] = serializeParameterProviders(params.params)
            const newParams = { ...params }
            newParams.params = newParamProviders
            const res = await client.rawMethodCall('Model', 'createModelVersion', newParams, data)
            if (res.error) {
                return { error: res.error }
            }
            return { result: res.result }
        },
        createModelVersionUploadWeights: async (
            params: Parameters<ModelRpc['createModelVersionUploadWeights']>[0]
        ): ReturnType<ModelRpc['createModelVersionUploadWeights']> => {
            if (!params || typeof params !== 'object') {
                throw new DecthingsClientInvalidRequestError('Invalid parameters: Expected an object.')
            }
            if (
                !Array.isArray(params.data) ||
                params.data.some((el) => !el || typeof el !== 'object' || typeof el.key !== 'string' || !Buffer.isBuffer(el.data))
            ) {
                throw new DecthingsClientInvalidRequestError('Invalid parameter "data": Expected an array of objects like { key: string, data: Buffer }.')
            }
            const newParams = { ...params }
            delete newParams.data
            ;(newParams as any).stateKeyNames = params.data.map((x) => x.key)
            const res = await client.rawMethodCall(
                'Model',
                'createModelVersionUploadWeights',
                newParams,
                params.data.map((x) => x.data)
            )
            if (res.error) {
                return { error: res.error }
            }
            return { result: res.result }
        },
        updateModelVersion: passthroughCall(client, 'Model', 'updateModelVersion'),
        getWeights: async (params: Parameters<ModelRpc['getWeights']>[0]): ReturnType<ModelRpc['getWeights']> => {
            const res = await client.rawMethodCall('Model', 'getWeights', params, [])
            if (res.data.length === 0 || res.error) {
                return res.result ? { result: res.result } : { error: res.error }
            }
            const result = {
                ...res.result,
                data: res.data.map((x, idx) => ({ key: res.result.stateKeyNames[idx], data: x }))
            }
            delete result.stateKeyNames
            return {
                result
            }
        },
        deleteModelVersion: passthroughCall(client, 'Model', 'deleteModelVersion'),
        train: async (params: Parameters<ModelRpc['train']>[0]): ReturnType<ModelRpc['train']> => {
            if (!params || typeof params !== 'object') {
                throw new DecthingsClientInvalidRequestError('Invalid parameters: Expected an object.')
            }
            const [newParamProviders, data] = serializeParameterProviders(params.params)
            const newParams = { ...params }
            newParams.params = newParamProviders
            const res = await client.rawMethodCall('Model', 'train', newParams, data)
            if (res.error) {
                return { error: res.error }
            }
            return { result: res.result }
        },
        getTrainingStatus: passthroughCall(client, 'Model', 'getTrainingStatus'),
        getTrainingMetrics: async (params: Parameters<ModelRpc['getTrainingMetrics']>[0]): ReturnType<ModelRpc['getTrainingMetrics']> => {
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
                                    data: DecthingsTensor.deserialize(res.data[pos])[0]
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
        evaluate: async (params: Parameters<ModelRpc['evaluate']>[0]): ReturnType<ModelRpc['evaluate']> => {
            if (!params || typeof params !== 'object') {
                throw new DecthingsClientInvalidRequestError('Invalid parameters: Expected an object.')
            }
            const [newParamProviders, data] = serializeParameterProviders(params.params)
            const newParams = { ...params }
            newParams.params = newParamProviders
            const res = await client.rawMethodCall('Model', 'evaluate', newParams, data)
            if (res.data.length === 0 || res.error || !res.result.success) {
                return res.result ? { result: res.result } : { error: res.error }
            }
            let pos = 0
            const newOutput: DecthingsParameter[] = res.result.success.output.map((el: { name: string }): DecthingsParameter => {
                const data = DecthingsTensor.deserializeMany(res.data[pos])
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
        getFinishedEvaluationResult: async (
            params: Parameters<ModelRpc['getFinishedEvaluationResult']>[0]
        ): ReturnType<ModelRpc['getFinishedEvaluationResult']> => {
            const res = await client.rawMethodCall('Model', 'getFinishedEvaluationResult', params, [])
            if (res.data.length === 0 || res.error || !res.result.evaluationSuccess) {
                return res.result ? { result: res.result } : { error: res.error }
            }
            let pos = 0
            const newOutput: DecthingsParameter[] = res.result.evaluationSuccess.output.map((el: { name: string }): DecthingsParameter => {
                const data = DecthingsTensor.deserializeMany(res.data[pos])
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

export function makeOrganizationRpc(client: DecthingsClient): OrganizationRpc {
    return {
        createOrganization: passthroughCall(client, 'Organization', 'createOrganization'),
        getOrganizations: passthroughCall(client, 'Organization', 'getOrganizations'),
        inviteUsersToOrganization: passthroughCall(client, 'Organization', 'inviteUsersToOrganization'),
        removeUsersFromOrganization: passthroughCall(client, 'Organization', 'removeUsersFromOrganization'),
        respondToOrganizationInvitation: passthroughCall(client, 'Organization', 'respondToOrganizationInvitation'),
        assignRoles: passthroughCall(client, 'Organization', 'assignRoles'),
        deleteOrganization: passthroughCall(client, 'Organization', 'deleteOrganization')
    }
}

export function makePersistentLauncherRpc(client: DecthingsClient): PersistentLauncherRpc {
    return {
        createPersistentLauncher: passthroughCall(client, 'PersistentLauncher', 'createPersistentLauncher'),
        getPersistentLaunchers: passthroughCall(client, 'PersistentLauncher', 'getPersistentLaunchers'),
        getSysinfo: passthroughCall(client, 'PersistentLauncher', 'getSysinfo'),
        deletePersistentLauncher: passthroughCall(client, 'PersistentLauncher', 'deletePersistentLauncher')
    }
}

class SpawnedRpcImpl extends EventEmitter implements SpawnedRpc {
    _internal: {
        client: DecthingsClient
        addKeepalive: (id: string) => void
        removeKeepalive: (id: string) => void
    }
    constructor(client: DecthingsClient, addKeepalive: (id: string) => void, removeKeepalive: (id: string) => void) {
        super()
        this._internal = {
            client,
            addKeepalive,
            removeKeepalive
        }
    }
    async spawnCommand(params: Parameters<SpawnedRpc['spawnCommand']>[0]): ReturnType<SpawnedRpc['spawnCommand']> {
        if (!params || typeof params !== 'object') {
            throw new DecthingsClientInvalidRequestError('Invalid parameters: Expected an object.')
        }
        const subscribed = params.subscribeToEvents !== false
        const res = await this._internal.client.rawMethodCall('Spawned', 'spawnCommand', params, [], subscribed ? 'ws' : 'http')
        if (res.error) {
            return { error: res.error }
        }
        if (subscribed) {
            this._internal.addKeepalive(res.result.spawnedCommandId)
        }
        return { result: res.result }
    }
    async spawnCommandForModel(params: Parameters<SpawnedRpc['spawnCommandForModel']>[0]): ReturnType<SpawnedRpc['spawnCommandForModel']> {
        if (!params || typeof params !== 'object') {
            throw new DecthingsClientInvalidRequestError('Invalid parameters: Expected an object.')
        }
        const subscribed = params.subscribeToEvents !== false
        const res = await this._internal.client.rawMethodCall('Spawned', 'spawnCommandForModel', params, [], subscribed ? 'ws' : 'http')
        if (res.error) {
            return { error: res.error }
        }
        if (subscribed) {
            this._internal.addKeepalive(res.result.spawnedCommandId)
        }
        return { result: res.result }
    }
    async terminateSpawnedCommand(params: Parameters<SpawnedRpc['terminateSpawnedCommand']>[0]): ReturnType<SpawnedRpc['terminateSpawnedCommand']> {
        const res = await this._internal.client.rawMethodCall('Spawned', 'terminateSpawnedCommand', params, [])
        if (res.error) {
            return { error: res.error }
        }
        return { result: res.result }
    }
    async getSpawnedCommands(params: Parameters<SpawnedRpc['getSpawnedCommands']>[0]): ReturnType<SpawnedRpc['getSpawnedCommands']> {
        const res = await this._internal.client.rawMethodCall('Spawned', 'getSpawnedCommands', params, [])
        if (res.error) {
            return { error: res.error }
        }
        return { result: res.result }
    }
    async writeToSpawnedCommand(params: Parameters<SpawnedRpc['writeToSpawnedCommand']>[0]): ReturnType<SpawnedRpc['writeToSpawnedCommand']> {
        if (!params || typeof params !== 'object') {
            throw new DecthingsClientInvalidRequestError('Invalid parameters: Expected an object.')
        }
        let data: Buffer
        if (typeof params.data === 'string') {
            data = Buffer.from(params.data)
        } else {
            if (!Buffer.isBuffer(params.data)) {
                throw new DecthingsClientInvalidRequestError('Invalid parameter "data": Expected a string or Buffer.')
            }
            data = params.data
        }
        const newParams = { ...params }
        delete newParams.data
        const res = await this._internal.client.rawMethodCall('Spawned', 'writeToSpawnedCommand', newParams, [data])
        if (res.error) {
            return { error: res.error }
        }
        return { result: res.result }
    }
    async subscribeToEvents(params: Parameters<SpawnedRpc['subscribeToEvents']>[0]): ReturnType<SpawnedRpc['subscribeToEvents']> {
        if (!params || typeof params !== 'object') {
            throw new DecthingsClientInvalidRequestError('Invalid parameters: Expected an object.')
        }
        const res = await this._internal.client.rawMethodCall('Spawned', 'subscribeToEvents', params, [], 'ws')
        if (res.error) {
            return { error: res.error }
        }
        this._internal.addKeepalive(params.spawnedCommandId)
        return { result: res.result }
    }
    async unsubscribeFromEvents(params: Parameters<SpawnedRpc['unsubscribeFromEvents']>[0]): ReturnType<SpawnedRpc['unsubscribeFromEvents']> {
        if (!params || typeof params !== 'object') {
            throw new DecthingsClientInvalidRequestError('Invalid parameters: Expected an object.')
        }
        const res = await this._internal.client.rawMethodCall('Spawned', 'unsubscribeFromEvents', params, [], 'wsIfAvailableOtherwiseNone')
        if (res.error) {
            return { error: res.error }
        }
        this._internal.removeKeepalive(params.spawnedCommandId)
        if (res.notCalled) {
            return { error: { code: 'not_subscribed' } }
        }
        return { result: res.result }
    }
}

export function makeSpawnedRpc(client: DecthingsClient, addKeepalive: (id: string) => void, removeKeepalive: (id: string) => void): SpawnedRpc {
    const rpc = new SpawnedRpcImpl(client, addKeepalive, removeKeepalive)
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

class TerminalRpcImpl extends EventEmitter implements TerminalRpc {
    _internal: {
        client: DecthingsClient
        addKeepalive: (id: string) => void
        removeKeepalive: (id: string) => void
    }
    constructor(client: DecthingsClient, addKeepalive: (id: string) => void, removeKeepalive: (id: string) => void) {
        super()
        this._internal = {
            client,
            addKeepalive,
            removeKeepalive
        }
    }
    async launchTerminalSession(params: Parameters<TerminalRpc['launchTerminalSession']>[0]): ReturnType<TerminalRpc['launchTerminalSession']> {
        if (!params || typeof params !== 'object') {
            throw new DecthingsClientInvalidRequestError('Invalid parameters: Expected an object.')
        }
        const subscribed = params.subscribeToEvents !== false
        const res = await this._internal.client.rawMethodCall('Terminal', 'launchTerminalSession', params, [], subscribed ? 'ws' : 'http')
        if (res.error) {
            return { error: res.error }
        }
        if (subscribed) {
            this._internal.addKeepalive(res.result.terminalSessionId)
        }
        return { result: res.result }
    }
    async terminateTerminalSession(params: Parameters<TerminalRpc['terminateTerminalSession']>[0]): ReturnType<TerminalRpc['terminateTerminalSession']> {
        const res = await this._internal.client.rawMethodCall('Terminal', 'terminateTerminalSession', params, [])
        if (res.error) {
            return { error: res.error }
        }
        return { result: res.result }
    }
    async getTerminalSessions(params: Parameters<TerminalRpc['getTerminalSessions']>[0]): ReturnType<TerminalRpc['getTerminalSessions']> {
        const res = await this._internal.client.rawMethodCall('Terminal', 'getTerminalSessions', params, [])
        if (res.error) {
            return { error: res.error }
        }
        return { result: res.result }
    }
    async writeToTerminalSession(params: Parameters<TerminalRpc['writeToTerminalSession']>[0]): ReturnType<TerminalRpc['writeToTerminalSession']> {
        if (!params || typeof params !== 'object') {
            throw new DecthingsClientInvalidRequestError('Invalid parameters: Expected an object.')
        }
        let data: Buffer
        if (typeof params.data === 'string') {
            data = Buffer.from(params.data)
        } else {
            if (!Buffer.isBuffer(params.data)) {
                throw new DecthingsClientInvalidRequestError('Invalid parameter "data": Expected a string or Buffer.')
            }
            data = params.data
        }
        const newParams = { ...params }
        delete newParams.data
        const res = await this._internal.client.rawMethodCall('Terminal', 'writeToTerminalSession', newParams, [data])
        if (res.error) {
            return { error: res.error }
        }
        return { result: res.result }
    }
    async resizeTerminalSession(params: Parameters<TerminalRpc['resizeTerminalSession']>[0]): ReturnType<TerminalRpc['resizeTerminalSession']> {
        const res = await this._internal.client.rawMethodCall('Terminal', 'resizeTerminalSession', params, [])
        if (res.error) {
            return { error: res.error }
        }
        return { result: res.result }
    }
    async addFilesystemAccessForTerminalSession(
        params: Parameters<TerminalRpc['addFilesystemAccessForTerminalSession']>[0]
    ): ReturnType<TerminalRpc['addFilesystemAccessForTerminalSession']> {
        const res = await this._internal.client.rawMethodCall('Terminal', 'addFilesystemAccessForTerminalSession', params, [])
        if (res.error) {
            return { error: res.error }
        }
        return { result: res.result }
    }
    async subscribeToEvents(params: Parameters<TerminalRpc['subscribeToEvents']>[0]): ReturnType<TerminalRpc['subscribeToEvents']> {
        if (!params || typeof params !== 'object') {
            throw new DecthingsClientInvalidRequestError('Invalid parameters: Expected an object.')
        }
        const res = await this._internal.client.rawMethodCall('Terminal', 'subscribeToEvents', params, [], 'ws')
        if (res.error) {
            return { error: res.error }
        }
        this._internal.addKeepalive(params.terminalSessionId)
        return { result: res.result }
    }
    async unsubscribeFromEvents(params: Parameters<TerminalRpc['unsubscribeFromEvents']>[0]): ReturnType<TerminalRpc['unsubscribeFromEvents']> {
        if (!params || typeof params !== 'object') {
            throw new DecthingsClientInvalidRequestError('Invalid parameters: Expected an object.')
        }
        const res = await this._internal.client.rawMethodCall('Terminal', 'unsubscribeFromEvents', params, [], 'wsIfAvailableOtherwiseNone')
        if (res.error) {
            return { error: res.error }
        }
        this._internal.removeKeepalive(params.terminalSessionId)
        if (res.notCalled) {
            return { error: { code: 'not_subscribed' } }
        }
        return { result: res.result }
    }
}

export function makeTerminalRpc(client: DecthingsClient, addKeepalive: (id: string) => void, removeKeepalive: (id: string) => void): TerminalRpc {
    const rpc = new TerminalRpcImpl(client, addKeepalive, removeKeepalive)
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

export function makeUserRpc(client: DecthingsClient): UserRpc {
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
