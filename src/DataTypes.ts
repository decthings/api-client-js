import { Buffer } from 'buffer'
import * as Varint from './Varint'

function typeOf(obj: any): string {
    return {}.toString.call(obj).split(' ')[1].slice(0, -1).toLowerCase()
}

/**
 * All available data types.
 */
export type DataType =
    | 'f32'
    | 'f64'
    | 'i8'
    | 'i16'
    | 'i32'
    | 'i64'
    | 'u8'
    | 'u16'
    | 'u32'
    | 'u64'
    | 'string'
    | 'boolean'
    | 'binary'
    | 'image'
    | 'audio'
    | 'video'

/**
 * Specifies rules for the shape and allowed data types for a Data or DataJson.
 */
export type DataRules = {
    /**
     * Dimensions of the data array.
     *
     * [1] would mean that the data must contain just a single element, [2] would mean two elements and so on.
     * [2, 1] would mean that the data must contain two arrays that each contain one element,
     * [2, 2, 1] would mean that the data must contain two arrays that each contain two arrays that each contain
     * one element, and so on.
     *
     * Providing a value of -1 in any place would allow dimension to be of any length.
     */
    shape: number[]
    /**
     * A list of the allowed types of elements in the data array.
     */
    allowedTypes: (DataType | { type: 'dict'; entries: { name: string; rules: DataRules }[] })[]
}

const typeSpecifiers = {
    array: 1,
    arrayWithSameType: 2,
    dict: 3,
    f32: 4,
    f64: 5,
    i8: 6,
    i16: 7,
    i32: 8,
    i64: 9,
    u8: 10,
    u16: 11,
    u32: 12,
    u64: 13,
    string: 14,
    binary: 15,
    boolean: 16,
    image: 17,
    audio: 18,
    video: 19
}

/**
 * Helper class for reading, creating and manipulating data which can be sent to or received from Decthings functions.
 *
 * A DataElement can contain a number, string, image or other forms. If none of the available forms suit your needs, you can choose
 * binary and provide any binary data you'd like.
 */
export class DataElement {
    private constructor(private _type: number, private _data: Buffer) {}

    /**
     * Returns true if this DataElement is a 32-bit floating point number.
     */
    public isF32(): boolean {
        return this._type === typeSpecifiers.f32
    }
    /**
     * If this DataElement is a 32-bit floating point number, returns the number. Otherwise, throws an exception.
     */
    public getF32(): number {
        if (!this.isF32()) {
            throw new Error('DataElement is not an f32.')
        }
        return this._data.readFloatBE(0)
    }
    /**
     * Creates a new DataElement which holds a 32-bit floating point number.
     */
    public static f32(value: number): DataElement {
        if (typeof value !== 'number') {
            throw new Error(`Expected value to be a number, got ${typeOf(value)}.`)
        }
        const buf = Buffer.alloc(4)
        buf.writeFloatBE(value, 0)
        return new DataElement(typeSpecifiers.f32, buf)
    }

    /**
     * Returns true if this DataElement is a 64-bit floating point number.
     */
    public isF64(): boolean {
        return this._type === typeSpecifiers.f64
    }
    /**
     * If this DataElement is a 64-bit floating point number, returns the number. Otherwise, throws an exception.
     */
    public getF64(): number {
        if (!this.isF64()) {
            throw new Error('DataElement is not an f64.')
        }
        return this._data.readDoubleBE(0)
    }
    /**
     * Creates a new DataElement which holds a 64-bit floating point number.
     */
    public static f64(value: number): DataElement {
        if (typeof value !== 'number') {
            throw new Error(`Expected value to be a number, got ${typeOf(value)}.`)
        }
        const buf = Buffer.alloc(8)
        buf.writeDoubleBE(value, 0)
        return new DataElement(typeSpecifiers.f64, buf)
    }

    /**
     * Returns true if this DataElement is an 8-bit, signed integer number.
     */
    public isI8(): boolean {
        return this._type === typeSpecifiers.i8
    }
    /**
     * If this DataElement is an 8-bit, signed integer number, returns the number. Otherwise, throws an exception.
     */
    public getI8(): number {
        if (!this.isI8()) {
            throw new Error('DataElement is not an i8.')
        }
        return this._data.readInt8(0)
    }
    /**
     * Creates a new DataElement which holds an 8-bit, signed integer number.
     *
     * Can hold value from -128 to 127.
     */
    public static i8(value: number): DataElement {
        if (typeof value !== 'number') {
            throw new Error(`Expected value to be a number, got ${typeOf(value)}.`)
        }
        const buf = Buffer.alloc(1)
        buf.writeInt8(value, 0)
        return new DataElement(typeSpecifiers.i8, buf)
    }

