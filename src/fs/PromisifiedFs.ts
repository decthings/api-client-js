import FS from 'browserfs/dist/node/core/FS'
import Stats from 'browserfs/dist/node/core/node_fs_stats'
import { ApiError } from 'browserfs/dist/node/core/api_error'

export interface PromisifiedFS {
    access(path: string | Buffer, callback: (err: ApiError | null | undefined) => void): void
    access(path: string | Buffer, mode: number, callback: (err: ApiError | null | undefined) => void): void
    access(path: string | Buffer, mode?: number): Promise<void>

    /**
     * Asynchronously append data to a file, creating the file if it not yet
     * exists.
     *
     * @example Usage example
     *   fs.appendFile('message.txt', 'data to append', function (err) {
     *     if (err) throw err;
     *     console.log('The "data to append" was appended to file!');
     *   });
     * @param filename
     * @param data
     * @param options
     * @option options [String] encoding Defaults to `'utf8'`.
     * @option options [Number] mode Defaults to `0644`.
     * @option options [String] flag Defaults to `'a'`.
     * @param callback
     */
    appendFile(
        file: string | Buffer | number,
        data: any,
        options: { encoding?: string; mode?: number | string; flag?: string },
        callback: (err: ApiError | null | undefined) => void
    ): void
    appendFile(file: string | Buffer | number, data: any, callback: (err: ApiError | null | undefined) => void): void
    appendFile(file: string | Buffer | number, data: any, options?: { encoding?: string; mode?: number | string; flag?: string }): Promise<void>

    chmod(path: string | Buffer, mode: string | number, callback: (err: ApiError | null | undefined) => void): void
    chmod(path: string | Buffer, mode: string | number): Promise<void>

    chown(path: string | Buffer, uid: number, gid: number): Promise<void>
    chown(path: string | Buffer, uid: number, gid: number, callback: (err: ApiError | null | undefined) => void): void

    close(fd: number, callback: (err: ApiError | null | undefined) => void): void
    close(fd: number): Promise<void>

    fchmod(fd: number, mode: string | number, callback: (err: ApiError | null | undefined) => void): void
    fchmod(fd: number, mode: string | number): Promise<void>

    fchown(fd: number, uid: number, gid: number, callback: (err: ApiError | null | undefined) => void): void
    fchown(fd: number, uid: number, gid: number): Promise<void>

    fdatasync(fd: number, callback: () => void): void
    fdatasync(fd: number): Promise<void>

    fstat(fd: number, callback: (err: ApiError | null | undefined, stats: Stats) => any): void
    fstat(fd: number): Promise<Stats>

    fsync(fd: number, callback: (err: ApiError | null | undefined) => void): void
    fsync(fd: number): Promise<void>

    ftruncate(fd: number, callback: (err: ApiError | null | undefined) => void): void
    ftruncate(fd: number, len: number, callback: (err: ApiError | null | undefined) => void): void
    ftruncate(fd: number, len?: number): Promise<void>

    futimes(fd: number, atime: number, mtime: number, callback: (err: ApiError | null | undefined) => void): void
    futimes(fd: number, atime: Date, mtime: Date, callback: (err: ApiError | null | undefined) => void): void
    futimes(fd: number, atime: number, mtime: number): Promise<void>
    futimes(fd: number, atime: Date, mtime: Date): Promise<void>

    lchown(path: string | Buffer, uid: number, gid: number, callback: (err: ApiError | null | undefined) => void): void
    lchown(path: string | Buffer, uid: number, gid: number): Promise<void>

    link(srcpath: string | Buffer, dstpath: string | Buffer, callback: (err: ApiError | null | undefined) => void): void
    link(srcpath: string | Buffer, dstpath: string | Buffer): Promise<void>

    lstat(path: string | Buffer, callback: (err: ApiError | null | undefined, stats: Stats) => any): void
    lstat(path: string | Buffer): Promise<Stats>

    mkdir(path: string | Buffer, callback: (err: ApiError | null | undefined) => void): void
    mkdir(path: string | Buffer, mode: number | string, callback: (err: ApiError | null | undefined) => void): void
    mkdir(path: string | Buffer): Promise<void>

    mkdtemp(prefix: string): Promise<string>
    mkdtemp(prefix: string, callback: (err: ApiError | null | undefined, folder: string) => void): void

