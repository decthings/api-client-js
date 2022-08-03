import { EventEmitter } from 'events'
import { Buffer } from 'buffer'
import {
    IDatasetRpc,
    IDebugRpc,
    IFsRpc,
    ILanguageRpc,
    IModelRpc,
    IPersistentLauncherRpc,
    ISpawnedRpc,
    ITeamRpc,
    ITerminalRpc,
    IUserRpc
} from './RpcInterfaces'
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
                    'Invalid ParameterProviders: Expected the field "data" of each element to be an instance of Data, Buffer or an object like { type: "dataset", datasetId: string, shuffle?: boolean }.'
                )
            }
            newParams.push(param)
        }
    })
    return [newParams, data]
}

export function makeDatasetRpc(client: DecthingsClient): IDatasetRpc {
    return {
        createDataset: (...args: Parameters<IDatasetRpc['createDataset']>) => {
            return client.rawMethodCall('Dataset', 'createDataset', args, []).then((res) => (res.result ? { result: res.result } : { error: res.error }))
        },
        updateDataset: (...args: Parameters<IDatasetRpc['updateDataset']>) => {
            return client.rawMethodCall('Dataset', 'updateDataset', args, []).then((res) => (res.result ? { result: res.result } : { error: res.error }))
        },
        deleteDataset: (...args: Parameters<IDatasetRpc['deleteDataset']>) => {
            return client.rawMethodCall('Dataset', 'deleteDataset', args, []).then((res) => (res.result ? { result: res.result } : { error: res.error }))
        },
        getDatasets: (...args: Parameters<IDatasetRpc['getDatasets']>) => {
            return client.rawMethodCall('Dataset', 'getDatasets', args, []).then((res) => (res.result ? { result: res.result } : { error: res.error }))
        },
        addEntries: (...args: Parameters<IDatasetRpc['addEntries']>) => {
            const newArgs = [args[0], ...args.slice(2)]
            return client
                .rawMethodCall(
                    'Dataset',
                    'addEntries',
                    newArgs,
                    args[1].map((el: Data | DataElement) => el.serialize())
                )
                .then((res) => (res.result ? { result: res.result } : { error: res.error }))
        },
        addEntriesToNeedsReview: (...args: Parameters<IDatasetRpc['addEntriesToNeedsReview']>) => {
            const newArgs = [args[0], ...args.slice(2)]
            return client
                .rawMethodCall(
                    'Dataset',
                    'addEntriesToNeedsReview',
                    newArgs,
                    args[1].map((el: Data | DataElement) => el.serialize())
                )
                .then((res) => (res.result ? { result: res.result } : { error: res.error }))
        },
        finalizeNeedsReviewEntries: (...args: Parameters<IDatasetRpc['finalizeNeedsReviewEntries']>) => {
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
            return client
                .rawMethodCall('Dataset', 'finalizeNeedsReviewEntries', args, data)
                .then((res) => (res.result ? { result: res.result } : { error: res.error }))
        },
        getEntries: (...args: Parameters<IDatasetRpc['getEntries']>) => {
            return client.rawMethodCall('Dataset', 'getEntries', args, []).then((res) => {
                if (res.data.length === 0 || !res.result) {
                    return res.result ? { result: res.result } : { error: res.error }
                }
                let pos = 0
                return {
                    result: {
                        ...res.result,
                        entries: res.result.entries.map((entry) => {
                            const newEntry = {
                                ...entry,
                                data: Data.deserializeDataOrDataElement(res.data[pos])
                            }
                            pos += 1
                            return newEntry
                        })
                    }
                }
            })
        },
        getNeedsReviewEntries: (...args: Parameters<IDatasetRpc['getNeedsReviewEntries']>) => {
            return client.rawMethodCall('Dataset', 'getNeedsReviewEntries', args, []).then((res) => {
                if (res.data.length === 0 || !res.result) {
                    return res.result ? { result: res.result } : { error: res.error }
                }
                let pos = 0
                return {
                    result: {
                        ...res.result,
                        entries: res.result.entries.map((entry) => {
                            const newEntry = {
                                ...entry,
                                data: Data.deserializeDataOrDataElement(res.data[pos])
                            }
                            pos += 1
                            return newEntry
                        })
                    }
                }
            })
        },
        removeEntries: (...args: Parameters<IDatasetRpc['removeEntries']>) => {
            return client.rawMethodCall('Dataset', 'removeEntries', args, []).then((res) => (res.result ? { result: res.result } : { error: res.error }))
        },
        removeNeedsReviewEntries: (...args: Parameters<IDatasetRpc['removeNeedsReviewEntries']>) => {
            return client
                .rawMethodCall('Dataset', 'removeNeedsReviewEntries', args, [])
                .then((res) => (res.result ? { result: res.result } : { error: res.error }))
        }
    }
}