    /**
     * Returns true if this DataElement is a 16-bit, signed integer number.
     */
    public isI16(): boolean {
        return this._type === typeSpecifiers.i16
    }
    /**
     * If this DataElement is a 16-bit, signed integer number, returns the number. Otherwise, throws an exception.
     */
    public getI16(): number {
        if (!this.isI16()) {
            throw new Error('DataElement is not an i16.')
        }
        return this._data.readInt16BE(0)
    }
    /**
     * Creates a new DataElement which holds an 8-bit, signed integer number.
     *
     * Can hold values from -32,768 to 32,767.
     */
    public static i16(value: number): DataElement {
        if (typeof value !== 'number') {
            throw new Error(`Expected value to be a number, got ${typeOf(value)}.`)
        }
        const buf = Buffer.alloc(2)
        buf.writeInt16BE(value, 0)
        return new DataElement(typeSpecifiers.i16, buf)
    }

    /**
     * Returns true if this DataElement is a 32-bit, signed integer number.
     */
    public isI32(): boolean {
        return this._type === typeSpecifiers.i32
    }
    /**
     * If this DataElement is a 32-bit, signed integer number, returns the number. Otherwise, throws an exception.
     */
    public getI32(): number {
        if (!this.isI32()) {
            throw new Error('DataElement is not an i32.')
        }
        return this._data.readInt32BE(0)
    }
    /**
     * Creates a new DataElement which holds an 8-bit, signed integer number.
     *
     * Can hold values from -2,147,483,648 to 2,147,483,647.
     */
    public static i32(value: number): DataElement {
        if (typeof value !== 'number') {
            throw new Error(`Expected value to be a number, got ${typeOf(value)}.`)
        }
        const buf = Buffer.alloc(4)
        buf.writeInt32BE(value, 0)
        return new DataElement(typeSpecifiers.i32, buf)
    }

    /**
     * Returns true if this DataElement is a 64-bit, signed integer number.
     */
    public isI64(): boolean {
        return this._type === typeSpecifiers.i64
    }
    /**
     * If this DataElement is a 32-bit, signed integer number, returns the number. Otherwise, throws an exception.
     */
    public getI64(): bigint {
        if (!this.isI64()) {
            throw new Error('DataElement is not an i64.')
        }
        return Varint.deserializeVarInt64(this._data)[0]
    }
    /**
     * Creates a new DataElement which holds an 8-bit, signed integer number.
     *
     * Can hold values from -9,223,372,036,854,775,808 to 9,223,372,036,854,775,807.
     */
    public static i64(value: number | bigint): DataElement {
        if (typeof value !== 'number' && typeof value !== 'bigint') {
            throw new Error(`Expected value to be a number or bigint, got ${typeOf(value)}.`)
        }
        return new DataElement(typeSpecifiers.i64, Varint.serializeVarInt64(value))
    }

    /**
     * Returns true if this DataElement is an 8-bit, unsigned integer number.
     */
    public isU8(): boolean {
        return this._type === typeSpecifiers.u8
    }
    /**
     * If this DataElement is an 8-bit, unsigned integer number, returns the number. Otherwise, throws an exception.
     */
    public getU8(): number {
        if (!this.isU8()) {
            throw new Error('DataElement is not a u8.')
        }
        return this._data.readUInt8(0)
    }
    /**
     * Creates a new DataElement which holds an 8-bit, unsigned integer number.
     *
     * Can hold values from 0 to 255.
     */
    public static u8(value: number): DataElement {
        if (typeof value !== 'number') {
            throw new Error(`Expected value to be a number, got ${typeOf(value)}.`)
        }
        const buf = Buffer.alloc(1)
        buf.writeUInt8(value, 0)
        return new DataElement(typeSpecifiers.u8, buf)
    }

    /**
     * Returns true if this DataElement is a 16-bit, unsigned integer number.
     */
    public isU16(): boolean {
        return this._type === typeSpecifiers.u16
    }
    /**
     * If this DataElement is a 16-bit, unsigned integer number, returns the number. Otherwise, throws an exception.
     */
    public getU16(): number {
        if (!this.isU16()) {
            throw new Error('DataElement is not a u16.')
        }
        return this._data.readUInt16BE(0)
    }
    /**
     * Creates a new DataElement which holds a 16-bit, unsigned integer number.
     *
     * Can hold values from 0 to 65,535.
     */
    public static u16(value: number): DataElement {
        if (typeof value !== 'number') {
            throw new Error(`Expected value to be a number, got ${typeOf(value)}.`)
        }
        const buf = Buffer.alloc(2)
        buf.writeUInt16BE(value, 0)
        return new DataElement(typeSpecifiers.u16, buf)
    }

