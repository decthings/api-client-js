import {
    DecthingsElementAudio,
    DecthingsElementImage,
    DecthingsElementType,
    DecthingsElementVideo,
    DecthingsTensorElement,
    decthingsElementTypes
} from './element'
import * as varint from '../varint'

const typeSpecifiers = {
    f32: 1,
    f64: 2,
    i8: 3,
    i16: 4,
    i32: 5,
    i64: 6,
    u8: 7,
    u16: 8,
    u32: 9,
    u64: 10,
    string: 11,
    binary: 12,
    boolean: 13,
    image: 14,
    audio: 15,
    video: 16
}

type TypeWithSize = 'f32' | 'f64' | 'i8' | 'i16' | 'i32' | 'i64' | 'u8' | 'u16' | 'u32' | 'u64' | 'boolean'

function isTypeWithSize(type: DecthingsElementType): type is TypeWithSize {
    return ['f32', 'f64', 'i8', 'i16', 'i32', 'i64', 'u8', 'u16', 'u32', 'u64', 'boolean'].includes(type)
}

function getElementSize(type: TypeWithSize): number {
    if (type === 'f32' || type === 'i32' || type === 'u32') {
        return 4
    }
    if (type === 'f64' || type === 'i64' || type === 'u64') {
        return 8
    }
    if (type === 'boolean' || type === 'i8' || type === 'u8') {
        return 1
    }
    return 2
}

/**
 * Class holding data that can be sent to and from Decthings functions, such as evaluate and add entries to dataset.
 *
 * The tensor is an n-dimensional tensor with a few different possible data types - see *DecthingsElementType*.
 *
 * The class contains a one-dimensional array. It also contains a shape, which makes it possible to interpret the
 * one-dimensional array as an n-dimensional array. You can get access to the one-dimensional list using the
 * *asOneDimensional* method, or you can read an element using a list of indexes using the *get* method.
 *
 * The third and final thing the class contains is the type of the elements - for example image, video, f32 for
 * 32-bit float, i16 for 16-bit signed integer, and u32 for 32-bit unsigned integer.
 */
export class DecthingsTensor {
    private _data: Buffer | DecthingsTensorElement[]
    private _shape: number[]
    private _type: DecthingsElementType

    public constructor(data: DecthingsTensorElement[] | Buffer, type: DecthingsElementType, shape: number[]) {
        if (!Array.isArray(shape) || shape.some((x) => typeof x != 'number' || x < 0 || !Number.isInteger(x))) {
            throw new Error(`Invalid shape provided to new DecthingsTensor(data, type, shape): Expected an array of non-negative integers.`)
        }
        if (shape.length > 255) {
            throw new Error(`Invalid shape provided to new DecthingsTensor(data, type, shape): Cannot contain more than 255 dimensions.`)
        }
        if (!decthingsElementTypes.includes(type)) {
            throw new Error(`Invalid type. Expected one of: ${decthingsElementTypes.join(', ')}`)
        }

        const expectedNumElements = shape.reduce((acc, curr) => acc * curr, 1)

        if (Array.isArray(data)) {
            if (data.length != expectedNumElements) {
                throw new Error(
                    `Invalid data provided to new DecthingsTensor(data, type, shape): For shape [${shape.join(
                        ', '
                    )}], expected ${expectedNumElements} elements, but got ${data.length} elements.`
                )
            }
        } else if (Buffer.isBuffer(data)) {
            if (!isTypeWithSize(type)) {
                throw new Error(`Invalid data provided to new DecthingsTensor(data, type, shape): For data type ${type}, a Buffer cannot be provided.`)
            }
            const elementSize = getElementSize(type)
            if (data.byteLength != expectedNumElements * elementSize) {
                throw new Error(
                    `Invalid data provided to new DecthingsTensor(data, type, shape): For shape [${shape.join(', ')}], expected ${
                        expectedNumElements * elementSize
                    } bytes in Buffer, but got ${data.byteLength} bytes.`
                )
            }
        } else {
            throw new Error(`Invalid data provided to new DecthingsTensor(data, type, shape): Expected an array or Buffer.`)
        }

        this._data = data
        this._shape = shape
        this._type = type
    }

    public type(): DecthingsElementType {
        return this._type
    }

    public shape(): number[] {
        return this._shape.slice()
    }

