import { DecthingsParameterDefinition } from './tensor'

export type ParameterDefinitions = {
    createState: DecthingsParameterDefinition[]
    train: DecthingsParameterDefinition[]
    evaluateInput: DecthingsParameterDefinition[]
    evaluateOutput: DecthingsParameterDefinition[]
}

export type LauncherSpec = {
    cpus: number
    memoryMebibytes: number
    diskMebibytes?: number
    swapMebibytes?: number
    gpus?: {
        /// GPU type, such as "L4" or "A100 80GB"
        model: string
        count: number
    }
}