    /**
     * Asynchronous file open.
     * Exclusive mode ensures that path is newly created.
     *
     * `flags` can be:
     *
     * * `'r'` - Open file for reading. An exception occurs if the file does not exist.
     * * `'r+'` - Open file for reading and writing. An exception occurs if the file does not exist.
     * * `'rs'` - Open file for reading in synchronous mode. Instructs the filesystem to not cache writes.
     * * `'rs+'` - Open file for reading and writing, and opens the file in synchronous mode.
     * * `'w'` - Open file for writing. The file is created (if it does not exist) or truncated (if it exists).
     * * `'wx'` - Like 'w' but opens the file in exclusive mode.
     * * `'w+'` - Open file for reading and writing. The file is created (if it does not exist) or truncated (if it exists).
     * * `'wx+'` - Like 'w+' but opens the file in exclusive mode.
     * * `'a'` - Open file for appending. The file is created if it does not exist.
     * * `'ax'` - Like 'a' but opens the file in exclusive mode.
     * * `'a+'` - Open file for reading and appending. The file is created if it does not exist.
     * * `'ax+'` - Like 'a+' but opens the file in exclusive mode.
     *
     * @see http://www.manpagez.com/man/2/open/
     * @param path
     * @param flags
     * @param mode defaults to `0644`
     * @param callback
     */
    open(path: string | Buffer, flags: string | number, callback: (err: ApiError | null | undefined, fd: number) => void): void
    open(path: string | Buffer, flags: string | number, mode: number, callback: (err: ApiError | null | undefined, fd: number) => void): void
    open(path: string | Buffer, flags: string | number, mode?: number): Promise<number>

    /**
     * Read data from the file specified by `fd`.
     * @param buffer The buffer that the data will be
     *   written to.
     * @param offset The offset within the buffer where writing will
     *   start.
     * @param length An integer specifying the number of bytes to read.
     * @param position An integer specifying where to begin reading from
     *   in the file. If position is null, data will be read from the current file
     *   position.
     * @param callback The number is the number of bytes read
     */
    read(
        fd: number,
        buffer: Buffer,
        offset: number,
        length: number,
        position: number | null,
        callback: (err: ApiError | null | undefined, bytesRead?: number, buffer?: Buffer) => void
    ): void | Promise<ReadResult>
    read(fd: number, buffer: Buffer, offset: number, length: number, position: number | null): void | Promise<ReadResult>

    /**
     * Asynchronously reads the entire contents of a file.
     * @example Usage example
     *   fs.readFile('/etc/passwd', function (err, data) {
     *     if (err) throw err;
     *     console.log(data);
     *   });
     * @param filename
     * @param options
     * @option options [String] encoding The string encoding for the file contents. Defaults to `null`.
     * @option options [String] flag Defaults to `'r'`.
     * @param callback If no encoding is specified, then the raw buffer is returned.
     */
    readFile(file: string | Buffer | number, callback: (err: ApiError | null | undefined, data: Buffer) => void): void
    readFile(file: string | Buffer | number, encoding: string, callback: (err: ApiError | null | undefined, data: string) => void): void
    readFile(
        file: string | Buffer | number,
        options: { flag?: string } | { encoding: string; flag?: string },
        callback: (err: ApiError | null | undefined, data: Buffer) => void
    ): void
    readFile(file: string | Buffer | number, options: { flag?: string } | { encoding: string; flag?: string }): Promise<string>
    // tslint:disable-next-line:unified-signatures
    readFile(file: string | Buffer | number, encoding: string): Promise<string>
    readFile(file: string | Buffer | number): Promise<Buffer>

    /**
     * Asynchronous `readdir`. Reads the contents of a directory.
     * The callback gets two arguments `(err, files)` where `files` is an array of
     * the names of the files in the directory excluding `'.'` and `'..'`.
     * @param path
     * @param callback
     */
    readdir(path: string | Buffer, callback: (err: ApiError | null | undefined, files: string[]) => void): void
    readdir(path: string | Buffer): Promise<string[]>

    readlink(path: string | Buffer, callback: (err: ApiError | null | undefined, linkString: string) => any): void
    readlink(path: string | Buffer): Promise<string>