    public item(): DecthingsTensorElement {
        if (this._shape.length != 0) {
            throw new Error(`This tensor is not a scalar. For a scalar, the shape should be [], but it is ${this._shape.join(', ')}`)
        }
        return this.asOneDimensional()[0]
    }

    public get(...indexes: number[]): DecthingsTensor {
        if (!Array.isArray(indexes) || indexes.some((x) => typeof x != 'number' || x < 0 || !Number.isInteger(x))) {
            throw new Error('Invalid indexes provided to DecthingsTensor.get(): Expected an array of non-negative integers.')
        }
        if (indexes.length > this._shape.length || indexes.some((x, i) => x >= this._shape[i])) {
            throw new Error('Invalid indexes provided to DecthingsTensor.get(): Expected the length to be less than or equal to this.shape().length.')
        }
        if (indexes.length > this._shape.length || indexes.some((x, i) => x >= this._shape[i])) {
            throw new Error(
                `Invalid indexes provided to DecthingsTensor.get(): Each index must be smaller than the shape in that dimension. Indexes were ${indexes.join(
                    ', '
                )}, while the shape was ${this._shape.join(', ')}.`
            )
        }

        let index = 0
        for (let i = 0; i < indexes.length; i++) {
            index = index + indexes[i] * this._shape.slice(i + 1).reduce((acc, curr) => acc * curr, 1)
        }

        if (Buffer.isBuffer(this._data)) {
            if (!isTypeWithSize(this._type)) {
                throw new Error('Corrupt tensor')
            }
            const elementSize = getElementSize(this._type)
            return new DecthingsTensor(
                this._data.subarray(index * elementSize, (index + this._shape.slice(indexes.length).reduce((acc, curr) => acc * curr, 1)) * elementSize),
                this._type,
                this._shape.slice(indexes.length)
            )
        }

        return new DecthingsTensor(
            this._data.slice(index, index + this._shape.slice(indexes.length).reduce((acc, curr) => acc * curr, 1)),
            this._type,
            this._shape.slice(indexes.length)
        )
    }

    public asOneDimensional(): DecthingsTensorElement[] {
        if (Buffer.isBuffer(this._data)) {
            let numElements = this._shape.reduce((acc, curr) => acc * curr, 1)

            const res: DecthingsTensorElement[] = new Array(numElements)
            if (this._type === 'f32') {
                for (let i = 0; i < numElements; i++) {
                    res[i] = this._data.readFloatLE(i * 4)
                }
            } else if (this._type === 'f64') {
                for (let i = 0; i < numElements; i++) {
                    res[i] = this._data.readDoubleLE(i * 8)
                }
            } else if (this._type === 'i8') {
                for (let i = 0; i < numElements; i++) {
                    res[i] = this._data.readInt8(i)
                }
            } else if (this._type === 'i16') {
                for (let i = 0; i < numElements; i++) {
                    res[i] = this._data.readInt16LE(i * 2)
                }
            } else if (this._type === 'i32') {
                for (let i = 0; i < numElements; i++) {
                    res[i] = this._data.readInt32LE(i * 4)
                }
            } else if (this._type === 'i64') {
                for (let i = 0; i < numElements; i++) {
                    res[i] = this._data.readBigInt64LE(i * 8)
                }
            } else if (this._type === 'u8') {
                for (let i = 0; i < numElements; i++) {
                    res[i] = this._data.readUint8(i)
                }
            } else if (this._type === 'u16') {
                for (let i = 0; i < numElements; i++) {
                    res[i] = this._data.readUint16LE(i * 2)
                }
            } else if (this._type === 'u32') {
                for (let i = 0; i < numElements; i++) {
                    res[i] = this._data.readUint32LE(i * 4)
                }
            } else if (this._type === 'u64') {
                for (let i = 0; i < numElements; i++) {
                    res[i] = this._data.readBigUint64LE(i * 8)
                }
            } else if (this._type === 'boolean') {
                for (let i = 0; i < numElements; i++) {
                    res[i] = this._data.readUint8(i) != 0
                }
            } else {
                throw new Error('Corrupt tensor.')
            }
            return res
        }
        return this._data.slice()
    }

