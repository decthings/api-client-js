import { Buffer } from 'buffer'

/**
 * All available data types.
 */
export type DecthingsElementType =
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

export const decthingsElementTypes: DecthingsElementType[] = [
    'f32',
    'f64',
    'i8',
    'i16',
    'i32',
    'i64',
    'u8',
    'u16',
    'u32',
    'u64',
    'string',
    'boolean',
    'binary',
    'image',
    'audio',
    'video'
]

export class DecthingsElementImage {
    public format: string
    public data: Buffer

    public constructor(format: String, data: Buffer) {
        if (typeof format != 'string') {
            throw new Error('Invalid format: Expected a string')
        }
        if (Buffer.from(format).byteLength != 3) {
            throw new Error('Invalid format: Expected exactly 3 bytes')
        }
        if (!Buffer.isBuffer(data)) {
            throw new Error('Invalid data: Expected a Buffer')
        }
        this.format = format
        this.data = data
    }
}

export class DecthingsElementAudio {
    public format: string
    public data: Buffer

    public constructor(format: String, data: Buffer) {
        if (typeof format != 'string') {
            throw new Error('Invalid format: Expected a string')
        }
        if (Buffer.from(format).byteLength != 3) {
            throw new Error('Invalid format: Expected exactly 3 bytes')
        }
        if (!Buffer.isBuffer(data)) {
            throw new Error('Invalid data: Expected a Buffer')
        }
        this.format = format
        this.data = data
    }
}

export class DecthingsElementVideo {
    public format: string
    public data: Buffer

    public constructor(format: String, data: Buffer) {
        if (typeof format != 'string') {
            throw new Error('Invalid format: Expected a string')
        }
        if (Buffer.from(format).byteLength != 3) {
            throw new Error('Invalid format: Expected exactly 3 bytes')
        }
        if (!Buffer.isBuffer(data)) {
            throw new Error('Invalid data: Expected a Buffer')
        }
        this.format = format
        this.data = data
    }
}

export type DecthingsTensorElement = number | BigInt | string | boolean | Buffer | DecthingsElementImage | DecthingsElementAudio | DecthingsElementVideo