    /**
     * Asynchronous `realpath`. The callback gets two arguments
     * `(err, resolvedPath)`. May use `process.cwd` to resolve relative paths.
     *
     * @example Usage example
     *   let cache = {'/etc':'/private/etc'};
     *   fs.realpath('/etc/passwd', cache, function (err, resolvedPath) {
     *     if (err) throw err;
     *     console.log(resolvedPath);
     *   });
     *
     * @param path
     * @param cache An object literal of mapped paths that can be used to
     *   force a specific path resolution or avoid additional `fs.stat` calls for
     *   known real paths.
     * @param callback
     */
    realpath(path: string | Buffer, callback: (err: ApiError | null | undefined, resolvedPath: string) => any): void
    realpath(path: string | Buffer, cache: { [path: string]: string }, callback: (err: ApiError | null | undefined, resolvedPath: string) => any): void
    realpath(path: string | Buffer, cache?: { [path: string]: string }): Promise<string>

    /**
     * Asynchronous rename. No arguments other than a possible exception are given
     * to the completion callback.
     * @param oldPath
     * @param newPath
     * @param callback
     */
    rename(oldPath: string, newPath: string, callback: (err: ApiError | null | undefined) => void): void
    rename(oldPath: string, newPath: string): Promise<void>

    rmdir(path: string | Buffer, callback: (err: ApiError | null | undefined) => void): void
    rmdir(path: string | Buffer): Promise<void>

    stat(path: string | Buffer, callback: (err: ApiError | null | undefined, stats: Stats) => any): void
    stat(path: string | Buffer): Promise<Stats>

    symlink(srcpath: string | Buffer, dstpath: string | Buffer, type: FsSymlinkType | undefined, callback: (err: ApiError | null | undefined) => void): void
    symlink(srcpath: string | Buffer, dstpath: string | Buffer, callback: (err: ApiError | null | undefined) => void): void
    symlink(srcpath: string | Buffer, dstpath: string | Buffer, type?: FsSymlinkType): Promise<void>

    truncate(path: string | Buffer, callback: (err: ApiError | null | undefined) => void): void
    truncate(path: string | Buffer, len: number, callback: (err: ApiError | null | undefined) => void): void
    truncate(path: string | Buffer, len?: number): Promise<void>

    unlink(path: string | Buffer, callback: (err: ApiError | null | undefined) => void): void
    unlink(path: string | Buffer): Promise<void>

    utimes(path: string | Buffer, atime: number, mtime: number, callback: (err: ApiError | null | undefined) => void): void
    utimes(path: string | Buffer, atime: Date, mtime: Date, callback: (err: ApiError | null | undefined) => void): void
    utimes(path: string | Buffer, atime: number, mtime: number): Promise<void>
    utimes(path: string | Buffer, atime: Date, mtime: Date): Promise<void>

    /**
     * Write buffer to the file specified by `fd`.
     * Note that it is unsafe to use fs.write multiple times on the same file
     * without waiting for the callback.
     * @param fd
     * @param buffer Buffer containing the data to write to
     *   the file.
     * @param offset Offset in the buffer to start reading data from.
     * @param length The amount of bytes to write to the file.
     * @param position Offset from the beginning of the file where this
     *   data should be written. If position is null, the data will be written at
     *   the current position.
     * @param callback The number specifies the number of bytes written into the file.
     */
    write(
        fd: number,
        buffer: Buffer,
        offset: number,
        length: number,
        position: number | null,
        callback: (err: ApiError | null | undefined, written: number, buffer: Buffer) => void
    ): void | Promise<WriteResult>
    write(
        fd: number,
        buffer: Buffer,
        offset: number,
        length: number,
        callback: (err: ApiError | null | undefined, written: number, buffer: Buffer) => void
    ): void | Promise<WriteResult>
    write(fd: number, data: any, callback: (err: ApiError | null | undefined, written: number, str: string) => void): void | Promise<WriteResult>
    write(
        fd: number,
        data: any,
        offset: number,
        callback: (err: ApiError | null | undefined, written: number, str: string) => void
    ): void | Promise<WriteResult>
    write(
        fd: number,
        data: any,
        offset: number,
        encoding: string,
        callback: (err: ApiError | null | undefined, written: number, str: string) => void
    ): void | Promise<WriteResult>
    write(fd: number, buffer: Buffer, offset: number, length: number, position?: number | null): void | Promise<WriteResult>
    write(fd: number, data: any, offset: number, encoding?: string): void | Promise<WriteResult>