    /**
     * Returns true if this DataElement is a 32-bit, unsigned integer number.
     */
    public isU32(): boolean {
        return this._type === typeSpecifiers.u32
    }
    /**
     * If this DataElement is a 32-bit, unsigned integer number, returns the number. Otherwise, throws an exception.
     */
    public getU32(): number {
        if (!this.isU32()) {
            throw new Error('DataElement is not a u32.')
        }
        return this._data.readUInt32BE(0)
    }
    /**
     * Creates a new DataElement which holds a 16-bit, unsigned integer number.
     *
     * Can hold values from 0 to 4,294,967,295.
     */
    public static u32(value: number): DataElement {
        if (typeof value !== 'number') {
            throw new Error(`Expected value to be a number, got ${typeOf(value)}.`)
        }
        const buf = Buffer.alloc(4)
        buf.writeUInt32BE(value, 0)
        return new DataElement(typeSpecifiers.u32, buf)
    }

    /**
     * Returns true if this DataElement is a 64-bit, unsigned integer number.
     */
    public isU64(): boolean {
        return this._type === typeSpecifiers.u64
    }
    /**
     * If this DataElement is a 64-bit, unsigned integer number, returns the number. Otherwise, throws an exception.
     */
    public getU64(): bigint {
        if (!this.isU64()) {
            throw new Error('DataElement is not a u64.')
        }
        return Varint.deserializeVarUint64(this._data)[0]
    }
    /**
     * Creates a new DataElement which holds a 64-bit, unsigned integer number.
     *
     * Can hold values from 0 to 18,446,744,073,709,551,615.
     */
    public static u64(value: number | bigint): DataElement {
        if (typeof value !== 'number' && typeof value !== 'bigint') {
            throw new Error(`Expected value to be a number or bigint, got ${typeOf(value)}.`)
        }
        return new DataElement(typeSpecifiers.u64, Varint.serializeVarUint64(value))
    }

    /**
     * Returns true if this DataElement is a string.
     */
    public isString(): boolean {
        return this._type === typeSpecifiers.string
    }
    /**
     * If this DataElement is a string, returns the string. Otherwise, throws an exception.
     */
    public getString(): string {
        if (!this.isString()) {
            throw new Error('DataElement is not a string.')
        }
        return this._data.toString()
    }
    /**
     * Creates a new DataElement which holds a string.
     */
    public static string(value: string): DataElement {
        if (typeof value !== 'string') {
            throw new Error(`Expected value to be a string, got ${typeOf(value)}.`)
        }
        return new DataElement(typeSpecifiers.string, Buffer.from(value))
    }

    /**
     * Returns true if this DataElement is binary data.
     */
    public isBinary(): boolean {
        return this._type === typeSpecifiers.binary
    }
    /**
     * If this DataElement is binary data, returns the data. Otherwise, throws an exception.
     */
    public getBinary(): Buffer {
        if (!this.isBinary()) {
            throw new Error('DataElement is not a binary.')
        }
        return this._data
    }
    /**
     * Creates a new DataElement which holds binary data.
     */
    public static binary(value: Buffer): DataElement {
        if (!Buffer.isBuffer(value)) {
            throw new Error(`Expected value to be a Buffer, got ${typeOf(value)}`)
        }
        return new DataElement(typeSpecifiers.binary, value)
    }

    /**
     * Returns true if this DataElement is a boolean.
     */
    public isBoolean(): boolean {
        return this._type === typeSpecifiers.boolean
    }
    /**
     * If this DataElement is a boolean, returns the boolean. Otherwise, throws an exception.
     */
    public getBoolean(): boolean {
        if (!this.isBoolean()) {
            throw new Error('DataElement is not a boolean.')
        }
        return this._data[0] === 1
    }
    /**
     * Creates a new DataElement which holds a boolean.
     */
    public static boolean(value: boolean): DataElement {
        if (typeof value !== 'boolean') {
            throw new Error(`Expected value to be a boolean, got ${typeOf(value)}.`)
        }
        return new DataElement(typeSpecifiers.boolean, Buffer.from([value ? 1 : 0]))
    }

    /**
     * Returns true if this DataElement is an image.
     */
    public isImage(): boolean {
        return this._type === typeSpecifiers.image
    }
    /**
     * If this DataElement is an image, returns the data and format. Otherwise, throws an exception.
     */
    public getImage(): { format: string; data: Buffer } {
        if (!this.isImage()) {
            throw new Error('DataElement is not an image.')
        }
        return { format: this._data.slice(0, 3).toString(), data: this._data.slice(3) }
    }
    /**
     * Creates a new DataElement which holds an image.
     */
    public static image(imageFormat: string, value: Buffer): DataElement {
        if (typeof imageFormat !== 'string') {
            throw new Error(`Expected imageFormat to be a string, got ${typeOf(imageFormat)}`)
        }
        if (!Buffer.isBuffer(value)) {
            throw new Error(`Expected value to be a Buffer, got ${typeOf(value)}`)
        }
        const formatBuf = Buffer.from(imageFormat)
        if (formatBuf.length !== 3) {
            throw new Error(`Expected imageFormat to be a string with length 3 bytes, got length ${formatBuf.length}`)
        }
        return new DataElement(typeSpecifiers.image, Buffer.concat([formatBuf, value]))
    }

