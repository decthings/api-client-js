import * as browserfs from "browserfs"
import FS from 'browserfs/dist/node/core/FS'
import { ExtendedFS, getExtendedFS } from "./ExtendedFs"
import { PromisifiedFS, getPromisifiedFS } from "./PromisifiedFs"
import DecthingsFs from './DecthingsFs'

browserfs.registerFileSystem('DecthingsFs', DecthingsFs)

export interface FileSystem {
    config: browserfs.FileSystemConfiguration
    efs: ExtendedFS
    fs: FS
    path: any
    pfs: PromisifiedFS
}

export function configureFileSystem(config: browserfs.FileSystemConfiguration, dest: object = {}): Promise<FileSystem> {
    return new Promise((resolve, reject) => {
        browserfs.install(dest)
        browserfs.configure(config, (err) => {
            if (!err) {
                let fs = browserfs.BFSRequire("fs")
                let path = browserfs.BFSRequire("path")
                let pfs = getPromisifiedFS(fs)
                let efs = getExtendedFS(fs, path, pfs)
                resolve({ config, fs, path, pfs, efs })
            } else
                reject(err)
        })
    })
}
