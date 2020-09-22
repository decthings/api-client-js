import {
    BaseFileSystem,
    FileSystem,
    BFSOneArgCallback,
    BFSCallback,
    FileSystemOptions,
    BFSThreeArgCallback
} from 'browserfs/dist/node/core/file_system'
import { FileFlag, ActionType } from 'browserfs/dist/node/core/file_flag'
import { default as Stats, FileType } from 'browserfs/dist/node/core/node_fs_stats'
import { ApiError, ErrorCode } from 'browserfs/dist/node/core/api_error'
import { File, BaseFile } from 'browserfs/dist/node/core/file'
import setImmediate from 'browserfs/dist/node/generic/setImmediate'
import { IDecthingsFs } from '../../types/DecthingsFs'

function getApiError(e: string, path: string): ApiError {
    switch (e) {
        case 'ENOTEMPTY':
            return ApiError.ENOTEMPTY(path)
        case 'EEXIST':
            return ApiError.EEXIST(path)
        case 'EISDIR':
            return ApiError.EISDIR(path)
        case 'ENOTDIR':
            return ApiError.ENOTDIR(path)
        case 'ENOENT':
            return ApiError.ENOENT(path)
        default:
            return new ApiError(ErrorCode.EIO)
    }
}

class DecthingsFsFile extends BaseFile implements File {
    constructor(private filename: string, private client: IDecthingsFs, private mode?: number) {
        super()
    }
    public getPos(): number | undefined {
        return undefined
    }
    public close(cb: BFSOneArgCallback): void {
        //NOP
        cb(null)
    }
    public closeSync() {
        // NOP
    }
    public stat(cb: BFSCallback<Stats>) {
        this.client.getattr(this.filename, false).then(
            stats => {
                cb(null, new Stats(FileType.FILE, stats.size, this.mode, new Date(stats.atime), new Date(stats.mtime), new Date(stats.ctime)))
            },
            () => {
                cb(new ApiError(ErrorCode.EIO))
            }
        )
    }
    public statSync(): Stats {
        throw new ApiError(ErrorCode.ENOTSUP)
    }
    public truncate(len: number, cb: BFSOneArgCallback): void {
        this.client.truncate(this.filename, len).then(
            () => {
                cb()
            },
            () => {
                cb(new ApiError(ErrorCode.EIO))
            }
        )
    }
    public truncateSync(): void {
        throw new ApiError(ErrorCode.ENOTSUP)
    }
    public write(
        buffer: Buffer,
        offset: number,
        length: number,
        position: number,
        cb: BFSThreeArgCallback<number, Buffer>
    ): void {
        this.client.write(this.filename, buffer.slice(offset, length), position).then(
            written => {
                cb(null, written, buffer)
            },
            () => {
                cb(new ApiError(ErrorCode.EIO))
            }
        )
    }
    public writeSync(): number {
        throw new ApiError(ErrorCode.ENOTSUP)
    }
    public read(buffer: Buffer, offset: number, length: number, position: number, cb: BFSThreeArgCallback<number, Buffer>): void {
        this.client.read(this.filename, position, length).then(
            data => {
                data.copy(buffer, offset, 0, length)
                cb(null, data.length, buffer)
            },
            (e) => {
                cb(new ApiError(ErrorCode.EIO))
            }
        )
    }
    public readSync(): number {
        throw new ApiError(ErrorCode.ENOTSUP)
    }
    public sync(cb: BFSOneArgCallback): void {
        // NOP.
        cb()
    }
    public syncSync(): void {
        // NOP.
    }
    public chown(uid: number, gid: number, cb: BFSOneArgCallback): void {
        cb(new ApiError(ErrorCode.ENOTSUP))
    }
    public chownSync(uid: number, gid: number): void {
        throw new ApiError(ErrorCode.ENOTSUP)
    }
    public chmod(mode: number, cb: BFSOneArgCallback): void {
        cb(new ApiError(ErrorCode.ENOTSUP))
    }
    public chmodSync(mode: number): void {
        throw new ApiError(ErrorCode.ENOTSUP)
    }
    public utimes(atime: Date, mtime: Date, cb: BFSOneArgCallback): void {
        this.client.utimes(this.filename, atime.getTime(), mtime.getTime()).then(
            () => {
                cb()
            },
            () => {
                cb(new ApiError(ErrorCode.EIO))
            }
        )
    }
    public utimesSync(atime: Date, mtime: Date): void {
        throw new ApiError(ErrorCode.ENOTSUP)
    }
}

export interface DecthingsFsFileSystemOptions {
    backend: () => IDecthingsFs
    mode?: number
}

export default class DecthingsFsFileSystem extends BaseFileSystem implements FileSystem {
    public static readonly Name = 'DecthingsFsFileSystem'

    public static readonly Options: FileSystemOptions = {
        backend: {
            type: 'function',
            optional: false,
            description: 'Backend to use for communicating with Decthings.'
        },
        mode: {
            type: 'number',
            optional: true,
            description: 'The permissions to apply to all files and folders within the FileSystem.'
        }
    }

    /**
     * Creates a new DecthingsFsFileSystem instance with the given options.
     */
    public static Create(opts: DecthingsFsFileSystemOptions, cb: BFSCallback<DecthingsFsFileSystem>): void {
        cb(null, new DecthingsFsFileSystem(opts.backend()))
    }

    public static isAvailable(): boolean {
        return true
    }

    private _backend: IDecthingsFs
    private _mode?: number