    /**
     * Returns true if this DataElement is audio.
     */
    public isAudio(): boolean {
        return this._type === typeSpecifiers.audio
    }
    /**
     * If this DataElement is audio, returns the data and format. Otherwise, throws an exception.
     */
    public getAudio(): { format: string; data: Buffer } {
        if (!this.isAudio()) {
            throw new Error('DataElement is not audio.')
        }
        return { format: this._data.slice(0, 3).toString(), data: this._data.slice(3) }
    }
    /**
     * Creates a new DataElement which holds audio.
     */
    public static audio(audioFormat: string, value: Buffer): DataElement {
        if (typeof audioFormat !== 'string') {
            throw new Error(`Expected audioFormat to be a string, got ${typeOf(audioFormat)}`)
        }
        if (!Buffer.isBuffer(value)) {
            throw new Error(`Expected value to be a Buffer, got ${typeOf(value)}`)
        }
        const formatBuf = Buffer.from(audioFormat)
        if (formatBuf.length !== 3) {
            throw new Error(`Expected audioFormat to be a string with length 3 bytes, got length ${formatBuf.length}`)
        }
        return new DataElement(typeSpecifiers.audio, Buffer.concat([formatBuf, value]))
    }

    /**
     * Returns true if this DataElement is a video.
     */
    public isVideo(): boolean {
        return this._type === typeSpecifiers.video
    }
    /**
     * If this DataElement is a video, returns the data and format. Otherwise, throws an exception.
     */
    public getVideo(): { format: string; data: Buffer } {
        if (!this.isVideo()) {
            throw new Error('DataElement is not a video.')
        }
        return { format: this._data.slice(0, 3).toString(), data: this._data.slice(3) }
    }
    /**
     * Creates a new DataElement which holds a video.
     */
    public static video(videoFormat: string, value: Buffer): DataElement {
        if (typeof videoFormat !== 'string') {
            throw new Error(`Expected videoFormat to be a string, got ${typeOf(videoFormat)}`)
        }
        if (!Buffer.isBuffer(value)) {
            throw new Error(`Expected value to be a Buffer, got ${typeOf(value)}`)
        }
        const formatBuf = Buffer.from(videoFormat)
        if (formatBuf.length !== 3) {
            throw new Error(`Expected videoFormat to be a string with length 3 bytes, got length ${formatBuf.length}`)
        }
        return new DataElement(typeSpecifiers.video, Buffer.concat([formatBuf, value]))
    }

    /**
     * Returns true if this DataElement is a dictionary (key/value pairs).
     */
    public isDict(): boolean {
        return this._type === typeSpecifiers.dict
    }
    /**
     * If this DataElement is a dictionary, returns a map of key/value pairs. Otherwise, throws an exception.
     */
    public getDict(): Map<string, Data | DataElement> {
        if (!this.isDict()) {
            throw new Error('DataElement is not a dict.')
        }
        const entries = new Map<string, Data | DataElement>()
        let pos = 0
        while (pos < this._data.byteLength) {
            const nameLength = this._data.readUInt8(pos)
            const name = this._data.slice(pos + 1, pos + 1 + nameLength).toString()
            pos += 1 + nameLength
            const [dataLength, vLength] = Varint.deserializeVarUint64(this._data.slice(pos))
            const dataLengthNum = Number(dataLength)
            const data = Data.deserializeDataOrDataElement(this._data.slice(pos + vLength, pos + vLength + dataLengthNum))
            pos += vLength + dataLengthNum

            entries.set(name, data)
        }
        return entries
    }
    /**
     * Creates a new DataElement which holds a dictionary (key/value pairs).
     */
    public static dict(entries: Map<string, Data | DataElement>): DataElement {
        if (!(entries instanceof Map)) {
            throw new Error(`Expected entries to be a Map, got ${typeOf(entries)}.`)
        }

        const bufs: Buffer[] = []

        entries.forEach((value, key) => {
            if (typeof key !== 'string') {
                throw new Error(`Expected each key of entries to be a string, got ${typeOf(key)}.`)
            }
            if (!(value instanceof Data || value instanceof DataElement)) {
                throw new Error(`Expected each value of entries to be a Data or DataElement instance, got ${typeOf(value)}.`)
            }
            const nameBuf = Buffer.from(key)
            if (nameBuf.byteLength > 255) {
                throw new Error(`Expected each key to be 255 bytes or shorter.`)
            }
            bufs.push(Buffer.from([nameBuf.length]), nameBuf)
            const dataBuf = value.serialize()
            const dataBufLengthVarint = Varint.serializeVarUint64(dataBuf.byteLength)
            bufs.push(dataBufLengthVarint, dataBuf)
        })

        return new DataElement(typeSpecifiers.dict, Buffer.concat([...bufs]))
    }

