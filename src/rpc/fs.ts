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
     * Get file information from its name. Errors:
     * ESTALE - The parent inode does not exist.
     * ENOENT - The name does not exist within the directory.
     * ENOTDIR - The parent inode was not a directory.
     */
    lookup(params: {
        /** The model's id. */
        modelId: string
        /** If provided, the filesystem of the snapshot will be used. Otherwise, the filesystem of the model will be used. */
        snapshotId?: string
        /** Inode number of the parent directory. */
        parent: number
        /** Filename within the parent directory. */
        name: string | Buffer
    }): Promise<{
        error?:
            | {
                  code:
                      | 'model_not_found'
                      | 'snapshot_not_found'
                      | 'ESTALE'
                      | 'ENOENT'
                      | 'ENOTDIR'
                      | 'bad_credentials'
                      | 'too_many_requests'
                      | 'payment_required'
                      | 'unknown'
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {
            inode: number
            stat: Stat
        }
    }>

    /**
     * Get file information from its inode number.
     *
     * Errors:
     * <br />
     * ESTALE - The inode does not exist.
     */
    getattr(params: {
        /** The model's id. */
        modelId: string
        /** If provided, the filesystem of the snapshot will be used. Otherwise, the filesystem of the model will be used. */
        snapshotId?: string
        /** Inode number of file. */
        inode: number
    }): Promise<{
        error?:
            | {
                  code: 'model_not_found' | 'snapshot_not_found' | 'ESTALE' | 'bad_credentials' | 'too_many_requests' | 'payment_required' | 'unknown'
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {
            stat: Stat
        }
    }>

    /**
     * Set file information.
     *
     * Errors:
     * <br />
     * ESTALE - The inode does not exist.
     * <br />
     * EFBIG - The target size is too large.
     * <br />
     * EISDIR - Attempted to resize a directory.
     */
    setattr(params: {
        /** The model's id. */
        modelId: string
        /** Inode number of file. */
        inode: number
        /** If specified, file mode to set. */
        mode?: number
        /** If specified the file will be resized to this size. */
        size?: number
        /** If specified, set access time. */
        atime?: {
            sec: number
            nsec: number
        }
        /** If specified, set modified time. */
        mtime?: {
            sec: number
            nsec: number
        }
    }): Promise<{
        error?:
            | {
                  code:
                      | 'model_not_found'
                      | 'access_denied'
                      | 'ESTALE'
                      | 'EFBIG'
                      | 'EISDIR'
                      | 'bad_credentials'
                      | 'too_many_requests'
                      | 'payment_required'
                      | 'unknown'
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {
            stat: Stat
        }
    }>

    /**
     * Create a regular or special file. Errors:
     * ESTALE - The parent inode does not exist.
     * ENOTDIR - The parent inode is not a directory.
     * EEXIST - The name already exists within the directory.
     * ENOSPC - There is not enough space within the filesystem.
     */
    mknod(params: {
        /** The model's id. */
        modelId: string
        /** Inode number of the parent directory. */
        parent: number
        /** Filename within the parent directory. */
        name: string | Buffer
        /** File mode. */
        mode: number
        /** Device number (for character or block device files). */
        dev: number
    }): Promise<{
        error?:
            | {
                  code:
                      | 'model_not_found'
                      | 'access_denied'
                      | 'ESTALE'
                      | 'ENOTDIR'
                      | 'EEXIST'
                      | 'ENOSPC'
                      | 'bad_credentials'
                      | 'too_many_requests'
                      | 'payment_required'
                      | 'unknown'
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {
            inode: number
            stat: Stat
        }
    }>

    /**
     * Read from a file. Errors:
     * ESTALE - The inode does not exist.
     * EISDIR - The inode was a directory.
     * EINVAL - The inode was not a file suitable for reading.
     */
    read(params: {
        /** The model's id. */
        modelId: string
        /** If provided, the filesystem of the snapshot will be used. Otherwise, the filesystem of the model will be used. */
        snapshotId?: string
        /** Inode number of file. */
        inode: number
        /** Where in the file to start reading. */
        offset: number
        /** Number of bytes to read. */
        count: number
    }): Promise<{
        error?:
            | {
                  code:
                      | 'model_not_found'
                      | 'snapshot_not_found'
                      | 'ESTALE'
                      | 'EISDIR'
                      | 'EINVAL'
                      | 'bad_credentials'
                      | 'too_many_requests'
                      | 'payment_required'
                      | 'unknown'
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {
            data: Buffer
        }
    }>

    /**
     * Write to a file. If successful, it is not guaranteed that all bytes were written. The return value bytesWritten
     * contains the number of The return value bytesWritten contains the number of bytes written. If *truncate* is
     * true, the file is truncated to the length of the data before write. In this case, the data is written to the
     * start of the file and *offset* is ignored. Errors:
     * ESTALE - The inode does not exist.
     * EISDIR - The inode was a directory.
     * ENOSPC - Not enough space on the filesystem to perform the write.
     * EINVAL - The inode was not a file suitable for writing.
     */
    write(params: {
        /** The model's id. */
        modelId: string
        /** Inode number of file. */
        inode: number
        data: Buffer
        /** Where in the file to start writing. */
        offset: number
        /** If true, the file will be truncate to zero length before writing. */
        truncate?: boolean
    }): Promise<{
        error?:
            | {
                  code:
                      | 'model_not_found'
                      | 'access_denied'
                      | 'ESTALE'
                      | 'EISDIR'
                      | 'ENOSPC'
                      | 'EINVAL'
                      | 'bad_credentials'
                      | 'too_many_requests'
                      | 'payment_required'
                      | 'unknown'
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {
            bytesWritten: number
        }
    }>

    /**
     * Create a symbolic link. Errors:
     * ESTALE - The parent inode does not exist.
     * ENOTDIR - The parent inode is not a directory.
     * EEXIST - The name already exists within the directory.
     * ENOSPC - There is not enough space within the filesystem.
     */
    symlink(params: {
        /** The model's id. */
        modelId: string
        /** Inode number of the parent directory. */
        parent: number
        /** Filename within the parent directory. */
        name: string | Buffer
        /** Target name. */
        link: string | Buffer
    }): Promise<{
        error?:
            | {
                  code:
                      | 'model_not_found'
                      | 'access_denied'
                      | 'ESTALE'
                      | 'ENOTDIR'
                      | 'EEXIST'
                      | 'ENOSPC'
                      | 'bad_credentials'
                      | 'too_many_requests'
                      | 'payment_required'
                      | 'unknown'
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {
            inode: number
            stat: Stat
        }
    }>

    /**
     * Read value of a symbolic link. Errors:
     * ESTALE - The inode does not exist.
     * EINVAL - The inode was not a symbolic link.
     */
    readlink(params: {
        /** The model's id. */
        modelId: string
        /** If provided, the filesystem of the snapshot will be used. Otherwise, the filesystem of the model will be used. */
        snapshotId?: string
        /** Inode number of file. */
        inode: number
    }): Promise<{
        error?:
            | {
                  code:
                      | 'model_not_found'
                      | 'snapshot_not_found'
                      | 'ESTALE'
                      | 'EINVAL'
                      | 'bad_credentials'
                      | 'too_many_requests'
                      | 'payment_required'
                      | 'unknown'
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {
            link: Buffer
        }
    }>

    /**
     * Create a directory. Errors:
     * ESTALE - The parent inode does not exist.
     * ENOTDIR - The parent inode is not a directory.
     * EEXIST - The name already exists within the directory.
     * ENOSPC - There is not enough space within the filesystem.
     */
    mkdir(params: {
        /** The model's id. */
        modelId: string
        /** Inode number of the parent directory. */
        parent: number
        /** Filename within the parent directory. */
        name: string | Buffer
        /** File mode. */
        mode: number
    }): Promise<{
        error?:
            | {
                  code:
                      | 'model_not_found'
                      | 'access_denied'
                      | 'ESTALE'
                      | 'ENOTDIR'
                      | 'EEXIST'
                      | 'ENOSPC'
                      | 'bad_credentials'
                      | 'too_many_requests'
                      | 'payment_required'
                      | 'unknown'
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {
            inode: number
            stat: Stat
        }
    }>

    /**
     * Remove a name for a regular or special file. Errors:
     * ESTALE - The parent inode does not exist.
     * ENOTDIR - The parent inode is not a directory.
     * ENOENT - The name does not exist within the directory.
     * EISDIR - The file pointed to by name is a directory.
     */
    unlink(params: {
        /** The model's id. */
        modelId: string
        /** Inode number of the parent directory. */
        parent: number
        /** Filename within the parent directory. */
        name: string | Buffer
    }): Promise<{
        error?:
            | {
                  code:
                      | 'model_not_found'
                      | 'access_denied'
                      | 'ESTALE'
                      | 'ENOTDIR'
                      | 'ENOENT'
                      | 'EISDIR'
                      | 'bad_credentials'
                      | 'too_many_requests'
                      | 'payment_required'
                      | 'unknown'
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {}
    }>

    /**
     * Remove an empty directory. Errors:
     * ESTALE - The parent inode does not exist.
     * ENOTDIR - The parent inode is not a directory, or the file pointed to by name is not a directory.
     * ENOENT - The name does not exist within the directory.
     * ENOTEMPTY - The file pointed to by name is not an empty directory.
     */
    rmdir(params: {
        /** The model's id. */
        modelId: string
        /** Inode number of the parent directory. */
        parent: number
        /** Filename within the parent directory. */
        name: string | Buffer
    }): Promise<{
        error?:
            | {
                  code:
                      | 'model_not_found'
                      | 'access_denied'
                      | 'ESTALE'
                      | 'ENOTDIR'
                      | 'ENOENT'
                      | 'ENOTEMPTY'
                      | 'bad_credentials'
                      | 'too_many_requests'
                      | 'payment_required'
                      | 'unknown'
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {}
    }>

    /**
     * Move a file or directory. Errors:
     * ESTALE - At least one of the parent inodes does not exist.
     * ENOTDIR - At least one of the parent inodes is not a directory.
     * ENOENT - The name does not exist.
     * ENOTEMPTY or EEXIST - There is a non-empty directory at the target location.
     * EISDIR - The target is a directory but the file to rename is not a directory.
     * ENOSPC - There is not enough space within the filesystem.
     */
    rename(params: {
        /** The model's id. */
        modelId: string
        /** Inode number of the parent directory. */
        parent: number
        /** Filename within the parent directory. */
        name: string | Buffer
        /** Inode number of the new parent directory. */
        newparent: number
        /** Filename within the new parent directory. */
        newname: string | Buffer
        /** Optional rename flags. */
        flags?: number
    }): Promise<{
        error?:
            | {
                  code:
                      | 'model_not_found'
                      | 'access_denied'
                      | 'ESTALE'
                      | 'ENOTDIR'
                      | 'ENOENT'
                      | 'ENOTEMPTY'
                      | 'EEXIST'
                      | 'EISDIR'
                      | 'ENOSPC'
                      | 'bad_credentials'
                      | 'too_many_requests'
                      | 'payment_required'
                      | 'unknown'
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {}
    }>

    /**
     * Create a new name for a file. Errors:
     * ESTALE - The new parent inode does not exist.
     * ENOTDIR - The new parent inode is not a directory.
     * EPERM - The file to link was a directory - not allowed.
     * EEXIST - The name already exists within the directory.
     * ENOSPC - There is not enough space within the filesystem.
     */
    link(params: {
        /** The model's id. */
        modelId: string
        /** Inode number of file. */
        inode: number
        /** Inode number of the new parent directory. */
        newparent: number
        /** Filename within the new parent directory. */
        newname: string | Buffer
    }): Promise<{
        error?:
            | {
                  code:
                      | 'model_not_found'
                      | 'access_denied'
                      | 'ESTALE'
                      | 'ENOTDIR'
                      | 'EPERM'
                      | 'EEXIST'
                      | 'ENOSPC'
                      | 'bad_credentials'
                      | 'too_many_requests'
                      | 'payment_required'
                      | 'unknown'
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {
            stat: Stat
        }
    }>

    /**
     * Get entries within a directory. Errors:
     * ESTALE - The inode does not exist.
     * ENOTDIR - The inode is not a directory.
     */
    readdir(params: {
        /** The model's id. */
        modelId: string
        /** If provided, the filesystem of the snapshot will be used. Otherwise, the filesystem of the model will be used. */
        snapshotId?: string
        /** Inode number of directory. */
        inode: number
    }): Promise<{
        error?:
            | {
                  code:
                      | 'model_not_found'
                      | 'snapshot_not_found'
                      | 'ESTALE'
                      | 'ENOTDIR'
                      | 'bad_credentials'
                      | 'too_many_requests'
                      | 'payment_required'
                      | 'unknown'
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {
            entries: {
                /** Filename */
                basename: Buffer
                /** File mode */
                filetype: number
                /** Inode number */
                ino: number
            }[]
        }
    }>

    /**
     * Remove a directory and all its contents. Errors:
     * ESTALE - The parent inode does not exist.
     * ENOTDIR - The parent inode is not a directory, or the file pointed to by name is not a directory.
     * ENOENT - The name does not exist within the directory.
     */
    rmdirAll(params: {
        /** The model's id. */
        modelId: string
        /** Inode number of the parent directory. */
        parent: number
        /** Filename within the parent directory. */
        name: string | Buffer
    }): Promise<{
        error?:
            | {
                  code:
                      | 'model_not_found'
                      | 'access_denied'
                      | 'ESTALE'
                      | 'ENOTDIR'
                      | 'ENOENT'
                      | 'bad_credentials'
                      | 'too_many_requests'
                      | 'payment_required'
                      | 'unknown'
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {}
    }>

    /**
     * Create a copy of a file or directory. Errors:
     * ESTALE - The new parent inode does not exist.
     * ENOTDIR - The parent inode is not a directory.
     * EEXIST - The name already exists within the directory.
     * ENOSPC - There is not enough space within the filesystem.
     */
    copy(params: {
        /** The model's id. */
        modelId: string
        /** Inode number of file. */
        inode: number
        /** Inode number of the new parent directory. */
        newparent: number
        /** Filename within the new parent directory. */
        newname: string | Buffer
    }): Promise<{
        error?:
            | {
                  code:
                      | 'model_not_found'
                      | 'access_denied'
                      | 'ESTALE'
                      | 'ENOTDIR'
                      | 'EEXIST'
                      | 'ENOSPC'
                      | 'bad_credentials'
                      | 'too_many_requests'
                      | 'payment_required'
                      | 'unknown'
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {}
    }>
}
