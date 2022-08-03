import { GenericError } from './Error'

export type RecursiveFolder = { name: string; items?: RecursiveFolder[] }

export interface IFsRpc {
    /**
     * Create a file.
     *
     * Errors:
     *
     * ENOENT - A directory component in *pathname* does not exist or is a dangling symbolic link.
     *
     * ENOTDIR - A component used as a directory in *pathname* is not, in fact, a directory.
     *
     * EEXIST - *pathname* already exists.
     *
     * ELOOP - Too many symbolic links were encountered in resolving *pathname*.
     */
    create(
        modelId: string,
        pathname: string | Buffer,
        mode: number
    ): Promise<{
        error?:
            | {
                  code: 'model_not_found' | 'invalid_executor_type' | 'access_denied' | 'ENOENT' | 'ENOTDIR' | 'EEXIST' | 'ELOOP'
              }
            | GenericError
        result?: {}
    }>
    /**
     * Read from a file.
     *
     * Errors:
     *
     * ENOENT - The named file does not exist.
     *
     * EISDIR - *pathname* refers to a directory.
     *
     * ENOTDIR - A component used as a directory in *pathname* is not, in fact, a directory.
     *
     * ELOOP - Too many symbolic links were encountered in resolving *pathname*.
     *
     * EINVAL - *pathname* is not a regular file.
     */
    read(
        modelId: string,
        snapshotId: string | null,
        pathname: string | Buffer,
        offset: number,
        count: number
    ): Promise<{
        error?:
            | {
                  code:
                      | 'model_not_found'
                      | 'snapshot_not_found'
                      | 'invalid_executor_type'
                      | 'access_denied'
                      | 'ENOENT'
                      | 'EISDIR'
                      | 'ENOTDIR'
                      | 'ELOOP'
                      | 'EINVAL'
              }
            | GenericError
        result?: {
            data: Buffer
        }
    }>
    /**
     * Write to a file.
     *
     * If *truncate* is true, the file is truncated to the length of the data before write.
     * In this case, the data is written to the start of the file and *offset* is ignored.
     *
     * Errors:
     *
     * ENOENT - The named file does not exist.
     *
     * EISDIR - *pathname* refers to a directory.
     *
     * ENOTDIR - A component used as a directory in *pathname* is not, in fact, a directory.
     *
     * ELOOP - Too many symbolic links were encountered in resolving *pathname*.
     *
     * EFBIG - An attempt was made to write a file that exceeds the maximum file-size limit.
     */
    write(
        modelId: string,
        pathname: string | Buffer,
        data: Buffer,
        offset: number,
        truncate?: boolean
    ): Promise<{
        error?:
            | {
                  code: 'model_not_found' | 'invalid_executor_type' | 'access_denied' | 'ENOENT' | 'EISDIR' | 'ENOTDIR' | 'ELOOP' | 'EFBIG'
              }
            | GenericError
        result?: {
            bytesWritten: number
        }
    }>
    /**
     * Truncate a file to a specified length.
     *
     * Errors:
     *
     * ENOENT - The named file does not exist.
     *
     * EISDIR - *pathname* refers to a directory.
     *
     * ENOTDIR - A component used as a directory in *pathname* is not, in fact, a directory.
     *
     * ELOOP - Too many symbolic links were encountered in resolving *pathname*.
     *
     * EFBIG - An attempt was made to write a file that exceeds the maximum file-size limit.
     */
    truncate(
        modelId: string,
        pathname: string | Buffer,
        length: number
    ): Promise<{
        error?:
            | {
                  code: 'model_not_found' | 'invalid_executor_type' | 'access_denied' | 'ENOENT' | 'EISDIR' | 'ENOTDIR' | 'ELOOP' | 'EFBIG'
              }
            | GenericError
        result?: {}
    }>
    /**
     * Get file status.
     *
     * Errors:
     *
     * ENOENT - The named file does not exist.
     *
     * ENOTDIR - A component used as a directory in *pathname* is not, in fact, a directory.
     *
     * ELOOP - Too many symbolic links were encountered in resolving *pathname*.
     */
    stat(
        modelId: string,
        snapshotId: string | null,
        pathname: string | Buffer
    ): Promise<{
        error?:
            | {
                  code: 'model_not_found' | 'snapshot_not_found' | 'invalid_executor_type' | 'access_denied' | 'ENOENT' | 'ENOTDIR' | 'ELOOP'
              }
            | GenericError
        result?: {
            st_ino: number
            st_mode: number
            st_nlink: number
            st_size: number
            st_blksize: number
            st_blocks: number
            st_atime: number
            st_atime_nsec: number
            st_mtime: number
            st_mtime_nsec: number
            st_ctime: number
            st_ctime_nsec: number
        }
    }>
    /**
     * Get file status. If the file is a symbolic link, then it returns information about the link itself.
     *
     * Errors:
     *
     * ENOENT - The named file does not exist.
     *
     * ENOTDIR - A component used as a directory in *pathname* is not, in fact, a directory.
     *
     * ELOOP - Too many symbolic links were encountered in resolving *pathname*.
     */
    lstat(
        modelId: string,
        snapshotId: string | null,
        pathname: string | Buffer
    ): Promise<{
        error?:
            | {
                  code: 'model_not_found' | 'snapshot_not_found' | 'invalid_executor_type' | 'access_denied' | 'ENOENT' | 'ENOTDIR' | 'ELOOP'
              }
            | GenericError
        result?: {
            st_ino: number
            st_mode: number
            st_nlink: number
            st_size: number
            st_blksize: number
            st_blocks: number
            st_atime: number
            st_atime_nsec: number
            st_mtime: number
            st_mtime_nsec: number
            st_ctime: number
            st_ctime_nsec: number
        }
    }>
    /**
     * Create a symbolic link.
     *
     * ENOENT - A directory component in *linkpath* does not exist or is a dangling symbolic link.
     *
     * ENOTDIR - A component used as a directory in *linkpath* is not, in fact, a directory.
     *
     * EEXIST - *linkpath* already exists.
     *
     * ELOOP - Too many symbolic links were encountered in resolving *linkpath*.
     */
    symlink(
        modelId: string,
        target: string | Buffer,
        linkpath: string | Buffer
    ): Promise<{
        error?:
            | {
                  code: 'model_not_found' | 'invalid_executor_type' | 'access_denied' | 'ENOENT' | 'ENOTDIR' | 'EEXIST' | 'ELOOP'
              }
            | GenericError
        result?: {}
    }>
    /**
     * Read value of a symbolic link.
     *
     * Errors:
     *
     * ENOENT - The named file does not exist.
     *
     * ENOTDIR - A component used as a directory in *pathname* is not, in fact, a directory.
     *
     * EINVAL - The named file is not a symbolic link.
     *
     * ELOOP - Too many symbolic links were encountered in resolving *pathname*.
     */
    readlink(
        modelId: string,
        snapshotId: string | null,
        pathname: string | Buffer
    ): Promise<{
        error?:
            | {
                  code: 'model_not_found' | 'snapshot_not_found' | 'invalid_executor_type' | 'access_denied' | 'ENOENT' | 'ENOTDIR' | 'EINVAL' | 'ELOOP'
              }
            | GenericError
        result?: {
            data: Buffer
        }
    }>
    /**
     * Create a directory.
     *
     * Errors:
     *
     * ENOENT - A directory component in *pathname* does not exist or is a dangling symbolic link.
     *
     * ENOTDIR - A component used as a directory in *pathname* is not, in fact, a directory.
     *
     * EEXIST - *pathname* already exists.
     *
     * ELOOP - Too many symbolic links were encountered in resolving *pathname*.
     */
    mkdir(
        modelId: string,
        pathname: string | Buffer,
        mode: number
    ): Promise<{
        error?:
            | {
                  code: 'model_not_found' | 'invalid_executor_type' | 'access_denied' | 'ENOENT' | 'ENOTDIR' | 'EEXIST' | 'ELOOP'
              }
            | GenericError
        result?: {}
    }>
    /**
     * Delete a name and possibly the file it refers to.
     *
     * ENOENT - The named file does not exist.
     *
     * EISDIR - *pathname* refers to a directory.
     *
     * ENOTDIR - A component used as a directory in *pathname* is not, in fact, a directory.
     *
     * ELOOP - Too many symbolic links were encountered in resolving *pathname*.
     */
    unlink(
        modelId: string,
        pathname: string | Buffer
    ): Promise<{
        error?:
            | {
                  code: 'model_not_found' | 'invalid_executor_type' | 'access_denied' | 'ENOENT' | 'EISDIR' | 'ENOTDIR' | 'ELOOP'
              }
            | GenericError
        result?: {}
    }>
    /**
     * Delete a directory.
     *
     * Errors:
     *
     * ENOENT - The named file does not exist.
     *
     * ENOTDIR - *pathname*, or a component used as a directory in *pathname*, is not, in fact, a directory.
     *
     * ENOTEMPTY - *pathname* contains entries other that "." and "..".
     *
     * ELOOP - Too many symbolic links were encountered in resolving *pathname*.
     */
    rmdir(
        modelId: string,
        pathname: string | Buffer
    ): Promise<{
        error?:
            | {
                  code: 'model_not_found' | 'invalid_executor_type' | 'access_denied' | 'ENOENT' | 'ENOTDIR' | 'ENOTEMPTY' | 'ELOOP'
              }
            | GenericError
        result?: {}
    }>
    /**
     * Rename a file.
     *
     * Errors:
     *
     * ENOENT - *oldpath* does not exist, or a directory component in *newpath* does not exist.
     *
     * EISDIR - *newpath* is an existing directory, but *oldpath* is not a directory.
     *
     * ENOTDIR - A component used as a directory in *oldpath* or *newpath*, is not, in fact, a directory. Or,
     * *oldpath* is a directory, and *newpath* exists but is not a directory.
     *
     * ENOTEMPTY - *newpath* is a nonempty directory.
     *
     * ELOOP - Too many symbolic links were encountered in resolving *pathname*.
     *
     * EINVAL - An attempt was made to make a directory a subdirectory of itself.
     */
    rename(
        modelId: string,
        oldpath: string | Buffer,
        newpath: string | Buffer
    ): Promise<{
        error?:
            | {
                  code: 'model_not_found' | 'invalid_executor_type' | 'access_denied' | 'ENOENT' | 'EISDIR' | 'ENOTDIR' | 'ENOTEMPTY' | 'ELOOP' | 'EINVAL'
              }
            | GenericError
        result?: {}
    }>
    /**
     * Make a new name for a file.
     *
     * ENOENT - *oldpath*, or a directory component in *oldpath* or *newpath* does not exist or is a dangling symbolic link.
     *
     * ENOTDIR - A component used as a directory in *oldpath* or *newpath* is not, in fact, a directory.
     *
     * EEXIST - *newpath* already exists.
     *
     * ELOOP - Too many symbolic links were encountered in resolving *oldpath* or *newpath*.
     *
     * EPERM - *oldpath* is a directory.
     */
    link(
        modelId: string,
        oldpath: string | Buffer,
        newpath: string | Buffer
    ): Promise<{
        error?:
            | {
                  code: 'model_not_found' | 'invalid_executor_type' | 'access_denied' | 'ENOENT' | 'ENOTDIR' | 'EEXIST' | 'ELOOP' | 'EPERM'
              }
            | GenericError
        result?: {}
    }>
    /**
     * Read a directory.
     *
     * Errors:
     *
     * ENOENT - The named file does not exist.
     *
     * ENOTDIR - *pathname*, or a component used as a directory in *pathname*, is not, in fact, a directory.
     *
     * ELOOP - Too many symbolic links were encountered in resolving *pathname*.
     */
    readdir(
        modelId: string,
        snapshotId: string | null,
        pathname: string | Buffer
    ): Promise<{
        error?:
            | {
                  code: 'model_not_found' | 'snapshot_not_found' | 'invalid_executor_type' | 'access_denied' | 'ENOENT' | 'ENOTDIR' | 'ELOOP'
              }
            | GenericError
        result?: {
            entries: { name: Buffer; fileType: number; ino: number }[]
        }
    }>
    /**
     * Change permissions of a file.
     *
     * ENOENT - The named file does not exist.
     *
     * ENOTDIR - A component used as a directory in *pathname* is not, in fact, a directory.
     *
     * ELOOP - Too many symbolic links were encountered in resolving *pathname*.
     */
    chmod(
        modelId: string,
        pathname: string | Buffer,
        mode: number
    ): Promise<{
        error?:
            | {
                  code: 'model_not_found' | 'invalid_executor_type' | 'access_denied' | 'ENOENT' | 'ENOTDIR' | 'ELOOP'
              }
            | GenericError
        result?: {}
    }>
    /**
     * Change file last access and modification times.
     *
     * Errors:
     *
     * ENOENT - The named file does not exist.
     *
     * ENOTDIR - A component used as a directory in *pathname* is not, in fact, a directory.
     *
     * ELOOP - Too many symbolic links were encountered in resolving *pathname*.
     *
     * EINVAL - Invalid value in one of the nanoseconds fields (value outside range 0 to 999,999,999, and not UTIME_NOW or UTIME_OMIT)
     */
    utimes(
        modelId: string,
        pathname: string | Buffer,
        atime: { seconds: number; nanoseconds: number },
        mtime: { seconds: number; nanoseconds: number }
    ): Promise<{
        error?:
            | {
                  code: 'model_not_found' | 'invalid_executor_type' | 'access_denied' | 'ENOENT' | 'ENOTDIR' | 'ELOOP' | 'EINVAL'
              }
            | GenericError
        result?: {}
    }>
    /**
     * Remove a directory and all of its contents.
     *
     * Errors:
     *
     * ENOENT - The named file does not exist.
     *
     * ENOTDIR - *pathname*, or a component used as a directory in *pathname*, is not, in fact, a directory.
     *
     * ELOOP - Too many symbolic links were encountered in resolving *pathname*.
     */
    rmdirAll(
        modelId: string,
        pathname: string | Buffer
    ): Promise<{
        error?:
            | {
                  code: 'model_not_found' | 'invalid_executor_type' | 'access_denied' | 'ENOENT' | 'ENOTDIR' | 'ELOOP'
              }
            | GenericError
        result?: {}
    }>
    /**
     * Creates a new copy of a file or directory in a new location.
     *
     * Errors:
     *
     * ENOENT - *sourcepath* does not exist, or a directory component in *destinationpath* does not exist.
     *
     * EEXIST - *destinationpath* already exists.
     *
     * ENOTDIR - A component used as a directory in *sourcepath* or *destinationpath*, is not, in fact, a directory.
     *
     * ELOOP - Too many symbolic links were encountered in resolving *sourcepath* or *destinationpath*.
     */
    copy(
        modelId: string,
        sourcepath: string | Buffer,
        destinationpath: string | Buffer
    ): Promise<{
        error?:
            | {
                  code: 'model_not_found' | 'invalid_executor_type' | 'access_denied' | 'ENOENT' | 'EEXIST' | 'ENOTDIR' | 'ELOOP'
              }
            | GenericError
        result?: {}
    }>
}