    /**
     * Returns true if this DataElement is an f32, f64, i8, i16, i32, i64, u8, u16, u32, or u64.
     */
    public isNumber(): boolean {
        return (
            this.isF32() ||
            this.isF64() ||
            this.isI8() ||
            this.isI16() ||
            this.isI32() ||
            this.isI64() ||
            this.isU8() ||
            this.isU16() ||
            this.isU32() ||
            this.isU64()
        )
    }
    /**
     * If this DataElement is a f32, f64, i8, i16, i32, i64, u8, u16, u32, or u64, returns the number. Otherwise, throws an exception.
     */
    public getNumber(): number {
        if (this.isF32()) {
            return this.getF32()
        } else if (this.isF64()) {
            return this.getF64()
        } else if (this.isI8()) {
            return this.getI8()
        } else if (this.isI16()) {
            return this.getI16()
        } else if (this.isI32()) {
            return this.getI32()
        } else if (this.isI64()) {
            return Number(this.getI64())
        } else if (this.isU8()) {
            return this.getU8()
        } else if (this.isU16()) {
            return this.getU16()
        } else if (this.isU32()) {
            return this.getU32()
        } else if (this.isU64()) {
            return Number(this.getU64())
        } else {
            throw new Error('DataElement is not a number.')
        }
    }

    /**
     * Returns the name of the type of the DataElement, i.e "f32", "string" or "image".
     */
    public type(): DataType | 'dict' {
        if (this.isF32()) {
            return 'f32'
        } else if (this.isF64()) {
            return 'f64'
        } else if (this.isI8()) {
            return 'i8'
        } else if (this.isI16()) {
            return 'i16'
        } else if (this.isI32()) {
            return 'i32'
        } else if (this.isI64()) {
            return 'i64'
        } else if (this.isU8()) {
            return 'u8'
        } else if (this.isU16()) {
            return 'u16'
        } else if (this.isU32()) {
            return 'u32'
        } else if (this.isU64()) {
            return 'u64'
        } else if (this.isString()) {
            return 'string'
        } else if (this.isBinary()) {
            return 'binary'
        } else if (this.isBoolean()) {
            return 'boolean'
        } else if (this.isImage()) {
            return 'image'
        } else if (this.isAudio()) {
            return 'audio'
        } else if (this.isVideo()) {
            return 'video'
        } else {
            return 'dict'
        }
    }

    public stringRepresentation() {
        if (this.isNumber()) {
            return `${this.type()}, ${this.getNumber()}`
        }
        if (this.isString()) {
            const s = this.getString()
            if (s.length > 100) {
                return `"${s.slice(0, 100)}" (and ${s.length - 100} more)`
            }
            return `"${s}"`
        }
        if (this.isBinary()) {
            return `binary, ${this.getBinary().byteLength} bytes`
        }
        if (this.isBoolean()) {
            return `${this.getBoolean()}`
        }
        if (this.isImage()) {
            const { format, data } = this.getImage()
            return `${format} image, ${data.byteLength} bytes`
        }
        if (this.isAudio()) {
            const { format, data } = this.getAudio()
            return `${format} audio, ${data.byteLength} bytes`
        }
        if (this.isVideo()) {
            const { format, data } = this.getVideo()
            return `${format} video, ${data.byteLength} bytes`
        }
        const d = this.getDict()
        const s = `{${Array.from(d.entries()).map(([key, value]) => `"${key}": ${value.toString()}`).join(', ')}}`
        return `dict, ${s}`
    }


    public toString() {
        return `DataElement(${this.stringRepresentation()})`
    }

    /**
     * Creates a binary representation of this DataElement.
     */
    public serialize(): Buffer {
        return Buffer.concat([Buffer.from([this._type]), this._data])
    }

    /**
     * Creates a DataElement from a binary representation.
     */
    public static deserialize(data: Buffer): DataElement {
        return new DataElement(data.readUInt8(0), data.slice(1))
    }

    public _serializeWithLength(): Buffer {
        if (
            this._type === typeSpecifiers.f32 ||
            this._type === typeSpecifiers.f64 ||
            this._type === typeSpecifiers.i8 ||
            this._type === typeSpecifiers.i16 ||
            this._type === typeSpecifiers.i32 ||
            this._type === typeSpecifiers.i64 ||
            this._type === typeSpecifiers.u8 ||
            this._type === typeSpecifiers.u16 ||
            this._type === typeSpecifiers.u32 ||
            this._type === typeSpecifiers.u64 ||
            this._type === typeSpecifiers.boolean
        ) {
            return Buffer.concat([Buffer.from([this._type]), this._data])
        } else {
            return Buffer.concat([Buffer.from([this._type]), Varint.serializeVarUint64(this._data.byteLength), this._data])
        }
    }