    private constructor(backend: IDecthingsFs, mode?: number) {
        super()
        this._backend = backend
        this._mode = typeof mode === 'number' ? mode : parseInt('777', 8)
    }

    public getName(): string {
        return DecthingsFsFileSystem.Name
    }

    public isReadOnly(): boolean {
        return false
    }

    // We don't support properties or sync operations

    public supportsProps(): boolean {
        return false
    }

    public supportsSynch(): boolean {
        return false
    }

    /**
     * Deletes *everything* in the file system. Mainly intended for unit testing!
     * @param mainCb Called when operation completes.
     */
    public empty(mainCb: BFSOneArgCallback): void {
        mainCb(new ApiError(ErrorCode.ENOTSUP))
    }

    public rename(oldPath: string, newPath: string, cb: BFSOneArgCallback): void {
        this._backend
            .rename(oldPath, newPath)
            .then(() => cb())
            .catch(function(e: string) {
                cb(getApiError(e, oldPath))
            })
    }

    public stat(path: string, isLstat: boolean, cb: BFSCallback<Stats>): void {
        if (path === '/') {
            setImmediate(() => {
                cb(null, new Stats(FileType.DIRECTORY, 4096, this._mode, new Date(0), new Date(0), new Date(0)))
            })
            return
        }
        this._backend
            .getattr(path, isLstat)
            .then(metadata => {
                cb(
                    null,
                    new Stats(
                        metadata.type === 'directory' ? FileType.DIRECTORY : metadata.type === 'file' ? FileType.FILE : FileType.SYMLINK,
                        metadata.size,
                        this._mode,
                        new Date(metadata.atime),
                        new Date(metadata.mtime),
                        new Date(metadata.ctime)
                    )
                )
            })
            .catch((e: string) => {
                cb(getApiError(e, path))
            })
    }

    public open(path: string, flags: FileFlag, mode: number, cb: BFSCallback<File>): void {
        const exists = () => {
            switch (flags.pathExistsAction()) {
                case ActionType.THROW_EXCEPTION: {
                    cb(getApiError('EEXIST', path ))
                    break
                }
                case ActionType.TRUNCATE_FILE: {
                    this._backend.truncate(path, 0).then(() => {
                        cb(null, new DecthingsFsFile(path, this._backend, this._mode))
                    }, (err: string) => {
                        if (err === 'ENOENT') {
                            // The file was removed.
                            notExists()
                        }
                        else {
                            cb(getApiError(err, path))
                        }
                    })
                    break
                }
                default: {
                    cb(null, new DecthingsFsFile(path, this._backend, this._mode))
                }
            }
        }
        const notExists = () => {
            if (flags.pathNotExistsAction() === ActionType.CREATE_FILE) {
                this._backend.create(path).then(
                    fh => {
                        cb(null, new DecthingsFsFile(path, this._backend, this._mode))
                    },
                    err2 => {
                        cb(getApiError(err2, path))
                    }
                )
            } else {
                cb(getApiError('ENOENT', path ))
            }
        }
        this._backend.getattr(path, false).then(
            () => {
                // The file exists
                exists()
            },
            (err: string) => {
                if (err === 'ENOENT') {
                    notExists()
                } else {
                    cb(getApiError(err, path))
                }
            }
        )
    }

    public createFile(path: string, flags: FileFlag, mode: number, cb: BFSCallback<File>): void {
        this._backend
            .create(path)
            .then(() => {
                cb(null, new DecthingsFsFile(path, this._backend, this._mode))
            })
            .catch((e: string) => {
                cb(getApiError(e, path))
            })
    }

    /**
     * Delete a file
     */
    public unlink(path: string, cb: BFSOneArgCallback): void {
        this._backend
            .remove(path)
            .then(() => {
                cb()
            })
            .catch((e: string) => {
                cb(getApiError(e, path))
            })
    }

    /**
     * Delete a directory
     */
    public rmdir(path: string, cb: BFSOneArgCallback): void {
        this._backend
            .rmdir(path)
            .then(() => {
                cb()
            })
            .catch((e: string) => {
                cb(getApiError(e, path))
            })
    }

    /**
     * Create a directory
     */
    public mkdir(path: string, mode: number, cb: BFSOneArgCallback): void {
        this._backend
            .mkdir(path)
            .then(() => {
                cb()
            })
            .catch((e: string) => {
                cb(getApiError(e, path))
            })
    }

    /**
     * Get the names of the files in a directory
     */
    public readdir(path: string, cb: BFSCallback<string[]>): void {
        this._backend
            .readdir(path)
            .then(res => {
                cb(null, res)
            })
            .catch((e: string) => {
                cb(getApiError(e, path))
            })
    }

    public symlink(srcpath: string, dstpath: string, type: string, cb: BFSOneArgCallback) {
        this._backend.symlink(srcpath, dstpath).then(() => {
            cb()
        })
        .catch((e: string) => {
            cb(getApiError(e, srcpath))
        })
    }

    public utimes(path: string, atime: Date, mtime: Date, cb: BFSOneArgCallback): void {
        this._backend.utimes(path, atime.getTime(), mtime.getTime()).then(() => {
            cb()
        }, (e: string) => {
            cb(getApiError(e, path));
        })
      }
    
    public readlink(path: string, cb: BFSCallback<string>) {
        this._backend.readlink(path).then((linkString) => {
            cb(null, linkString)
        }, (e) => {
            cb(getApiError(e, path))
        })
    }
}