    public static deserialize(data: Buffer): [DecthingsTensor, number] {
        if (data.byteLength < 2) {
            throw new Error('Invalid data. Unexpected end of bytes.')
        }
        const firstByte = data[0]
        const typeEntry = Object.entries(typeSpecifiers).find((x) => x[1] == firstByte)
        if (!typeEntry) {
            throw new Error(
                `Invalid data. Invalid first byte (which specifies the type): ${firstByte}. Expected one of the following: ${JSON.stringify(typeSpecifiers)}`
            )
        }
        const type = typeEntry[0] as DecthingsElementType

        const numDims = data[1]
        const shape: number[] = []

        let pos = 2
        for (let i = 0; i < numDims; i++) {
            if (data.byteLength < pos + 1) {
                throw new Error('Invalid data. Unexpected end of bytes.')
            }
            const varintLength = varint.getVarUint64LengthFromBuffer(data.subarray(pos))
            if (data.byteLength < pos + varintLength) {
                throw new Error('Invalid data. Unexpected end of bytes.')
            }
            shape.push(Number(varint.deserializeVarUint64(data.subarray(pos))[0]))
            pos += varintLength
        }

        const numElements = shape.reduce((acc, curr) => acc * curr, 1)

        if (isTypeWithSize(type)) {
            const elementSize = getElementSize(type)
            if (data.byteLength < pos + elementSize * numElements) {
                throw new Error('Invalid data. Unexpected end of bytes.')
            }
            return [new DecthingsTensor(data.subarray(pos, pos + elementSize * numElements), type, shape), pos + elementSize * numElements]
        } else {
            if (data.byteLength < pos + 1) {
                throw new Error('Invalid data. Unexpected end of bytes.')
            }
            pos += varint.getVarUint64LengthFromBuffer(data.subarray(pos))

            const res: DecthingsTensorElement[] = new Array(numElements)
            if (type === 'string') {
                for (let i = 0; i < numElements; i++) {
                    if (data.byteLength < pos + 1) {
                        throw new Error('Invalid data. Unexpected end of bytes.')
                    }
                    const varintLength = varint.getVarUint64LengthFromBuffer(data.subarray(pos))
                    if (data.byteLength < pos + varintLength) {
                        throw new Error('Invalid data. Unexpected end of bytes.')
                    }
                    const length = Number(varint.deserializeVarUint64(data.subarray(pos))[0])
                    pos += varintLength
                    if (data.byteLength < pos + length) {
                        throw new Error('Invalid data. Unexpected end of bytes.')
                    }
                    res[i] = data.subarray(pos, pos + length).toString()
                    pos += length
                }
            } else if (type === 'binary') {
                for (let i = 0; i < numElements; i++) {
                    if (data.byteLength < pos + 1) {
                        throw new Error('Invalid data. Unexpected end of bytes.')
                    }
                    const varintLength = varint.getVarUint64LengthFromBuffer(data.subarray(pos))
                    if (data.byteLength < pos + varintLength) {
                        throw new Error('Invalid data. Unexpected end of bytes.')
                    }
                    const length = Number(varint.deserializeVarUint64(data.subarray(pos))[0])
                    pos += varintLength
                    if (data.byteLength < pos + length) {
                        throw new Error('Invalid data. Unexpected end of bytes.')
                    }
                    res[i] = data.subarray(pos, pos + length)
                    pos += length
                }
            } else if (type === 'image') {
                for (let i = 0; i < numElements; i++) {
                    if (data.byteLength < pos + 1) {
                        throw new Error('Invalid data. Unexpected end of bytes.')
                    }
                    const varintLength = varint.getVarUint64LengthFromBuffer(data.subarray(pos))
                    if (data.byteLength < pos + varintLength) {
                        throw new Error('Invalid data. Unexpected end of bytes.')
                    }
                    const length = Number(varint.deserializeVarUint64(data.subarray(pos))[0])
                    pos += varintLength
                    if (data.byteLength < pos + length) {
                        throw new Error('Invalid data. Unexpected end of bytes.')
                    }
                    if (length < 3) {
                        throw new Error('Invalid data. Expected at least 3 bytes for image.')
                    }
                    res[i] = new DecthingsElementImage(data.subarray(pos, pos + 3).toString(), data.subarray(pos + 3, pos + length))
                    pos += length
                }
            } else if (type === 'audio') {
                for (let i = 0; i < numElements; i++) {
                    if (data.byteLength < pos + 1) {
                        throw new Error('Invalid data. Unexpected end of bytes.')
                    }
                    const varintLength = varint.getVarUint64LengthFromBuffer(data.subarray(pos))
                    if (data.byteLength < pos + varintLength) {
                        throw new Error('Invalid data. Unexpected end of bytes.')
                    }
                    const length = Number(varint.deserializeVarUint64(data.subarray(pos))[0])
                    pos += varintLength
                    if (data.byteLength < pos + length) {
                        throw new Error('Invalid data. Unexpected end of bytes.')
                    }
                    if (length < 3) {
                        throw new Error('Invalid data. Expected at least 3 bytes for audio.')
                    }
                    res[i] = new DecthingsElementAudio(data.subarray(pos, pos + 3).toString(), data.subarray(pos + 3, pos + length))
                    pos += length
                }
            } else if (type === 'video') {
                for (let i = 0; i < numElements; i++) {
                    if (data.byteLength < pos + 1) {
                        throw new Error('Invalid data. Unexpected end of bytes.')
                    }
                    const varintLength = varint.getVarUint64LengthFromBuffer(data.subarray(pos))
                    if (data.byteLength < pos + varintLength) {
                        throw new Error('Invalid data. Unexpected end of bytes.')
                    }
                    const length = Number(varint.deserializeVarUint64(data.subarray(pos))[0])
                    pos += varintLength
                    if (data.byteLength < pos + length) {
                        throw new Error('Invalid data. Unexpected end of bytes.')
                    }
                    if (length < 3) {
                        throw new Error('Invalid data. Expected at least 3 bytes for video.')
                    }
                    res[i] = new DecthingsElementVideo(data.subarray(pos, pos + 3).toString(), data.subarray(pos + 3, pos + length))
                    pos += length
                }
            }
            return [new DecthingsTensor(res, type, shape), pos]
        }
    }

