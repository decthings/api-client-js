export type RecursiveFolder = { name: string; items?: RecursiveFolder[] }

export interface IDecthingsFs {
    /**
     * Retrieve file attributes for a file.
     * @throws ENOENT, ENOTDIR, EFAULT
     */
    getattr(
        filename: string,
        isLstat: boolean
    ): Promise<{ type: 'file' | 'directory' | 'symlink'; size: number; atime: number; mtime: number; ctime: number; birthtime: number }>
    /**
     * Read from file.
     * @param filename Path to the file.
     * @param offset The position in the file to start reading.
     * @param count Number of bytes to read,
     * @throws EISDIR, EFAULT
     */
    read(filename: string, offset: number, count: number): Promise<Buffer>
    /**
     * Write to file.
     * @param filename Path to the file.
     * @param data The data to write.
     * @param offset The position in the file to start writing.
     * @throw EISDIR, EFAULT
     */
    write(filename: string, data: Buffer, offset: number): Promise<number>
    /**
     * Create a file.
     * @param filename The absolute filename.
     * @returns The filehandle for the newly created file.
     * @throws ENOENT, ENOTDIR, EEXIST, EFAULT
     */
    create(filename: string): Promise<void>
    /**
     * Create a directory.
     * @param dirname The absolute directory name.
     * @returns The filehandle for the newly created directory.
     * @throws ENOENT, ENOTDIR, EEXIST, EFAULT
     */
    mkdir(dirname: string): Promise<void>
    /**
     * Remove a file.
     * @throws ENOENT, ENOTDIR, EISDIR, EFAULT
     */
    remove(filename: string): Promise<void>
    /**
     * Remove a directory.
     * @throws ENOENT, ENOTDIR, ENOTEMPTY, EFAULT
     */
    rmdir(dirname: string): Promise<void>
    /**
     * Rename a file.
     * @throws ENOENT, ENOTDIR, EFAULT
     */
    rename(oldFilename: string, newFilename: string): Promise<void>
    /**
     * Lists all files in a directory.
     * @throws ENOENT, ENOTDIR, EFAULT
     */
    readdir(dirname: string): Promise<string[]>
    /**
     * Recursively reads all files and folders in a directory.
     * @throws ENOTDIR, EFAULT
     */
    readdirRecursive(dirname: string): Promise<RecursiveFolder[]>
    /**
     * Truncate a file.
     * @param size The new size
     * @throws ENOENT, ENOTDIR, EISDIR, EFAULT
     */
    truncate(filename: string, length: number): Promise<void>
    /**
     * Create a symbolic link.
     * @throws ENOENT
     */
    symlink(target: string, path: string): Promise<void>
    /**
     * Set the timestamps of a file.
     * @throws ENOENT, ENOTDIR, EFAULT
     */
    utimes(filename: string, atimeMs: number, mtimeMs: number): Promise<void>
    /**
     * Read value of a symbolic link
     * @throws ENOENT, ENOTDIR, EFAULT
     */
    readlink(filename: string): Promise<string>
    /**
     * Remove a directory and all of its contents.
     * @throws ENOENT, ENOTDIR, EFAULT
     */
    rimraf(dirname: string): Promise<void>
    /**
     * Creates a new copy of a file in a new location.
     * @throws ENOENT, ENOTDIR, EFAULT
     */
    copyFile(src: string, dest: string): Promise<void>
}