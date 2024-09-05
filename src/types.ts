import { DecthingsParameterDefinition } from './tensor'

export type ParameterDefinitions = {
    createState: DecthingsParameterDefinition[]
    train: DecthingsParameterDefinition[]
    evaluateInput: DecthingsParameterDefinition[]
    evaluateOutput: DecthingsParameterDefinition[]
}

export type LauncherSpec = {
    cpus: 0.125 | 0.25 | 0.5 | 1 | 2
    memoryMebibytes: number
    diskMebibytes?: number
    swapMebibytes?: number
}
