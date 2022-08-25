import { Buffer } from 'buffer'

export function getVarInt64Length(data: Buffer): number {
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

export function getVarUint64Length(data: Buffer): number {
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

export function serializeVarInt64(value: number | bigint): Buffer {
    let b: bigint
    if (value >= 0) {
        b = BigInt(value) * BigInt(2)
    } else {
        b = BigInt(-value) * BigInt(2) - BigInt(1)
    }
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
        buf.writeBigUint64BE(b, 1)
        return buf
    }
}

export function deserializeVarInt64(data: Buffer): [bigint, number] {
    const first = data.readUint8(0)
    let result: bigint
    let len: number
    if (first < 253) {
        result = BigInt(data.readInt8(0))
        len = 1
    } else if (first === 253) {
        result = BigInt(data.readUint16BE(1))
        len = 3
    } else if (first === 254) {
        result = BigInt(data.readUint32BE(1))
        len = 5
    } else {
        result = data.readBigUint64BE(1)
        len = 9
    }
    if (result % BigInt(2) === BigInt(0)) {
        return [result / BigInt(2), len]
    } else {
        return [-(result + BigInt(1)) / BigInt(2), len]
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