class DebugRpc extends EventEmitter implements IDebugRpc {
    constructor(private _client: DecthingsClient, private _addEvent: (id: string) => void, private _removeEvent: (id: string) => void) {
        super()
    }
    launchDebugSession(...args: Parameters<IDebugRpc['launchDebugSession']>) {
        const subscribed = args[3] !== false
        return this._client.rawMethodCall('Debug', 'launchDebugSession', args, [], subscribed).then((res) => {
            if (subscribed && res.result) {
                this._addEvent(res.result.debugSessionId)
            }
            return res.result ? { result: res.result } : { error: res.error }
        })
    }
    getDebugSessions(...args: Parameters<IDebugRpc['getDebugSessions']>) {
        return this._client.rawMethodCall('Debug', 'getDebugSessions', args, []).then((res) => (res.result ? { result: res.result } : { error: res.error }))
    }
    terminateDebugSession(...args: Parameters<IDebugRpc['terminateDebugSession']>) {
        return this._client
            .rawMethodCall('Debug', 'terminateDebugSession', args, [])
            .then((res) => (res.result ? { result: res.result } : { error: res.error }))
    }
    callCreateModelState(...args: Parameters<IDebugRpc['callCreateModelState']>) {
        const [newParams, data] = convertParameterProviders(args[1])
        const newArgs = [...args]
        newArgs[1] = newParams
        return this._client
            .rawMethodCall('Debug', 'callCreateModelState', newArgs, data)
            .then((res) => (res.result ? { result: res.result } : { error: res.error }))
    }
    callInstantiateModel(...args: Parameters<IDebugRpc['callInstantiateModel']>) {
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

        return this._client
            .rawMethodCall('Debug', 'callInstantiateModel', newArgs, dataToSend)
            .then((res) => (res.result ? { result: res.result } : { error: res.error }))
    }
    callTrain(...args: Parameters<IDebugRpc['callTrain']>) {
        const [newParams, data] = convertParameterProviders(args[2])
        const newArgs = [...args]
        newArgs[2] = newParams
        return this._client.rawMethodCall('Debug', 'callTrain', newArgs, data).then((res) => (res.result ? { result: res.result } : { error: res.error }))
    }
    getTrainingStatus(...args: Parameters<IDebugRpc['getTrainingStatus']>) {
        return this._client.rawMethodCall('Debug', 'getTrainingStatus', args, []).then((res) => (res.result ? { result: res.result } : { error: res.error }))
    }
    getTrainingMetrics(...args: Parameters<IDebugRpc['getTrainingMetrics']>) {
        return this._client.rawMethodCall('Debug', 'getTrainingMetrics', args, []).then((res) => {
            if (res.data.length === 0 || !res.result) {
                return res.result ? { result: res.result } : { error: res.error }
            }
            let pos = 0
            return {
                result: {
                    ...res.result,
                    metrics: res.result.metrics.map((metric) => {
                        return {
                            ...metric,
                            entries: metric.entries.map((entry) => {
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
        })
    }
    cancelTrainingSession(...args: Parameters<IDebugRpc['cancelTrainingSession']>) {
        return this._client
            .rawMethodCall('Debug', 'cancelTrainingSession', args, [])
            .then((res) => (res.result ? { result: res.result } : { error: res.error }))
    }
    callEvaluate(...args: Parameters<IDebugRpc['callEvaluate']>) {
        const [newParams, data] = convertParameterProviders(args[2])
        const newArgs = [...args]
        newArgs[2] = newParams
        return this._client.rawMethodCall('Debug', 'callEvaluate', newArgs, data).then((res) => {
            if (res.data.length === 0 || !res.result) {
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
        })
    }
    callGetModelState(...args: Parameters<IDebugRpc['callGetModelState']>) {
        return this._client.rawMethodCall('Debug', 'callGetModelState', args, []).then((res) => (res.result ? { result: res.result } : { error: res.error }))
    }
    downloadStateData(...args: Parameters<IDebugRpc['downloadStateData']>) {
        return this._client.rawMethodCall('Debug', 'downloadStateData', args, []).then((res) => {
            if (res.data.length === 0 || !res.result) {
                return res.result ? { result: res.result } : { error: res.error }
            }
            return {
                result: {
                    ...res.result,
                    data: res.data
                }
            }
        })
    }
    sendToRemoteInspector(...args: Parameters<IDebugRpc['sendToRemoteInspector']>) {
        return this._client
            .rawMethodCall('Debug', 'sendToRemoteInspector', args, [])
            .then((res) => (res.result ? { result: res.result } : { error: res.error }))
    }
    subscribeToEvents(...args: Parameters<IDebugRpc['subscribeToEvents']>) {
        return this._client.rawMethodCall('Debug', 'subscribeToEvents', args, [], true).then((res) => {
            if (res.result) {
                this._addEvent(args[0])
            }
            return res.result ? { result: res.result } : { error: res.error }
        })
    }
    unsubscribeFromEvents(...args: Parameters<IDebugRpc['unsubscribeFromEvents']>) {
        if (!this._client.isWebSocket()) {
            return Promise.resolve({ error: { code: 'not_subscribed' as const } })
        }
        return this._client.rawMethodCall('Debug', 'unsubscribeFromEvents', args, [], true).then((res) => {
            if (res.result) {
                this._removeEvent(args[0])
            }
            return res.result ? { result: res.result } : { error: res.error }
        })
    }
}

export function makeDebugRpc(client: DecthingsClient, addEvent: (id: string) => void, removeEvent: (id: string) => void): IDebugRpc {
    const rpc = new DebugRpc(client, addEvent, removeEvent)
    client.on('event', (api, eventName, params, data) => {
        if (api === 'Debug') {
            if (eventName === 'stdout' || eventName === 'stderr') {
                rpc.emit(eventName, params[0], data[0])
            } else {
                if (eventName === 'exit') {
                    removeEvent(params[0])
                }
                rpc.emit(eventName, ...params)
            }
        }
    })
    return rpc
}

export function makeFsRpc(client: DecthingsClient): IFsRpc {
    return {
        create: (...args: Parameters<IFsRpc['create']>) => {
            const newArgs = [...args]
            if (typeof args[1] === 'string') {
                newArgs[1] = Buffer.from(args[1]).toString('base64')
            } else {
                if (!Buffer.isBuffer(args[1])) {
                    throw new Error('Invalid pathname: Expected a string or Buffer.')
                }
                newArgs[1] = args[1].toString('base64')
            }
            return client.rawMethodCall('FS', 'create', newArgs, []).then((res) => (res.result ? { result: res.result } : { error: res.error }))
        },
        read: (...args: Parameters<IFsRpc['read']>) => {
            const newArgs = [...args]
            if (typeof args[2] === 'string') {
                newArgs[2] = Buffer.from(args[2]).toString('base64')
            } else {
                if (!Buffer.isBuffer(args[2])) {
                    throw new Error('Invalid pathname: Expected a string or Buffer.')
                }
                newArgs[2] = args[2].toString('base64')
            }
            return client.rawMethodCall('FS', 'read', newArgs, []).then((res) => {
                if (res.data.length === 0 || !res.result) {
                    return res.result ? { result: res.result } : { error: res.error }
                }
                return {
                    result: {
                        ...res.result,
                        data: res.data[0]
                    }
                }
            })
        },
        write: (...args: Parameters<IFsRpc['write']>) => {
            const newArgs = [...args]
            if (typeof args[1] === 'string') {
                newArgs[1] = Buffer.from(args[1]).toString('base64')
            } else {
                if (!Buffer.isBuffer(args[1])) {
                    throw new Error('Invalid pathname: Expected a string or Buffer.')
                }
                newArgs[1] = args[1].toString('base64')
            }
            if (!Buffer.isBuffer(args[2])) {
                throw new Error('Invalid data: Expected a Buffer.')
            }
            newArgs.splice(2, 1)
            return client.rawMethodCall('FS', 'write', newArgs, [args[2]]).then((res) => (res.result ? { result: res.result } : { error: res.error }))
        },
        truncate: (...args: Parameters<IFsRpc['truncate']>) => {
            const newArgs = [...args]
            if (typeof args[1] === 'string') {
                newArgs[1] = Buffer.from(args[1]).toString('base64')
            } else {
                if (!Buffer.isBuffer(args[1])) {
                    throw new Error('Invalid pathname: Expected a string or Buffer.')
                }
                newArgs[1] = args[1].toString('base64')
            }
            return client.rawMethodCall('FS', 'truncate', newArgs, []).then((res) => (res.result ? { result: res.result } : { error: res.error }))
        },
        stat: (...args: Parameters<IFsRpc['stat']>) => {
            const newArgs = [...args]
            if (typeof args[2] === 'string') {
                newArgs[2] = Buffer.from(args[2]).toString('base64')
            } else {
                if (!Buffer.isBuffer(args[2])) {
                    throw new Error('Invalid pathname: Expected a string or Buffer.')
                }
                newArgs[2] = args[2].toString('base64')
            }
            return client.rawMethodCall('FS', 'stat', newArgs, []).then((res) => (res.result ? { result: res.result } : { error: res.error }))
        },
        lstat: (...args: Parameters<IFsRpc['lstat']>) => {
            const newArgs = [...args]
            if (typeof args[2] === 'string') {
                newArgs[2] = Buffer.from(args[2]).toString('base64')
            } else {
                if (!Buffer.isBuffer(args[2])) {
                    throw new Error('Invalid pathname: Expected a string or Buffer.')
                }
                newArgs[2] = args[2].toString('base64')
            }
            return client.rawMethodCall('FS', 'lstat', newArgs, []).then((res) => (res.result ? { result: res.result } : { error: res.error }))
        },
        symlink: (...args: Parameters<IFsRpc['symlink']>) => {
            const newArgs = [...args]
            if (typeof args[1] === 'string') {
                newArgs[1] = Buffer.from(args[1]).toString('base64')
            } else {
                if (!Buffer.isBuffer(args[1])) {
                    throw new Error('Invalid target: Expected a string or Buffer.')
                }
                newArgs[1] = args[1].toString('base64')
            }
            if (typeof args[2] === 'string') {
                newArgs[2] = Buffer.from(args[2]).toString('base64')
            } else {
                if (!Buffer.isBuffer(args[2])) {
                    throw new Error('Invalid linkpath: Expected a string or Buffer.')
                }
                newArgs[2] = args[2].toString('base64')
            }
            return client.rawMethodCall('FS', 'symlink', newArgs, []).then((res) => (res.result ? { result: res.result } : { error: res.error }))
        },
        readlink: (...args: Parameters<IFsRpc['readlink']>) => {
            const newArgs = [...args]
            if (typeof args[2] === 'string') {
                newArgs[2] = Buffer.from(args[2]).toString('base64')
            } else {
                if (!Buffer.isBuffer(args[2])) {
                    throw new Error('Invalid pathname: Expected a string or Buffer.')
                }
                newArgs[2] = args[2].toString('base64')
            }
            return client.rawMethodCall('FS', 'readlink', newArgs, []).then((res) => {
                if (!res.result) {
                    return { error: res.error }
                }
                return {
                    result: {
                        ...res.result,
                        data: Buffer.from(res.result.data, 'base64')
                    }
                }
            })
        },
        mkdir: (...args: Parameters<IFsRpc['mkdir']>) => {
            const newArgs = [...args]
            if (typeof args[1] === 'string') {
                newArgs[1] = Buffer.from(args[1]).toString('base64')
            } else {
                if (!Buffer.isBuffer(args[1])) {
                    throw new Error('Invalid pathname: Expected a string or Buffer.')
                }
                newArgs[1] = args[1].toString('base64')
            }
            return client.rawMethodCall('FS', 'mkdir', newArgs, []).then((res) => (res.result ? { result: res.result } : { error: res.error }))
        },
        unlink: (...args: Parameters<IFsRpc['unlink']>) => {
            const newArgs = [...args]
            if (typeof args[1] === 'string') {
                newArgs[1] = Buffer.from(args[1]).toString('base64')
            } else {
                if (!Buffer.isBuffer(args[1])) {
                    throw new Error('Invalid pathname: Expected a string or Buffer.')
                }
                newArgs[1] = args[1].toString('base64')
            }
            return client.rawMethodCall('FS', 'unlink', newArgs, []).then((res) => (res.result ? { result: res.result } : { error: res.error }))
        },
        rmdir: (...args: Parameters<IFsRpc['rmdir']>) => {
            const newArgs = [...args]
            if (typeof args[1] === 'string') {
                newArgs[1] = Buffer.from(args[1]).toString('base64')
            } else {
                if (!Buffer.isBuffer(args[1])) {
                    throw new Error('Invalid pathname: Expected a string or Buffer.')
                }
                newArgs[1] = args[1].toString('base64')
            }
            return client.rawMethodCall('FS', 'rmdir', newArgs, []).then((res) => (res.result ? { result: res.result } : { error: res.error }))
        },
        rename: (...args: Parameters<IFsRpc['rename']>) => {
            const newArgs = [...args]
            if (typeof args[1] === 'string') {
                newArgs[1] = Buffer.from(args[1]).toString('base64')
            } else {
                if (!Buffer.isBuffer(args[1])) {
                    throw new Error('Invalid oldpath: Expected a string or Buffer.')
                }
                newArgs[1] = args[1].toString('base64')
            }
            if (typeof args[2] === 'string') {
                newArgs[2] = Buffer.from(args[2]).toString('base64')
            } else {
                if (!Buffer.isBuffer(args[2])) {
                    throw new Error('Invalid newpath: Expected a string or Buffer.')
                }
                newArgs[2] = args[2].toString('base64')
            }
            return client.rawMethodCall('FS', 'rename', newArgs, []).then((res) => (res.result ? { result: res.result } : { error: res.error }))
        },
        link: (...args: Parameters<IFsRpc['link']>) => {
            const newArgs = [...args]
            if (typeof args[1] === 'string') {
                newArgs[1] = Buffer.from(args[1]).toString('base64')
            } else {
                if (!Buffer.isBuffer(args[1])) {
                    throw new Error('Invalid oldpath: Expected a string or Buffer.')
                }
                newArgs[1] = args[1].toString('base64')
            }
            if (typeof args[2] === 'string') {
                newArgs[2] = Buffer.from(args[2]).toString('base64')
            } else {
                if (!Buffer.isBuffer(args[2])) {
                    throw new Error('Invalid newpath: Expected a string or Buffer.')
                }
                newArgs[2] = args[2].toString('base64')
            }
            return client.rawMethodCall('FS', 'link', newArgs, []).then((res) => (res.result ? { result: res.result } : { error: res.error }))
        },
        readdir: (...args: Parameters<IFsRpc['readdir']>) => {
            const newArgs = [...args]
            if (typeof args[2] === 'string') {
                newArgs[2] = Buffer.from(args[2]).toString('base64')
            } else {
                if (!Buffer.isBuffer(args[2])) {
                    throw new Error('Invalid pathname: Expected a string or Buffer.')
                }
                newArgs[2] = args[2].toString('base64')
            }
            return client.rawMethodCall('FS', 'readdir', newArgs, []).then((res) => {
                if (!res.result) {
                    return { error: res.error }
                }
                return {
                    result: {
                        entries: res.result.entries.map((entry) => {
                            return {
                                ...entry,
                                name: Buffer.from(entry.name, 'base64')
                            }
                        })
                    }
                }
            })
        },
        chmod: (...args: Parameters<IFsRpc['chmod']>) => {
            const newArgs = [...args]
            if (typeof args[1] === 'string') {
                newArgs[1] = Buffer.from(args[1]).toString('base64')
            } else {
                if (!Buffer.isBuffer(args[1])) {
                    throw new Error('Invalid pathname: Expected a string or Buffer.')
                }
                newArgs[1] = args[1].toString('base64')
            }
            return client.rawMethodCall('FS', 'chmod', newArgs, []).then((res) => (res.result ? { result: res.result } : { error: res.error }))
        },
        utimes: (...args: Parameters<IFsRpc['utimes']>) => {
            const newArgs = [...args]
            if (typeof args[1] === 'string') {
                newArgs[1] = Buffer.from(args[1]).toString('base64')
            } else {
                if (!Buffer.isBuffer(args[1])) {
                    throw new Error('Invalid pathname: Expected a string or Buffer.')
                }
                newArgs[1] = args[1].toString('base64')
            }
            return client.rawMethodCall('FS', 'utimes', newArgs, []).then((res) => (res.result ? { result: res.result } : { error: res.error }))
        },
        rmdirAll: (...args: Parameters<IFsRpc['rmdirAll']>) => {
            const newArgs = [...args]
            if (typeof args[1] === 'string') {
                newArgs[1] = Buffer.from(args[1]).toString('base64')
            } else {
                if (!Buffer.isBuffer(args[1])) {
                    throw new Error('Invalid pathname: Expected a string or Buffer.')
                }
                newArgs[1] = args[1].toString('base64')
            }
            return client.rawMethodCall('FS', 'rmdirAll', newArgs, []).then((res) => (res.result ? { result: res.result } : { error: res.error }))
        },
        copy: (...args: Parameters<IFsRpc['copy']>) => {
            const newArgs = [...args]
            if (typeof args[1] === 'string') {
                newArgs[1] = Buffer.from(args[1]).toString('base64')
            } else {
                if (!Buffer.isBuffer(args[1])) {
                    throw new Error('Invalid sourcepath: Expected a string or Buffer.')
                }
                newArgs[1] = args[1].toString('base64')
            }
            if (typeof args[2] === 'string') {
                newArgs[2] = Buffer.from(args[2]).toString('base64')
            } else {
                if (!Buffer.isBuffer(args[2])) {
                    throw new Error('Invalid destinationpath: Expected a string or Buffer.')
                }
                newArgs[2] = args[2].toString('base64')
            }
            return client.rawMethodCall('FS', 'copy', newArgs, []).then((res) => (res.result ? { result: res.result } : { error: res.error }))
        }
    }
}

class LanguageRpc extends EventEmitter implements ILanguageRpc {
    constructor(private _client: DecthingsClient, private _addEvent: (id: string) => void, private _removeEvent: (id: string) => void) {
        super()
    }
    startLanguageServer(...args: Parameters<ILanguageRpc['startLanguageServer']>) {
        return this._client.rawMethodCall('Language', 'startLanguageServer', args, [], true).then((res) => {
            if (res.result) {
                this._addEvent(res.result.languageServerId)
            }
            return res.result ? { result: res.result } : { error: res.error }
        })
    }
    writeToLanguageServer(...args: Parameters<ILanguageRpc['writeToLanguageServer']>) {
        if (!Buffer.isBuffer(args[1])) {
            throw new Error('Invalid data: Expected a Buffer.')
        }
        const newArgs = [...args]
        newArgs.splice(1, 1)
        return this._client
            .rawMethodCall('Language', 'writeToLanguageServer', newArgs, [args[1]])
            .then((res) => (res.result ? { result: res.result } : { error: res.error }))
    }
    unsubscribeFromEvents(...args: Parameters<ILanguageRpc['unsubscribeFromEvents']>) {
        if (!this._client.isWebSocket()) {
            return Promise.resolve({ error: { code: 'not_subscribed' as const } })
        }
        return this._client.rawMethodCall('Language', 'unsubscribeFromEvents', args, [], true).then((res) => {
            if (res.result) {
                this._removeEvent(args[0])
            }
            return res.result ? { result: res.result } : { error: res.error }
        })
    }
}

export function makeLanguageRpc(client: DecthingsClient, addEvent: (id: string) => void, removeEvent: (id: string) => void): ILanguageRpc {
    const rpc = new LanguageRpc(client, addEvent, removeEvent)
    client.on('event', (api, eventName, params, data) => {
        if (api === 'Language') {
            if (eventName === 'data') {
                rpc.emit(eventName, params[0], data[0])
            } else {
                if (eventName === 'exit') {
                    removeEvent(params[0])
                }
                rpc.emit(eventName, ...params)
            }
        }
    })
    return rpc
}

export function makeModelRpc(client: DecthingsClient): IModelRpc {
    return {
        createModel(...args: Parameters<IModelRpc['createModel']>) {
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
                    return client
                        .rawMethodCall('Model', 'createModel', newArgs, data)
                        .then((res) => (res.result ? { result: res.result } : { error: res.error }))
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
                    return client
                        .rawMethodCall('Model', 'createModel', newArgs, data)
                        .then((res) => (res.result ? { result: res.result } : { error: res.error }))
                }
            }
            return client.rawMethodCall('Model', 'createModel', args, []).then((res) => (res.result ? { result: res.result } : { error: res.error }))
        },
        waitForModelToBeCreated(...args: Parameters<IModelRpc['waitForModelToBeCreated']>) {
            return client
                .rawMethodCall('Model', 'waitForModelToBeCreated', args, [])
                .then((res) => (res.result ? { result: res.result } : { error: res.error }))
        },
        deleteModel(...args: Parameters<IModelRpc['deleteModel']>) {
            return client.rawMethodCall('Model', 'deleteModel', args, []).then((res) => (res.result ? { result: res.result } : { error: res.error }))
        },
        snapshotModel(...args: Parameters<IModelRpc['snapshotModel']>) {
            return client.rawMethodCall('Model', 'snapshotModel', args, []).then((res) => (res.result ? { result: res.result } : { error: res.error }))
        },
        setSnapshotName(...args: Parameters<IModelRpc['setSnapshotName']>) {
            return client.rawMethodCall('Model', 'setSnapshotName', args, []).then((res) => (res.result ? { result: res.result } : { error: res.error }))
        },
        deleteSnapshot(...args: Parameters<IModelRpc['deleteSnapshot']>) {
            return client.rawMethodCall('Model', 'deleteSnapshot', args, []).then((res) => (res.result ? { result: res.result } : { error: res.error }))
        },
        updateModel(...args: Parameters<IModelRpc['updateModel']>) {
            return client.rawMethodCall('Model', 'updateModel', args, []).then((res) => (res.result ? { result: res.result } : { error: res.error }))
        },
        getModels(...args: Parameters<IModelRpc['getModels']>) {
            return client.rawMethodCall('Model', 'getModels', args, []).then((res) => (res.result ? { result: res.result } : { error: res.error }))
        },
        setFilesystemSize(...args: Parameters<IModelRpc['setFilesystemSize']>) {
            return client.rawMethodCall('Model', 'setFilesystemSize', args, []).then((res) => (res.result ? { result: res.result } : { error: res.error }))
        },
        createState(...args: Parameters<IModelRpc['createState']>) {
            const [newParams, data] = convertParameterProviders(args[2])
            const newArgs = [...args]
            newArgs[2] = newParams
            return client.rawMethodCall('Model', 'createState', newArgs, data).then((res) => (res.result ? { result: res.result } : { error: res.error }))
        },
        uploadState(...args: Parameters<IModelRpc['uploadState']>) {
            if (!Array.isArray(args[2]) || args[2].some((el) => !Buffer.isBuffer(el))) {
                throw new Error('Invalid data: Expected an array of Buffers.')
            }
            const newArgs = [...args]
            newArgs.splice(2, 1)
            return client.rawMethodCall('Model', 'uploadState', newArgs, args[2]).then((res) => (res.result ? { result: res.result } : { error: res.error }))
        },
        cancelCreateState(...args: Parameters<IModelRpc['cancelCreateState']>) {
            return client.rawMethodCall('Model', 'cancelCreateState', args, []).then((res) => (res.result ? { result: res.result } : { error: res.error }))
        },
        getCreatingStates(...args: Parameters<IModelRpc['getCreatingStates']>) {
            return client.rawMethodCall('Model', 'getCreatingStates', args, []).then((res) => (res.result ? { result: res.result } : { error: res.error }))
        },
        waitForStateToBeCreated(...args: Parameters<IModelRpc['waitForStateToBeCreated']>) {
            return client
                .rawMethodCall('Model', 'waitForStateToBeCreated', args, [])
                .then((res) => (res.result ? { result: res.result } : { error: res.error }))
        },
        updateModelState(...args: Parameters<IModelRpc['updateModelState']>) {
            return client.rawMethodCall('Model', 'updateModelState', args, []).then((res) => (res.result ? { result: res.result } : { error: res.error }))
        },
        setCurrentModelState(...args: Parameters<IModelRpc['setCurrentModelState']>) {
            return client.rawMethodCall('Model', 'setCurrentModelState', args, []).then((res) => (res.result ? { result: res.result } : { error: res.error }))
        },
        deleteModelState(...args: Parameters<IModelRpc['deleteModelState']>) {
            return client.rawMethodCall('Model', 'deleteModelState', args, []).then((res) => (res.result ? { result: res.result } : { error: res.error }))
        },
        getModelState(...args: Parameters<IModelRpc['getModelState']>) {
            return client.rawMethodCall('Model', 'getModelState', args, []).then((res) => {
                if (res.data.length === 0 || !res.result) {
                    return res.result ? { result: res.result } : { error: res.error }
                }
                return {
                    result: {
                        ...res.result,
                        data: res.data
                    }
                }
            })
        },
        getSnapshotState(...args: Parameters<IModelRpc['getSnapshotState']>) {
            return client.rawMethodCall('Model', 'getSnapshotState', args, []).then((res) => {
                if (res.data.length === 0 || !res.result) {
                    return res.result ? { result: res.result } : { error: res.error }
                }
                return {
                    result: {
                        ...res.result,
                        data: res.data
                    }
                }
            })
        },
        getParameterDefinitions(...args: Parameters<IModelRpc['getParameterDefinitions']>) {
            return client
                .rawMethodCall('Model', 'getParameterDefinitions', args, [])
                .then((res) => (res.result ? { result: res.result } : { error: res.error }))
        },
        train(...args: Parameters<IModelRpc['train']>) {
            const [newParams, data] = convertParameterProviders(args[2])
            const newArgs = [...args]
            newArgs[2] = newParams
            return client.rawMethodCall('Model', 'train', newArgs, data).then((res) => (res.result ? { result: res.result } : { error: res.error }))
        },
        getTrainingStatus(...args: Parameters<IModelRpc['getTrainingStatus']>) {
            return client.rawMethodCall('Model', 'getTrainingStatus', args, []).then((res) => (res.result ? { result: res.result } : { error: res.error }))
        },
        getTrainingMetrics(...args: Parameters<IModelRpc['getTrainingMetrics']>) {
            return client.rawMethodCall('Model', 'getTrainingMetrics', args, []).then((res) => {
                if (res.data.length === 0 || !res.result) {
                    return res.result ? { result: res.result } : { error: res.error }
                }
                let pos = 0
                return {
                    result: {
                        ...res.result,
                        metrics: res.result.metrics.map((metric) => {
                            return {
                                ...metric,
                                entries: metric.entries.map((entry) => {
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
            })
        },
        cancelTrainingSession(...args: Parameters<IModelRpc['cancelTrainingSession']>) {
            return client.rawMethodCall('Model', 'cancelTrainingSession', args, []).then((res) => (res.result ? { result: res.result } : { error: res.error }))
        },
        clearPreviousTrainingSession(...args: Parameters<IModelRpc['clearPreviousTrainingSession']>) {
            return client
                .rawMethodCall('Model', 'clearPreviousTrainingSession', args, [])
                .then((res) => (res.result ? { result: res.result } : { error: res.error }))
        },
        evaluate(...args: Parameters<IModelRpc['evaluate']>) {
            const [newParams, data] = convertParameterProviders(args[1])
            const newArgs = [...args]
            newArgs[1] = newParams
            return client.rawMethodCall('Model', 'evaluate', newArgs, data).then((res) => {
                if (res.data.length === 0 || !res.result || !res.result.success) {
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
            })
        },
        getEvaluations(...args: Parameters<IModelRpc['getEvaluations']>) {
            return client.rawMethodCall('Model', 'getEvaluations', args, []).then((res) => (res.result ? { result: res.result } : { error: res.error }))
        },
        getFinishedEvaluationResult(...args: Parameters<IModelRpc['getFinishedEvaluationResult']>) {
            return client.rawMethodCall('Model', 'getFinishedEvaluationResult', args, []).then((res) => {
                if (res.data.length === 0 || !res.result || !res.result.evaluationSuccess) {
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
            })
        },
        cancelEvaluation(...args: Parameters<IModelRpc['cancelEvaluation']>) {
            return client.rawMethodCall('Model', 'cancelEvaluation', args, []).then((res) => (res.result ? { result: res.result } : { error: res.error }))
        },
        setUsedPersistentLaunchersForEvaluate(...args: Parameters<IModelRpc['setUsedPersistentLaunchersForEvaluate']>) {
            return client
                .rawMethodCall('Model', 'setUsedPersistentLaunchersForEvaluate', args, [])
                .then((res) => (res.result ? { result: res.result } : { error: res.error }))
        },
        getUsedPersistentLaunchersForEvaluate(...args: Parameters<IModelRpc['getUsedPersistentLaunchersForEvaluate']>) {
            return client
                .rawMethodCall('Model', 'getUsedPersistentLaunchersForEvaluate', args, [])
                .then((res) => (res.result ? { result: res.result } : { error: res.error }))
        }
    }
}

export function makePersistentLauncherRpc(client: DecthingsClient): IPersistentLauncherRpc {
    return {
        createPersistentLauncher: (...args: Parameters<IPersistentLauncherRpc['createPersistentLauncher']>) => {
            return client
                .rawMethodCall('PersistentLauncher', 'createPersistentLauncher', args, [])
                .then((res) => (res.result ? { result: res.result } : { error: res.error }))
        },
        getPersistentLaunchers: (...args: Parameters<IPersistentLauncherRpc['getPersistentLaunchers']>) => {
            return client
                .rawMethodCall('PersistentLauncher', 'getPersistentLaunchers', args, [])
                .then((res) => (res.result ? { result: res.result } : { error: res.error }))
        },
        deletePersistentLauncher: (...args: Parameters<IPersistentLauncherRpc['deletePersistentLauncher']>) => {
            return client
                .rawMethodCall('PersistentLauncher', 'deletePersistentLauncher', args, [])
                .then((res) => (res.result ? { result: res.result } : { error: res.error }))
        }
    }
}

class SpawnedRpc extends EventEmitter implements ISpawnedRpc {
    constructor(private _client: DecthingsClient, private _addEvent: (id: string) => void, private _removeEvent: (id: string) => void) {
        super()
    }
    spawnCommand(...args: Parameters<ISpawnedRpc['spawnCommand']>) {
        const subscribed = args[4] !== false
        return this._client.rawMethodCall('Spawned', 'spawnCommand', args, [], subscribed).then((res) => {
            if (subscribed && res.result) {
                this._addEvent(res.result.spawnedCommandId)
            }
            return res.result ? { result: res.result } : { error: res.error }
        })
    }
    spawnCommandForModel(...args: Parameters<ISpawnedRpc['spawnCommandForModel']>) {
        const subscribed = args[5] !== false
        return this._client.rawMethodCall('Spawned', 'spawnCommandForModel', args, [], subscribed).then((res) => {
            if (subscribed && res.result) {
                this._addEvent(res.result.spawnedCommandId)
            }
            return res.result ? { result: res.result } : { error: res.error }
        })
    }
    terminateSpawnedCommand(...args: Parameters<ISpawnedRpc['terminateSpawnedCommand']>) {
        return this._client
            .rawMethodCall('Spawned', 'terminateSpawnedCommand', args, [])
            .then((res) => (res.result ? { result: res.result } : { error: res.error }))
    }
    getSpawnedCommands(...args: Parameters<ISpawnedRpc['getSpawnedCommands']>) {
        return this._client.rawMethodCall('Spawned', 'getSpawnedCommands', args, []).then((res) => (res.result ? { result: res.result } : { error: res.error }))
    }
    writeToSpawnedCommand(...args: Parameters<ISpawnedRpc['writeToSpawnedCommand']>) {
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
        return this._client
            .rawMethodCall('Spawned', 'writeToSpawnedCommand', newArgs, [data])
            .then((res) => (res.result ? { result: res.result } : { error: res.error }))
    }
    subscribeToEvents(...args: Parameters<ISpawnedRpc['subscribeToEvents']>) {
        return this._client.rawMethodCall('Spawned', 'subscribeToEvents', args, [], true).then((res) => {
            if (res.result) {
                this._addEvent(args[0])
            }
            return res.result ? { result: res.result } : { error: res.error }
        })
    }
    unsubscribeFromEvents(...args: Parameters<ISpawnedRpc['unsubscribeFromEvents']>) {
        if (!this._client.isWebSocket()) {
            return Promise.resolve({ error: { code: 'not_subscribed' as const } })
        }
        return this._client.rawMethodCall('Spawned', 'unsubscribeFromEvents', args, [], true).then((res) => {
            if (res.result) {
                this._removeEvent(args[0])
            }
            return res.result ? { result: res.result } : { error: res.error }
        })
    }
}

export function makeSpawnedRpc(client: DecthingsClient, addEvent: (id: string) => void, removeEvent: (id: string) => void): ISpawnedRpc {
    const rpc = new SpawnedRpc(client, addEvent, removeEvent)
    client.on('event', (api, eventName, params, data) => {
        if (api === 'Spawned') {
            if (eventName === 'stdout' || eventName === 'stderr') {
                rpc.emit(eventName, params[0], data[0])
            } else {
                if (eventName === 'exit') {
                    removeEvent(params[0])
                }
                rpc.emit(eventName, ...params)
            }
        }
    })
    return rpc
}

export function makeTeamRpc(client: DecthingsClient): ITeamRpc {
    return {
        createTeam: (...args: Parameters<ITeamRpc['createTeam']>) => {
            return client.rawMethodCall('Team', 'createTeam', args, []).then((res) => (res.result ? { result: res.result } : { error: res.error }))
        },
        updateTeam: (...args: Parameters<ITeamRpc['updateTeam']>) => {
            return client.rawMethodCall('Team', 'updateTeam', args, []).then((res) => (res.result ? { result: res.result } : { error: res.error }))
        },
        getTeams: (...args: Parameters<ITeamRpc['getTeams']>) => {
            return client.rawMethodCall('Team', 'getTeams', args, []).then((res) => (res.result ? { result: res.result } : { error: res.error }))
        },
        inviteUsersToTeam: (...args: Parameters<ITeamRpc['inviteUsersToTeam']>) => {
            return client.rawMethodCall('Team', 'inviteUsersToTeam', args, []).then((res) => (res.result ? { result: res.result } : { error: res.error }))
        },
        removeUsersFromTeam: (...args: Parameters<ITeamRpc['removeUsersFromTeam']>) => {
            return client.rawMethodCall('Team', 'removeUsersFromTeam', args, []).then((res) => (res.result ? { result: res.result } : { error: res.error }))
        },
        acceptTeamInvitation: (...args: Parameters<ITeamRpc['acceptTeamInvitation']>) => {
            return client.rawMethodCall('Team', 'acceptTeamInvitation', args, []).then((res) => (res.result ? { result: res.result } : { error: res.error }))
        },
        denyTeamInvitation: (...args: Parameters<ITeamRpc['denyTeamInvitation']>) => {
            return client.rawMethodCall('Team', 'denyTeamInvitation', args, []).then((res) => (res.result ? { result: res.result } : { error: res.error }))
        },
        setShareModelWithTeam: (...args: Parameters<ITeamRpc['setShareModelWithTeam']>) => {
            return client.rawMethodCall('Team', 'setShareModelWithTeam', args, []).then((res) => (res.result ? { result: res.result } : { error: res.error }))
        },
        setShareDatasetWithTeam: (...args: Parameters<ITeamRpc['setShareDatasetWithTeam']>) => {
            return client.rawMethodCall('Team', 'setShareDatasetWithTeam', args, []).then((res) => (res.result ? { result: res.result } : { error: res.error }))
        },
        createRole: (...args: Parameters<ITeamRpc['createRole']>) => {
            return client.rawMethodCall('Team', 'createRole', args, []).then((res) => (res.result ? { result: res.result } : { error: res.error }))
        },
        editRole: (...args: Parameters<ITeamRpc['editRole']>) => {
            return client.rawMethodCall('Team', 'editRole', args, []).then((res) => (res.result ? { result: res.result } : { error: res.error }))
        },
        removeRole: (...args: Parameters<ITeamRpc['removeRole']>) => {
            return client.rawMethodCall('Team', 'removeRole', args, []).then((res) => (res.result ? { result: res.result } : { error: res.error }))
        },
        assignRole: (...args: Parameters<ITeamRpc['assignRole']>) => {
            return client.rawMethodCall('Team', 'assignRole', args, []).then((res) => (res.result ? { result: res.result } : { error: res.error }))
        }
    }
}

class TerminalRpc extends EventEmitter implements ITerminalRpc {
    constructor(private _client: DecthingsClient, private _addEvent: (id: string) => void, private _removeEvent: (id: string) => void) {
        super()
    }
    launchTerminalSession(...args: Parameters<ITerminalRpc['launchTerminalSession']>) {
        const subscribed = args[3] !== false
        return this._client.rawMethodCall('Terminal', 'launchTerminalSession', args, [], subscribed).then((res) => {
            if (subscribed && res.result) {
                this._addEvent(res.result.terminalSessionId)
            }
            return res.result ? { result: res.result } : { error: res.error }
        })
    }
    terminateTerminalSession(...args: Parameters<ITerminalRpc['terminateTerminalSession']>) {
        return this._client
            .rawMethodCall('Terminal', 'terminateTerminalSession', args, [])
            .then((res) => (res.result ? { result: res.result } : { error: res.error }))
    }
    getTerminalSessions(...args: Parameters<ITerminalRpc['getTerminalSessions']>) {
        return this._client
            .rawMethodCall('Terminal', 'getTerminalSessions', args, [])
            .then((res) => (res.result ? { result: res.result } : { error: res.error }))
    }
    writeToTerminalSession(...args: Parameters<ITerminalRpc['writeToTerminalSession']>) {
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
        return this._client
            .rawMethodCall('Terminal', 'writeToTerminalSession', newArgs, [data])
            .then((res) => (res.result ? { result: res.result } : { error: res.error }))
    }
    resizeTerminalSession(...args: Parameters<ITerminalRpc['resizeTerminalSession']>) {
        return this._client
            .rawMethodCall('Terminal', 'resizeTerminalSession', args, [])
            .then((res) => (res.result ? { result: res.result } : { error: res.error }))
    }
    addFilesystemAccessForTerminalSession(...args: Parameters<ITerminalRpc['addFilesystemAccessForTerminalSession']>) {
        return this._client
            .rawMethodCall('Terminal', 'addFilesystemAccessForTerminalSession', args, [])
            .then((res) => (res.result ? { result: res.result } : { error: res.error }))
    }
    subscribeToEvents(...args: Parameters<ITerminalRpc['subscribeToEvents']>) {
        return this._client.rawMethodCall('Terminal', 'subscribeToEvents', args, [], true).then((res) => {
            if (res.result) {
                this._addEvent(args[0])
            }
            return res.result ? { result: res.result } : { error: res.error }
        })
    }
    unsubscribeFromEvents(...args: Parameters<ITerminalRpc['unsubscribeFromEvents']>) {
        if (!this._client.isWebSocket()) {
            return Promise.resolve({ error: { code: 'not_subscribed' as const } })
        }
        return this._client.rawMethodCall('Terminal', 'unsubscribeFromEvents', args, [], true).then((res) => {
            if (res.result) {
                this._removeEvent(args[0])
            }
            return res.result ? { result: res.result } : { error: res.error }
        })
    }
}

export function makeTerminalRpc(client: DecthingsClient, addEvent: (id: string) => void, removeEvent: (id: string) => void): ITerminalRpc {
    const rpc = new TerminalRpc(client, addEvent, removeEvent)
    client.on('event', (api, eventName, params, data) => {
        if (api === 'Terminal') {
            if (eventName === 'data') {
                rpc.emit(eventName, params[0], data[0])
            } else {
                if (eventName === 'exit') {
                    removeEvent(params[0])
                }
                rpc.emit(eventName, ...params)
            }
        }
    })
    return rpc
}

export function makeUserRpc(client: DecthingsClient): IUserRpc {
    return {
        findMatchingUsers: (...args: Parameters<IUserRpc['findMatchingUsers']>) => {
            return client.rawMethodCall('User', 'findMatchingUsers', args, []).then((res) => (res.result ? { result: res.result } : { error: res.error }))
        },
        getUsers: (...args: Parameters<IUserRpc['getUsers']>) => {
            return client.rawMethodCall('User', 'getUsers', args, []).then((res) => (res.result ? { result: res.result } : { error: res.error }))
        },
        getNotifications: (...args: Parameters<IUserRpc['getNotifications']>) => {
            return client.rawMethodCall('User', 'getNotifications', args, []).then((res) => (res.result ? { result: res.result } : { error: res.error }))
        },
        setNotification: (...args: Parameters<IUserRpc['setNotification']>) => {
            return client.rawMethodCall('User', 'setNotification', args, []).then((res) => (res.result ? { result: res.result } : { error: res.error }))
        },
        getBillingStats: (...args: Parameters<IUserRpc['getBillingStats']>) => {
            return client.rawMethodCall('User', 'getBillingStats', args, []).then((res) => (res.result ? { result: res.result } : { error: res.error }))
        },
        estimateAmountDue: (...args: Parameters<IUserRpc['estimateAmountDue']>) => {
            return client.rawMethodCall('User', 'estimateAmountDue', args, []).then((res) => (res.result ? { result: res.result } : { error: res.error }))
        },
        getQuotas: (...args: Parameters<IUserRpc['getQuotas']>) => {
            return client.rawMethodCall('User', 'getQuotas', args, []).then((res) => (res.result ? { result: res.result } : { error: res.error }))
        }
    }
}