    public static _deserializeWithLength(type: number, data: Buffer): [DataElement, number] {
        if (type === typeSpecifiers.i8 || type === typeSpecifiers.u8) {
            return [new DataElement(type, data.slice(0, 1)), 1]
        } else if (type === typeSpecifiers.i16 || type === typeSpecifiers.u16) {
            return [new DataElement(type, data.slice(0, 2)), 2]
        } else if (type === typeSpecifiers.f32 || type === typeSpecifiers.i32 || type === typeSpecifiers.u32) {
            return [new DataElement(type, data.slice(0, 4)), 4]
        } else if (type === typeSpecifiers.f64) {
            return [new DataElement(type, data.slice(0, 8)), 8]
        } else if (type === typeSpecifiers.i64) {
            const l = Varint.getVarInt64Length(data)
            return [new DataElement(type, data.slice(0, l)), l]
        } else if (type === typeSpecifiers.u64) {
            const l = Varint.getVarUint64Length(data)
            return [new DataElement(type, data.slice(0, l)), l]
        } else if (type === typeSpecifiers.boolean) {
            return [new DataElement(type, data.slice(0, 1)), 1]
        } else if (
            type === typeSpecifiers.dict ||
            type === typeSpecifiers.string ||
            type === typeSpecifiers.binary ||
            type === typeSpecifiers.image ||
            type === typeSpecifiers.audio ||
            type === typeSpecifiers.video
        ) {
            const [length, vLength] = Varint.deserializeVarUint64(data)
            const lengthNum = Number(length)
            return [new DataElement(type, data.slice(vLength, vLength + lengthNum)), vLength + lengthNum]
        } else {
            throw new Error('Could not parse DataElement.')
        }
    }
}

/**
 * Helper class for reading, creating and manipulating data which can be sent to or received from Decthings functions.
 *
 * A Data is a list which can contain other Data or DataElements. All elements in the list must have the same number of dimensions. This means
 * that the data can either only contain Data which all have the same number of dimensions, or only contain DataElements.
 */
export class Data {
    private _inner: Data[] | DataElement[] = []
    private _shape: number[] = [0]

    constructor(data?: Data[] | DataElement[]) {
        if (data) {
            this.push(...data)
        }
    }

    /**
     * Returns the shape of the data.
     *
     * For example:
     *
     * [2, 3] would mean that this Data contains two Data which each contain three DataElements.
     *
     * [3, -1, 0] would mean that this Data contains three Data which each contain a different number of Data, which each contain zero elements.
     */
    public shape() {
        return this._shape.slice()
    }

    /**
     * Returns the number of elements in the list.
     */
    public length() {
        return this._inner.length
    }

    /**
     * Returns the element at an index.
     *
     * Throws if out of range.
     *
     * ```javascript
     * let element = data.get(0)
     * if (element instanceof Data) {
     *     // Do something as Data..
     * }
     * else {
     *     // Do something as DataElement..
     * }
     * ```
     */
    public get(index: number): Data | DataElement {
        if (this._inner.length <= index) {
            throw new Error('Index out of range.')
        }
        return this._inner[index]
    }
    /**
     * Checks to make sure that this Data contains Data, and then returns the Data at the given index.
     *
     * Throws if out of range, or if this Data is a list of DataElements, not Data.
     *
     * ```javascript
     * let element = data.getData(0)
     * // Do something as Data..
     * ```
     */
    public getData(index: number): Data {
        if (this._inner.length <= index) {
            throw new Error('Index out of range.')
        }
        const data = this._inner[index]
        if (!(data instanceof Data)) {
            throw new Error('Cannot get Data since this Data contains DataElement, not Data.')
        }
        return data
    }
    /**
     * Checks to make sure that this Data contains DataElements, and then returns the DataElement at the given index.
     *
     * Throws if out of range, or if this Data is a list of Data, not DataElements.
     *
     * ```javascript
     * let element = data.getElement(0)
     * // Do something as DataElement..
     * ```
     */
    public getElement(index: number): DataElement {
        if (this._inner.length <= index) {
            throw new Error('Index out of range.')
        }
        const data = this._inner[index]
        if (!(data instanceof DataElement)) {
            throw new Error('Cannot get DataElement since this Data contains Data, not DataElement.')
        }
        return data
    }

    /**
     * Returns a list of all entries in the list.
     *
     * ```javascript
     * let values = data.values()
     * values.forEach(element => {
     *     if (element instanceof Data) {
     *         // Do something as Data..
     *     }
     *     else {
     *         // Do something as DataElement..
     *     }
     * })
     * ```
     */
    public values(): Data[] | DataElement[] {
        return this._inner.slice()
    }
    /**
     * Returns a list of all entries in the list. The return value will be a list of Data, not DataElement.
     *
     * Throws if this is a list of DataElements.
     *
     * ```javascript
     * let values = data.valuesData()
     * values.forEach(element => {
     *     // Do something as Data..
     * })
     * ```
     */
    public valuesData(): Data[] {
        if (this._shape.length === 1) {
            throw new Error('Cannot get Data since this data contains DataElement, not Data.')
        }
        return this._inner.slice() as Data[]
    }
    /**
     * Returns a list of all entries in the list. The return value will be a list of Data, not DataElement.
     *
     * Throws if this is a list of Data.
     *
     * ```javascript
     * let values = data.valuesElements()
     * values.forEach(element => {
     *     // Do something as DataElement..
     * })
     * ```
     */
    public valuesElements(): DataElement[] {
        if (this._shape.length !== 1) {
            throw new Error('Cannot get DataElement since this data contains Data, not DataElement.')
        }
        return this._inner.slice() as DataElement[]
    }