    public static deserializeMany(data: Buffer): DecthingsTensor[] {
        const res: DecthingsTensor[] = []

        let pos = 0
        while (pos < data.byteLength) {
            const [tensor, length] = DecthingsTensor.deserialize(data.subarray(pos))
            pos += length
            res.push(tensor)
        }

        return res
    }

    public serializedByteSize(): number {
        let size = 2

        this._shape.forEach((shape) => {
            size += varint.getVarUint64Length(shape)
        })

        const numElements = this._shape.reduce((acc, curr) => acc * curr, 1)

        if (isTypeWithSize(this._type)) {
            const elementSize = getElementSize(this._type)
            size += elementSize * numElements
        } else {
            let headerSize = size
            if (this._type === 'string') {
                for (let i = 0; i < numElements; i++) {
                    const el = this._data[i]
                    if (typeof el != 'string') {
                        throw new Error(`For type ${this._type}, expected all elements to be strings. Got ${typeof el}`)
                    }
                    size += varint.getVarUint64Length(el.length) + Buffer.from(el).byteLength
                }
            } else if (this._type === 'binary') {
                for (let i = 0; i < numElements; i++) {
                    const el = this._data[i]
                    if (!Buffer.isBuffer(el)) {
                        throw new Error(`For type ${this._type}, expected all elements to be Buffers.`)
                    }
                    size += varint.getVarUint64Length(el.byteLength) + el.byteLength
                }
            } else if (this._type === 'image') {
                for (let i = 0; i < numElements; i++) {
                    const el = this._data[i]
                    if (!(el instanceof DecthingsElementImage)) {
                        throw new Error(`For type ${this._type}, expected all elements to be instances of DecthingsElementImage.`)
                    }
                    size += varint.getVarUint64Length(3 + el.data.byteLength)
                    const formatBuf = Buffer.from(el.format)
                    if (formatBuf.byteLength != 3) {
                        throw new Error('Corrupt data. Expected the "format" field of each image to be three bytes long.')
                    }
                    size += formatBuf.byteLength + el.data.byteLength
                }
            } else if (this._type === 'audio') {
                for (let i = 0; i < numElements; i++) {
                    const el = this._data[i]
                    if (!(el instanceof DecthingsElementAudio)) {
                        throw new Error(`For type ${this._type}, expected all elements to be instances of DecthingsElementAudio.`)
                    }
                    size += varint.getVarUint64Length(3 + el.data.byteLength)
                    const formatBuf = Buffer.from(el.format)
                    if (formatBuf.byteLength != 3) {
                        throw new Error('Corrupt data. Expected the "format" field of each audio to be three bytes long.')
                    }
                    size += formatBuf.byteLength + el.data.byteLength
                }
            } else if (this._type === 'video') {
                for (let i = 0; i < numElements; i++) {
                    const el = this._data[i]
                    if (!(el instanceof DecthingsElementImage)) {
                        throw new Error(`For type ${this._type}, expected all elements to be instances of DecthingsElementVideo.`)
                    }
                    size += varint.getVarUint64Length(3 + el.data.byteLength)
                    const formatBuf = Buffer.from(el.format)
                    if (formatBuf.byteLength != 3) {
                        throw new Error('Corrupt data. Expected the "format" field of each video to be three bytes long.')
                    }
                    size += formatBuf.byteLength + el.data.byteLength
                }
            } else {
                throw new Error('Corrupt data.')
            }
            size += varint.getVarUint64Length(size - headerSize)
        }

        return size
    }

