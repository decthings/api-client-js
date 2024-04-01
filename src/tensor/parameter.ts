import { DecthingsTensor } from './tensor'

/**
 * Contains Data for a parameter.
 */
export type DecthingsParameter = {
    name: string
    data: DecthingsTensor[]
}

/**
 * Provides a Data for a parameter, either as a Data or as a dataset.
 */
export type DecthingsParameterProvider = {
    name: string
    data: DecthingsTensor[] | { type: 'dataset'; datasetId: string; datasetKey: string }
}
