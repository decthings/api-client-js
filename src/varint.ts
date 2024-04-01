import { Buffer } from 'buffer'

export function getVarUint64LengthFromBuffer(data: Buffer): number {
    const first = data.readUint8(0)
    if (first < 253) {
        return 1
    } else if (first === 253) {
        return 3
    } else if (first === 254) {
        return 5
    } else {
        return 9
    }
}

export function getVarUint64Length(value: number | bigint): number {
    if (value < 253) {
        return 1
    } else if (value < 2 ** 16) {
        return 3
    } else if (value < 2 ** 32) {
        return 5
    } else {
        return 9
    }
}

export function serializeVarUint64(value: number | bigint): Buffer {
    const b = BigInt(value)
    if (b < 253) {
        return Buffer.from([Number(b)])
    } else if (b < 2 ** 16) {
        const buf = Buffer.alloc(3)
        buf.writeUInt8(253, 0)
        buf.writeUint16BE(Number(b), 1)
        return buf
    } else if (b < 2 ** 32) {
        const buf = Buffer.alloc(5)
        buf.writeUInt8(254, 0)
        buf.writeUint32BE(Number(b), 1)
        return buf
    } else {
        const buf = Buffer.alloc(9)
        buf.writeUInt8(255, 0)
        buf.writeBigUInt64BE(b, 1)
        return buf
    }
}

export function deserializeVarUint64(data: Buffer): [bigint, number] {
    const first = data.readUint8(0)
    if (first < 253) {
        return [BigInt(first), 1]
    } else if (first === 253) {
        return [BigInt(data.readUInt16BE(1)), 3]
    } else if (first === 254) {
        return [BigInt(data.readUInt32BE(1)), 5]
    } else {
        return [data.readBigUInt64BE(1), 9]
    }
}