    /**
     * Add items to the list.
     *
     * Throws if the shape is mismatched - that is, this Data would mix Data with DataElement, or if different Data in this list would have different number of dimensions.
     */
    public push(...items: Data[] | DataElement[]) {
        if (items.length === 0) {
            return
        }
        if (items[0] instanceof Data) {
            let mustMatchShape: number[]
            if (this._inner.length === 0) {
                mustMatchShape = items[0]._shape
            } else {
                if (this._shape.length === 1) {
                    throw new Error('Mismatched shape. A Data must either contain only DataElement or only Data.')
                }
                mustMatchShape = this._shape.slice(1)
            }
            for (const el of items.slice(1)) {
                if (!(el instanceof Data)) {
                    if (!((el as any) instanceof DataElement)) {
                        throw new Error(`Expected items to contain either Data or DataElement, got ${typeOf(el)}`)
                    }
                    throw new Error('Mismatched shape. A Data must either contain only DataElement or only Data.')
                }
                if (el._shape.length !== mustMatchShape.length) {
                    throw new Error(`Mismatched shape. All Data in this Data must have the same number of dimensions.`)
                }
                el._shape.forEach((n, i) => {
                    if (n !== mustMatchShape[i]) {
                        mustMatchShape[i] = -1
                    }
                })
            }
            ;(this._inner as Data[]).push(...(items as Data[]))
            this._shape = [this._inner.length, ...mustMatchShape]
        } else {
            for (const el of items) {
                if (!(el instanceof DataElement)) {
                    if (!((el as any) instanceof Data)) {
                        throw new Error(`Expected items to contain either Data or DataElement, got ${typeOf(el)}`)
                    }
                    throw new Error('Mismatched shape. A Data must either contain only DataElement or only Data.')
                }
            }
            if (this._inner.length === 0) {
                this._inner = items
                this._shape = [items.length]
            } else {
                if (this._shape.length !== 1) {
                    throw new Error('Mismatched shape. An Data must either contain only DataElement or only Data.')
                }
                ;(this._inner as DataElement[]).push(...(items as DataElement[]))
                this._shape[0] += items.length
            }
        }
    }

    /**
     * Remove items from the list, and optionally, insert items in their place. This works in the same way as Javascript array.splice().
     *
     * Throws if the shape is mismatched - that is, this Data would mix Data with DataElement, or if different Data in this list would have different number of dimensions.
     */
    public splice(start: number, deleteCount: number, ...items: Data[] | DataElement[]): Data[] | DataElement[] {
        if (start > this._inner.length) {
            this.push(...items)
            return []
        }
        const newInner = this._inner.slice()
        const spliced = newInner.splice(start, deleteCount, ...(items as Data[]))
        if (newInner.length === 0) {
            this._inner = newInner
            this._shape = [0]
            return spliced
        }
        if (newInner[0] instanceof Data) {
            const mustMatchShape = newInner[0]._shape
            for (const el of newInner.slice(1)) {
                if (!(el instanceof Data)) {
                    if (!((el as any) instanceof DataElement)) {
                        throw new Error(`Expected items to contain either Data or DataElement, got ${typeOf(el)}`)
                    }
                    throw new Error('Mismatched shape. A Data must either contain only DataElement or only Data.')
                }
                if (el._shape.length !== mustMatchShape.length) {
                    throw new Error(`Mismatched shape. All Data in this Data must have the same number of dimensions.`)
                }
                el._shape.forEach((n, i) => {
                    if (n !== mustMatchShape[i]) {
                        mustMatchShape[i] = -1
                    }
                })
            }
            this._inner = newInner
            this._shape = [newInner.length, ...mustMatchShape]
        } else {
            for (const el of newInner) {
                if (!(el instanceof DataElement)) {
                    if (!((el as any) instanceof Data)) {
                        throw new Error(`Expected items to contain either Data or DataElement, got ${typeOf(el)}`)
                    }
                    throw new Error('Mismatched shape. A Data must either contain only DataElement or only Data.')
                }
            }
            this._inner = newInner
            this._shape = [newInner.length]
        }
        return spliced
    }

    public stringRepresentation() {
        return `[${this.values().map((x: Data | DataElement) => `(${x.stringRepresentation()})`).join(', ')}]`
    }

    public toString() {
        return `Data(${this.stringRepresentation()})`
    }