    public serialize(): Buffer {
        let firstByte = typeSpecifiers[this._type]
        if (typeof firstByte != 'number') {
            throw new Error('Corrupt tensor.')
        }
        const firstByteBuf = Buffer.alloc(1)
        firstByteBuf.writeUint8(firstByte, 0)

        const numDimsBuf = Buffer.alloc(1)
        numDimsBuf.writeUint8(this._shape.length, 0)

        const res = [firstByteBuf, numDimsBuf]

        this._shape.forEach((shape) => {
            res.push(varint.serializeVarUint64(shape))
        })

        const numElements = this._shape.reduce((acc, curr) => acc * curr, 1)

        if (Buffer.isBuffer(this._data)) {
            if (!isTypeWithSize(this._type)) {
                throw new Error('Corrupt tensor.')
            }
            const elementSize = getElementSize(this._type)
            if (this._data.byteLength != elementSize * numElements) {
                throw new Error('Corrupt tensor.')
            }
            res.push(this._data)
        } else {
            if (isTypeWithSize(this._type)) {
                const elementSize = getElementSize(this._type)
                const buf = Buffer.alloc(elementSize * numElements)

                if (this._type === 'f32') {
                    for (let i = 0; i < numElements; i++) {
                        const el = this._data[i]
                        if (typeof el != 'number') {
                            throw new Error(`For type ${this._type}, expected all elements to be numbers. Got ${typeof el}`)
                        }
                        buf.writeFloatLE(el, i * elementSize)
                    }
                } else if (this._type === 'f64') {
                    for (let i = 0; i < numElements; i++) {
                        const el = this._data[i]
                        if (typeof el != 'number') {
                            throw new Error(`For type ${this._type}, expected all elements to be numbers. Got ${typeof el}`)
                        }
                        buf.writeDoubleLE(el, i * elementSize)
                    }
                } else if (this._type === 'i8') {
                    for (let i = 0; i < numElements; i++) {
                        const el = this._data[i]
                        if (typeof el != 'number') {
                            throw new Error(`For type ${this._type}, expected all elements to be numbers. Got ${typeof el}`)
                        }
                        buf.writeInt8(el, i * elementSize)
                    }
                } else if (this._type === 'i16') {
                    for (let i = 0; i < numElements; i++) {
                        const el = this._data[i]
                        if (typeof el != 'number') {
                            throw new Error(`For type ${this._type}, expected all elements to be numbers. Got ${typeof el}`)
                        }
                        buf.writeInt16LE(el, i * elementSize)
                    }
                } else if (this._type === 'i32') {
                    for (let i = 0; i < numElements; i++) {
                        const el = this._data[i]
                        if (typeof el != 'number') {
                            throw new Error(`For type ${this._type}, expected all elements to be numbers. Got ${typeof el}`)
                        }
                        buf.writeInt32LE(el, i * elementSize)
                    }
                } else if (this._type === 'i64') {
                    for (let i = 0; i < numElements; i++) {
                        const el = this._data[i]
                        if (typeof el != 'number' && typeof el != 'bigint') {
                            throw new Error(`For type ${this._type}, expected all elements to be numbers. Got ${typeof el}`)
                        }
                        buf.writeBigInt64LE(BigInt(el), i * elementSize)
                    }
                } else if (this._type === 'u8') {
                    for (let i = 0; i < numElements; i++) {
                        const el = this._data[i]
                        if (typeof el != 'number') {
                            throw new Error(`For type ${this._type}, expected all elements to be numbers. Got ${typeof el}`)
                        }
                        buf.writeUint8(el, i * elementSize)
                    }
                } else if (this._type === 'u16') {
                    for (let i = 0; i < numElements; i++) {
                        const el = this._data[i]
                        if (typeof el != 'number') {
                            throw new Error(`For type ${this._type}, expected all elements to be numbers. Got ${typeof el}`)
                        }
                        buf.writeUint16LE(el, i * elementSize)
                    }
                } else if (this._type === 'u32') {
                    for (let i = 0; i < numElements; i++) {
                        const el = this._data[i]
                        if (typeof el != 'number') {
                            throw new Error(`For type ${this._type}, expected all elements to be numbers. Got ${typeof el}`)
                        }
                        buf.writeUint32LE(el, i * elementSize)
                    }
                } else if (this._type === 'u64') {
                    for (let i = 0; i < numElements; i++) {
                        const el = this._data[i]
                        if (typeof el != 'number' && typeof el != 'bigint') {
                            throw new Error(`For type ${this._type}, expected all elements to be numbers. Got ${typeof el}`)
                        }
                        buf.writeBigUInt64LE(BigInt(el), i * elementSize)
                    }
                } else {
                    for (let i = 0; i < numElements; i++) {
                        const el = this._data[i]
                        if (typeof el != 'boolean') {
                            throw new Error(`For type ${this._type}, expected all elements to be booleans. Got ${typeof el}`)
                        }
                        buf.writeUint8(el ? 1 : 0, i * elementSize)
                    }
                }

                res.push(buf)
            } else {
                const afterHeader: Buffer[] = []
                if (this._type === 'string') {
                    for (let i = 0; i < numElements; i++) {
                        const el = this._data[i]
                        if (typeof el != 'string') {
                            throw new Error(`For type ${this._type}, expected all elements to be strings. Got ${typeof el}`)
                        }
                        afterHeader.push(varint.serializeVarUint64(el.length))
                        afterHeader.push(Buffer.from(el))
                    }
                } else if (this._type === 'binary') {
                    for (let i = 0; i < numElements; i++) {
                        const el = this._data[i]
                        if (!Buffer.isBuffer(el)) {
                            throw new Error(`For type ${this._type}, expected all elements to be Buffers.`)
                        }
                        afterHeader.push(varint.serializeVarUint64(el.byteLength))
                        afterHeader.push(el)
                    }
                } else if (this._type === 'image') {
                    for (let i = 0; i < numElements; i++) {
                        const el = this._data[i]
                        if (!(el instanceof DecthingsElementImage)) {
                            throw new Error(`For type ${this._type}, expected all elements to be instances of DecthingsElementImage.`)
                        }
                        afterHeader.push(varint.serializeVarUint64(3 + el.data.byteLength))
                        const formatBuf = Buffer.from(el.format)
                        if (formatBuf.byteLength != 3) {
                            throw new Error('Corrupt data. Expected the "format" field of each image to be three bytes long.')
                        }
                        afterHeader.push(formatBuf)
                        afterHeader.push(el.data)
                    }
                } else if (this._type === 'audio') {
                    for (let i = 0; i < numElements; i++) {
                        const el = this._data[i]
                        if (!(el instanceof DecthingsElementAudio)) {
                            throw new Error(`For type ${this._type}, expected all elements to be instances of DecthingsElementAudio.`)
                        }
                        afterHeader.push(varint.serializeVarUint64(3 + el.data.byteLength))
                        const formatBuf = Buffer.from(el.format)
                        if (formatBuf.byteLength != 3) {
                            throw new Error('Corrupt data. Expected the "format" field of each audio to be three bytes long.')
                        }
                        afterHeader.push(formatBuf)
                        afterHeader.push(el.data)
                    }
                } else if (this._type === 'video') {
                    for (let i = 0; i < numElements; i++) {
                        const el = this._data[i]
                        if (!(el instanceof DecthingsElementImage)) {
                            throw new Error(`For type ${this._type}, expected all elements to be instances of DecthingsElementVideo.`)
                        }
                        afterHeader.push(varint.serializeVarUint64(3 + el.data.byteLength))
                        const formatBuf = Buffer.from(el.format)
                        if (formatBuf.byteLength != 3) {
                            throw new Error('Corrupt data. Expected the "format" field of each video to be three bytes long.')
                        }
                        afterHeader.push(formatBuf)
                        afterHeader.push(el.data)
                    }
                } else {
                    throw new Error('Corrupt data.')
                }
                res.push(varint.serializeVarUint64(afterHeader.reduce((acc, curr) => acc + curr.byteLength, 0)))
                res.push(...afterHeader)
            }
        }

        return Buffer.concat(res)
    }
}