    /**
     * Asynchronously writes data to a file, replacing the file if it already
     * exists.
     *
     * The encoding option is ignored if data is a buffer.
     *
     * @example Usage example
     *   fs.writeFile('message.txt', 'Hello Node', function (err) {
     *     if (err) throw err;
     *     console.log('It\'s saved!');
     *   });
     * @param filename
     * @param data
     * @param options
     * @option options [String] encoding Defaults to `'utf8'`.
     * @option options [Number] mode Defaults to `0644`.
     * @option options [String] flag Defaults to `'w'`.
     * @param callback
     */
    writeFile(file: string | Buffer | number, data: any, callback: (err: ApiError | null | undefined) => void): void
    writeFile(file: string | Buffer | number, data: any, options?: WriteFileOptions | string): Promise<void>
    writeFile(file: string | Buffer | number, data: any, options: WriteFileOptions | string, callback: (err: ApiError | null | undefined) => void): void
}

export function getPromisifiedFS(fs: FS): PromisifiedFS {
    const api = [
        'access',
        'appendFile',
        'chmod',
        'chown',
        'close',
        'copyFile',
        'fchmod',
        'fchown',
        'fdatasync',
        'fstat',
        'fsync',
        'ftruncate',
        'futimes',
        'lchown',
        'lchmod',
        'link',
        'lstat',
        'mkdir',
        'mkdtemp',
        'open',
        'readFile',
        'readdir',
        'readlink',
        'realpath',
        'rename',
        'rmdir',
        'stat',
        'symlink',
        'truncate',
        'unlink',
        'utimes',
        'writeFile'
    ].filter((key) => {
        // Some commands are not available on some systems. Ex:
        // fs.copyFile was added in Node.js v8.5.0
        // fs.mkdtemp was added in Node.js v5.10.0
        // fs.lchown is not available on at least some Linux
        return typeof (fs as any)[key] === 'function'
    })
    let pFS: PromisifiedFS = {} as any
    function universify(fn: any) {
        return Object.defineProperty(
            function (this: any, ...args: any[]) {
                if (typeof args[args.length - 1] === 'function') fn.apply(this, args)
                else {
                    return new Promise((resolve, reject) => {
                        args[args.length] = (err: any, res: any) => {
                            if (err) return reject(err)
                            resolve(res)
                        }
                        args.length++
                        fn.apply(this, args)
                    })
                }
            },
            'name',
            { value: fn.name }
        )
    }
    api.forEach((method) => {
        ;(pFS as any)[method] = universify((fs as any)[method])
    })

    // fs.read() & fs.write need special treatment due to multiple callback args

    pFS.read = function (
        fd: number,
        buffer: Buffer,
        offset: number,
        length: number,
        position: number | null,
        callback?: (err: ApiError | null | undefined, bytesRead?: number, buffer?: Buffer) => void
    ) {
        if (typeof callback === 'function') {
            return fs.read(fd, buffer, offset, length, position, callback)
        }
        return new Promise<ReadResult>((resolve, reject) => {
            fs.read(fd, buffer, offset, length, position, (err, bytesRead, buffer) => {
                if (err) return reject(err)
                resolve({ bytesRead, buffer })
            })
        })
    }

    // Function signature can be
    // fs.write(fd, buffer[, offset[, length[, position]]], callback)
    // OR
    // fs.write(fd, string[, position[, encoding]], callback)
    // We need to handle both cases, so we use ...args
    pFS.write = function (fd: number, buffer: Buffer, ...args: any[]) {
        if (typeof args[args.length - 1] === 'function') {
            return fs.write(fd, buffer, ...args)
        }

        return new Promise<WriteResult>((resolve, reject) => {
            fs.write(fd, buffer, ...args, (err: ApiError | undefined | null, bytesWritten: number, buffer: Buffer) => {
                if (err) return reject(err)
                resolve({ bytesWritten, buffer })
            })
        })
    }

    return pFS
}

export type SymlinkType = 'dir' | 'file'
export type FsSymlinkType = 'dir' | 'file' | 'junction'

export interface WriteFileOptions {
    encoding?: string
    flag?: string
    mode?: number
}

export interface WriteOptions extends WriteFileOptions {
    fs?: object
    replacer?: any
    spaces?: number | string
    EOL?: string
}

export interface ReadResult {
    bytesRead?: number
    buffer?: Buffer
}

export interface WriteResult {
    bytesWritten?: number
    buffer?: Buffer
}
