import { GenericError } from './Error'

export type Stat = {
    mode: number
    nlink: number
    rdev: number
    size: number
    blksize: number
    blocks: number
    atime: number
    atime_nsec: number
    mtime: number
    mtime_nsec: number
    ctime: number
    ctime_nsec: number
}

export interface FsRpc {
    /**
     * Get file information from its name.
     *
     * Errors:
     * ESTALE - The parent inode does not exist.
     * ENOENT - The name does not exist within the directory.
     * ENOTDIR - The parent inode was not a directory.
     */
    lookup(params: { modelId: string; snapshotId: string | null; parent: number; name: string | Buffer }): Promise<{
        error?:
            | {
                  code: 'model_not_found' | 'snapshot_not_found' | 'invalid_executor_type' | 'ESTALE' | 'ENOENT' | 'ENOTDIR'
              }
            | GenericError
        result?: {
            inode: number
            stat: Stat
        }
    }>

    /**
     * Get file information from its inode number.
     *
     * Errors:
     * ESTALE - The inode does not exist.
     */
    getattr(params: { modelId: string; snapshotId: string | null; inode: number }): Promise<{
        error?:
            | {
                  code: 'model_not_found' | 'snapshot_not_found' | 'invalid_executor_type' | 'ESTALE'
              }
            | GenericError
        result?: {
            stat: Stat
        }
    }>

    /**
     * Set file information.
     *
     * Errors:
     * ESTALE - The inode does not exist.
     * EFBIG - The target size is too large.
     * EISDIR - Attempted to resize a directory.
     */
    setattr(params: {
        modelId: string
        inode: number
        mode?: number
        size?: number
        atime?: {
            sec: number
            nsec: number
        }
        mtime?: {
            sec: number
            nsec: number
        }
    }): Promise<{
        error?:
            | {
                  code: 'model_not_found' | 'invalid_executor_type' | 'access_denied' | 'ESTALE' | 'EFBIG' | 'EISDIR'
              }
            | GenericError
        result?: {
            stat: Stat
        }
    }>

    /**
     * Create a regular or special file.
     *
     * Errors:
     * ESTALE - The parent inode does not exist.
     * ENOTDIR - The parent inode is not a directory.
     * EEXIST - The name already exists within the directory.
     * ENOSPC - There is not enough space within the filesystem.
     */
    mknod(params: { modelId: string; parent: number; name: string | Buffer; mode: number; dev: number }): Promise<{
        error?:
            | {
                  code: 'model_not_found' | 'invalid_executor_type' | 'access_denied' | 'ESTALE' | 'ENOTDIR' | 'EEXIST' | 'ENOSPC'
              }
            | GenericError
        result?: {
            inode: number
            stat: Stat
        }
    }>

    /**
     * Read from a file.
     *
     * Errors:
     * ESTALE - The inode does not exist.
     * EISDIR - The inode was a directory.
     * EINVAL - The inode was not a file suitable for reading.
     */
    read(params: { modelId: string; snapshotId: string | null; inode: number; offset: number; count: number }): Promise<{
        error?:
            | {
                  code: 'model_not_found' | 'snapshot_not_found' | 'invalid_executor_type' | 'ESTALE' | 'EISDIR' | 'EINVAL'
              }
            | GenericError
        result?: {
            data: Buffer
        }
    }>

    /**
     * Write to a file. If successful, it is not guaranteed that all bytes were written. The return value bytesWritten contains the number of
     * bytes written.
     *
     * Errors:
     * ESTALE - The inode does not exist.
     * EISDIR - The inode was a directory.
     * ENOSPC - Not enough space on the filesystem to perform the write.
     * EINVAL - The inode was not a file suitable for writing.
     */
    write(params: { modelId: string; inode: number; data: Buffer; offset: number; truncate?: boolean }): Promise<{
        error?:
            | {
                  code: 'model_not_found' | 'invalid_executor_type' | 'access_denied' | 'ESTALE' | 'EISDIR' | 'ENOSPC' | 'EINVAL'
              }
            | GenericError
        result?: {
            bytesWritten: number
        }
    }>

    /**
     * Create a symbolic link.
     *
     * Errors:
     * ESTALE - The parent inode does not exist.
     * ENOTDIR - The parent inode is not a directory.
     * EEXIST - The name already exists within the directory.
     * ENOSPC - There is not enough space within the filesystem.
     */
    symlink(params: { modelId: string; parent: number; name: string | Buffer; link: string | Buffer }): Promise<{
        error?:
            | {
                  code: 'model_not_found' | 'invalid_executor_type' | 'access_denied' | 'ESTALE' | 'ENOTDIR' | 'EEXIST' | 'ENOSPC'
              }
            | GenericError
        result?: {
            inode: number
            stat: Stat
        }
    }>

    /**
     * Read the link value of a symbolic link.
     *
     * Errors:
     * ESTALE - The inode does not exist.
     * EINVAL - The inode was not a symbolic link.
     */
    readlink(params: { modelId: string; snapshotId: string | null; inode: number }): Promise<{
        error?:
            | {
                  code: 'model_not_found' | 'snapshot_not_found' | 'invalid_executor_type' | 'ESTALE' | 'EINVAL'
              }
            | GenericError
        result?: {
            link: Buffer
        }
    }>

