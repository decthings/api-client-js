import { Buffer } from 'buffer'
import * as Varint from './Varint'

export type RequestMessage = {
    api: string
    method: string
    params: any[]
    apiKey?: string
}

export type Response = {
    result?: any
    error?: any
}

export type Event = {
    event: string
    api: string
    params: any[]
}

// Message protocol:
// 1. Varint specifying length of JSON data
// 2. JSON data
// Repeated:
// 3. Varint encoding length of next data segment
// 4. next data segment
export function serializeForHttp(params: any[], data: Buffer[]): Buffer {
    const msgBuf = Buffer.from(JSON.stringify(params))
    const msgLengthVarint = Varint.serializeVarUint64(msgBuf.byteLength)

    const final: Buffer[] = [msgLengthVarint, msgBuf]

    data.forEach((el) => {
        const elLengthVarint = Varint.serializeVarUint64(el.byteLength)
        final.push(elLengthVarint, el)
    })

    return Buffer.concat(final)
}

// Message protocol:
// 1. u32 id
// 2. Varint specifying length of JSON data
// 3. JSON data
// Repeated:
// 4. Varint encoding length of next data segment
// 5. next data segment
export function serializeForWebsocket(id: number, message: RequestMessage, data: Buffer[]): Buffer {
    const idBuf = Buffer.alloc(4)
    idBuf.writeUint32BE(id, 0)

    const msgBuf = Buffer.from(JSON.stringify(message))
    const msgLengthVarint = Varint.serializeVarUint64(msgBuf.byteLength)

    const final: Buffer[] = [idBuf, msgLengthVarint, msgBuf]

    data.forEach((el) => {
        const elLengthVarint = Varint.serializeVarUint64(el.byteLength)
        final.push(elLengthVarint, el)
    })

    return Buffer.concat(final)
}

// Message protocol:
// 1. Varint specifying length of JSON data
// 2. JSON data
// Repeated:
// 3. Varint encoding length of next data segment
// 4. next data segment
export function deserializeForHttp(data: Buffer): { response: Response; data: Buffer[] } {
    const [length, vLength] = Varint.deserializeVarUint64(data)
    const lengthNum = Number(length)

    const response = JSON.parse(data.slice(vLength, vLength + lengthNum).toString())

    const dataSegments: Buffer[] = []
    let pos = vLength + lengthNum
    while (pos < data.byteLength) {
        const [segmentLength, segmentVLength] = Varint.deserializeVarUint64(data.slice(pos))
        const segmentLengthNum = Number(segmentLength)
        dataSegments.push(data.slice(pos + segmentVLength, pos + segmentVLength + segmentLengthNum))
        pos += segmentVLength + segmentLengthNum
    }

    return {
        response,
        data: dataSegments
    }
}

// Message protocol:
// 1. u8 literal 0 if result, 1 if event
// 2. If result: u32 id
// 3. Varint specifying length of JSON data
// 4. JSON data
// Repeated:
// 5. Varint encoding length of next data segment
// 6. next data segment
export function deserializeForWs(data: Buffer): { response?: [number, Response]; event?: Event; data: Buffer[] } {
    const first = data.readUint8(0)
    if (first === 0) {
        // Response message
        var id = data.readUint32BE(1)
        data = data.slice(5)
    } else {
        // Event message
        const api_len = data.readUint8(1)
        var api = data.subarray(2, 2 + api_len).toString()
        data = data.slice(2 + api_len)
    }

    const [length, vLength] = Varint.deserializeVarUint64(data)
    const lengthNum = Number(length)

    const json = JSON.parse(data.slice(vLength, vLength + lengthNum).toString())

    const dataSegments: Buffer[] = []
    let pos = vLength + lengthNum
    while (pos < data.byteLength) {
        const [segmentLength, segmentVLength] = Varint.deserializeVarUint64(data.slice(pos))
        const segmentLengthNum = Number(segmentLength)
        dataSegments.push(data.slice(pos + segmentVLength, pos + segmentVLength + segmentLengthNum))
        pos += segmentVLength + segmentLengthNum
    }

    if (first === 0) {
        // Response message
        return { response: [id, json], data: dataSegments }
    } else {
        // Event message
        return { event: { api, ...json }, data: dataSegments }
    }
}
