import { Buffer } from 'buffer'
import * as Varint from './Varint'

export type RequestMessage = {
    id: number
    api: string
    method: string
    params: any[]
    apiKey?: string
}

export type ResponseMessage = {
    id: number
    result?: any
    error?: any
}

export type EventMessage = {
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

export function serialize<T>(message: T, data: Buffer[]): Buffer {
    const msgBuf = Buffer.from(JSON.stringify(message))
    const msgLengthVarint = Varint.serializeVarUint64(msgBuf.byteLength)

    const final: Buffer[] = [msgLengthVarint, msgBuf]

    data.forEach((el) => {
        const elLengthVarint = Varint.serializeVarUint64(el.byteLength)
        final.push(elLengthVarint, el)
    })

    return Buffer.concat(final)
}

export function deserialize<T>(data: Buffer): { message: T; data: Buffer[] } {
    const [length, vLength] = Varint.deserializeVarUint64(data)
    const lengthNum = Number(length)

    const message = JSON.parse(data.slice(vLength, vLength + lengthNum).toString())

    const dataSegments: Buffer[] = []
    let pos = vLength + lengthNum
    while (pos < data.byteLength) {
        const [segmentLength, segmentVLength] = Varint.deserializeVarUint64(data.slice(pos))
        const segmentLengthNum = Number(segmentLength)
        dataSegments.push(data.slice(pos + segmentVLength, pos + segmentVLength + segmentLengthNum))
        pos += segmentVLength + segmentLengthNum
    }

    return {
        message,
        data: dataSegments
    }
}