    /**
     * Create a directory.
     *
     * Errors:
     * ESTALE - The parent inode does not exist.
     * ENOTDIR - The parent inode is not a directory.
     * EEXIST - The name already exists within the directory.
     * ENOSPC - There is not enough space within the filesystem.
     */
    mkdir(params: { modelId: string; parent: number; name: string | Buffer; mode: number }): Promise<{
        error?:
            | {
                  code: 'model_not_found' | 'invalid_executor_type' | 'access_denied' | 'ESTALE' | 'ENOTDIR' | 'EEXIST' | 'ENOSPC'
              }
            | GenericError
        result?: {
            inode: number
            stat: Stat
        }
    }>

    /**
     * Remove a name for a regular or special file.
     *
     * Errors:
     * ESTALE - The parent inode does not exist.
     * ENOTDIR - The parent inode is not a directory.
     * ENOENT - The name does not exist within the directory.
     * EISDIR - The file pointed to by name is a directory.
     */
    unlink(params: { modelId: string; parent: number; name: string | Buffer }): Promise<{
        error?:
            | {
                  code: 'model_not_found' | 'invalid_executor_type' | 'access_denied' | 'ESTALE' | 'ENOTDIR' | 'ENOENT' | 'EISDIR'
              }
            | GenericError
        result?: {}
    }>

    /**
     * Remove an empty directory.
     *
     * Errors:
     * ESTALE - The parent inode does not exist.
     * ENOTDIR - The parent inode is not a directory, or the file pointed to by name is not a directory.
     * ENOENT - The name does not exist within the directory.
     * ENOTEMPTY - The file pointed to by name is not an empty directory.
     */
    rmdir(params: { modelId: string; parent: number; name: string | Buffer }): Promise<{
        error?:
            | {
                  code: 'model_not_found' | 'invalid_executor_type' | 'access_denied' | 'ESTALE' | 'ENOTDIR' | 'ENOENT' | 'ENOTEMPTY'
              }
            | GenericError
        result?: {}
    }>

    /**
     * Move a file or directory.
     *
     * Errors:
     * ESTALE - At least one of the parent inodes does not exist.
     * ENOTDIR - At least one of the parent inodes is not a directory.
     * ENOENT - The name does not exist.
     * ENOTEMPTY or EEXIST - There is a non-empty directory at the target location.
     * EISDIR - The target is a directory but the file to rename is not a directory.
     * ENOSPC - There is not enough space within the filesystem.
     */
    rename(params: { modelId: string; parent: number; name: string | Buffer; newparent: number; newname: string | Buffer; flags?: number }): Promise<{
        error?:
            | {
                  code:
                      | 'model_not_found'
                      | 'invalid_executor_type'
                      | 'access_denied'
                      | 'ESTALE'
                      | 'ENOTDIR'
                      | 'ENOENT'
                      | 'ENOTEMPTY'
                      | 'EEXIST'
                      | 'EISDIR'
                      | 'ENOSPC'
              }
            | GenericError
        result?: {}
    }>

    /**
     * Create a new name for a file.
     *
     * Errors:
     * ESTALE - The new parent inode does not exist.
     * ENOTDIR - The new parent inode is not a directory.
     * EPERM - The file to link was a directory - not allowed.
     * EEXIST - The name already exists within the directory.
     * ENOSPC - There is not enough space within the filesystem.
     */
    link(params: { modelId: string; inode: number; newparent: number; newname: string | Buffer }): Promise<{
        error?:
            | {
                  code: 'model_not_found' | 'invalid_executor_type' | 'access_denied' | 'ESTALE' | 'ENOTDIR' | 'EPERM' | 'EEXIST' | 'ENOSPC'
              }
            | GenericError
        result?: {
            stat: Stat
        }
    }>

    /**
     * Get entries within a directory.
     *
     * Errors:
     * ESTALE - The inode does not exist.
     * ENOTDIR - The inode is not a directory.
     */
    readdir(params: { modelId: string; snapshotId: string | null; inode: number }): Promise<{
        error?:
            | {
                  code: 'model_not_found' | 'snapshot_not_found' | 'invalid_executor_type' | 'ESTALE' | 'ENOTDIR'
              }
            | GenericError
        result?: {
            entries: { basename: Buffer; filetype: number; ino: number }[]
        }
    }>

    /**
     * Remove a directory and all its content.
     *
     * Errors:
     * ESTALE - The parent inode does not exist.
     * ENOTDIR - The parent inode is not a directory, or the file pointed to by name is not a directory.
     * ENOENT - The name does not exist within the directory.
     */
    rmdirAll(params: { modelId: string; parent: number; name: string | Buffer }): Promise<{
        error?:
            | {
                  code: 'model_not_found' | 'invalid_executor_type' | 'access_denied' | 'ESTALE' | 'ENOTDIR' | 'ENOENT'
              }
            | GenericError
        result?: {}
    }>

    /**
     * Create a copy of a file or directory.
     *
     * Errors:
     * ESTALE - The new parent inode does not exist.
     * ENOTDIR - The parent inode is not a directory.
     * EEXIST - The name already exists within the directory.
     * ENOSPC - There is not enough space within the filesystem.
     */
    copy(params: { modelId: string; inode: number; newparent: number; newname: string | Buffer }): Promise<{
        error?:
            | {
                  code: 'model_not_found' | 'invalid_executor_type' | 'access_denied' | 'ESTALE' | 'ENOTDIR' | 'EEXIST' | 'ENOSPC'
              }
            | GenericError
        result?: {}
    }>
}
