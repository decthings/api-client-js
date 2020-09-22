import FS from 'browserfs/dist/node/core/FS'
import { PromisifiedFS, WriteFileOptions, WriteOptions, SymlinkType } from './PromisifiedFs'
import Mkdirp from '../../mkdirp'

type RecursiveDir = (string | { folder: string; items: RecursiveDir })[]

export interface ExtendedFS {
    /**
     * Create a directory recursively
     * @param path
     * @param mode default to 0777
     */
    mkdirp(p: string, mode?: any): Promise<void>
    readDirs(path: string): Promise<RecursiveDir>
    readDirsList(path: string): Promise<string[]>
}

export function getExtendedFS(fs: FS, path: any, pfs: PromisifiedFS): ExtendedFS {
    return {
        mkdirp: async (path: string, mode?: any) => {
            return new Promise<void>((resolve, reject) => {
                Mkdirp(path, { mode: mode || parseInt('0777', 8), fs: fs as any }, (er) => {
                    er ? reject(er) : resolve()
                })
            })
        },
        // Recursive readdir
        readDirs: async (path: string) => {
            path = path.replace('\\', '/')

            if (!path.endsWith('/')) path += '/'

            let walk = async (dir: any): Promise<RecursiveDir> => {
                let items = await pfs.readdir(dir)
                let itemList: RecursiveDir = []
                for (let n = 0; n < items.length; ++n) {
                    let name = items[n]
                    if ((await pfs.stat(dir + name)).isDirectory()) {
                        itemList.push({ folder: name, items: await walk(dir + name + '/') })
                    } else {
                        itemList.push(name)
                    }
                }
                return itemList
            }
            return walk(path)
        },
        // Recursive readdir that returns a list of files
        readDirsList: async (path: string) => {
            path = path.replace('\\', '/')

            if (!path.endsWith('/')) path += '/'

            let fileList: string[] = []
            let walk = async (dir: string) => {
                let items = await pfs.readdir(dir)
                for (let n = 0; n < items.length; ++n) {
                    let item = items[n]
                    if ((await pfs.stat(dir + item)).isDirectory()) {
                        await walk(dir + item + '/')
                    } else {
                        fileList.push(dir + item)
                    }
                }
            }
            await walk(path)
            return fileList
        }
    }
}

export type CopyFilterSync = (src: string, dest: string) => boolean
export type CopyFilterAsync = (src: string, dest: string) => Promise<boolean>

export interface CopyOptions {
    dereference?: boolean
    overwrite?: boolean
    preserveTimestamps?: boolean
    errorOnExist?: boolean
    filter?: CopyFilterSync | CopyFilterAsync
    recursive?: boolean
}

export interface CopyOptionsSync extends CopyOptions {
    filter?: CopyFilterSync
}

export interface MoveOptions {
    overwrite?: boolean
    limit?: number
}

export interface ReadOptions {
    throws?: boolean
    fs?: object
    reviver?: any
    encoding?: string
    flag?: string
}