    private _serialize(): [Buffer[], number] {
        let entriesLength = 0
        const entries: Buffer[] = []
        this._inner.forEach((el: Data | DataElement) => {
            if (el instanceof Data) {
                const [serialized, length] = el._serialize()
                const lengthVarint = Varint.serializeVarUint64(length)
                entries.push(Buffer.from([typeSpecifiers.array]), lengthVarint, ...serialized)
                entriesLength += 1 + lengthVarint.byteLength + length
            } else {
                const serialized = el._serializeWithLength()
                entriesLength += serialized.byteLength
                entries.push(serialized)
            }
        })
        return [entries, entriesLength]
    }

    /**
     * Create a binary representation of this Data.
     */
    public serialize(): Buffer {
        const [entries, length] = this._serialize()
        const serialized = Buffer.concat([Buffer.from([typeSpecifiers.array]), ...entries])
        return serialized
    }

    private static _deserialize(data: Buffer, sameType?: number): Data {
        if (typeof sameType === 'number') {
            if (sameType === typeSpecifiers.array) {
                const entries: Data[] = []

                let pos = 0
                while (pos < data.byteLength) {
                    const [length, vLength] = Varint.deserializeVarUint64(data.slice(pos))
                    const lengthNum = Number(length)
                    const deserialized = Data._deserialize(data.slice(pos + vLength, pos + vLength + lengthNum))
                    entries.push(deserialized)
                    pos += vLength + lengthNum
                }

                return new Data(entries)
            } else if (sameType === typeSpecifiers.arrayWithSameType) {
                const entries: Data[] = []

                let pos = 0
                while (pos < data.byteLength) {
                    const [length, vLength] = Varint.deserializeVarUint64(data.slice(pos))
                    const lengthNum = Number(length)
                    const nextSameType = data.readUInt8(pos + vLength)
                    const deserialized = Data._deserialize(data.slice(pos + vLength + 1, pos + vLength + 1 + lengthNum), nextSameType)
                    entries.push(deserialized)
                    pos += vLength + 1 + lengthNum
                }

                return new Data(entries)
            } else {
                const entries: DataElement[] = []

                let pos = 0
                while (pos < data.byteLength) {
                    const [element, length] = DataElement._deserializeWithLength(sameType, data.slice(pos))
                    entries.push(element)
                    pos += length
                }

                return new Data(entries)
            }
        } else {
            const entries: (Data | DataElement)[] = []

            let pos = 0
            while (pos < data.byteLength) {
                const type = data.readUInt8(pos)
                if (type === typeSpecifiers.array) {
                    const [length, vLength] = Varint.deserializeVarUint64(data.slice(pos + 1))
                    const lengthNum = Number(length)
                    const deserialized = Data._deserialize(data.slice(pos + 1 + vLength, pos + 1 + vLength + lengthNum))
                    entries.push(deserialized)
                    pos += vLength + 1 + lengthNum
                } else if (type === typeSpecifiers.arrayWithSameType) {
                    const [length, vLength] = Varint.deserializeVarUint64(data.slice(pos + 1))
                    const lengthNum = Number(length)
                    const nextSameType = data.readUInt8(pos + 1 + vLength)
                    const deserialized = Data._deserialize(data.slice(pos + 2 + vLength, pos + 2 + vLength + lengthNum), nextSameType)
                    entries.push(deserialized)
                    pos += 2 + vLength + lengthNum
                } else {
                    const [element, length] = DataElement._deserializeWithLength(type, data.slice(pos + 1))
                    entries.push(element)
                    pos += 1 + length
                }
            }

            try {
                return new Data(entries as Data[] | DataElement[])
            } catch {
                throw new Error('Could not parse Data.')
            }
        }
    }

    /**
     * Creates a Data from a binary representation.
     */
    public static deserialize(data: Buffer): Data {
        const type = data.readUInt8(0)
        if (type === typeSpecifiers.array) {
            return Data._deserialize(data.slice(1))
        } else if (type === typeSpecifiers.arrayWithSameType) {
            const sameType = data.readUInt8(1)
            return Data._deserialize(data.slice(2), sameType)
        } else {
            throw new Error('Could not parse Data.')
        }
    }

    /**
     * Deserializes a binary data which either was serialized from a DataElement or a Data into either a Data or DataElement.
     */
    public static deserializeDataOrDataElement(data: Buffer): Data | DataElement {
        const type = data.readUInt8(0)
        if (type === typeSpecifiers.array || type === typeSpecifiers.arrayWithSameType) {
            return Data.deserialize(data)
        }
        return DataElement.deserialize(data)
    }
}

/**
 * Defines name and rules for a parameter.
 */
export type ParameterDef = {
    name: string
    rules: DataRules
}

/**
 * Contains Data for a parameter.
 */
export type Parameter = {
    name: string
    data: Data
}

/**
 * Provides a Data for a parameter, either as a Data or as a dataset.
 */
export type ParameterProvider = {
    name: string
    data: Data | Buffer | { type: 'dataset'; datasetId: string; shuffle?: boolean }
}
