import { IData, IDataType } from '../DataTypes'
import { Dataset } from '../../types'

export interface IDatasetRpc {
    /**
     * Create a new dataset.
     * @param name The dataset's name.
     * @param description A short description of the dataset.
     * @param type The type of each element.
     * @returns The id of the created dataset.
     */
    createDataset(
        name: string,
        description: string,
        type: IDataType | 'any',
        array: 'one-dimensional' | 'multi-dimensional'
    ): Promise<{
        error?: { code: 'bad_credentials' | 'unknown' } | { code: 'invalid_parameter'; parameterName: string; reason: string }
        datasetId?: string
    }>

    /**
     * Change information about a dataset.
     * @param datasetId The dataset's id.
     * @param properties Properties and values to change. Undefined fields will not be changed.
     */
    updateDataset(
        datasetId: string,
        properties: {
            name?: string
            description?: string
        }
    ): Promise<{
        error?: { code: 'bad_credentials' | 'dataset_not_found' | 'access_denied' } | { code: 'invalid_parameter'; parameterName: string; reason: string }
    }>

    /**
     * Retrieve information about datasets. If the requested dataset wasn't returned, it means it doesn't exist (or you don't have access to it).
     * @param datasetIds Which datasets to fetch. If unspecified, all datasets will be fetched.
     */
    getDatasets(
        datasetIds?: string[]
    ): Promise<{
        error?: { code: 'bad_credentials' } | { code: 'invalid_parameter'; parameterName: string; reason: string }
        datasets?: Dataset[]
    }>

    /**
     * Add entries to a dataset.
     * @param datasetId The dataset's id.
     * @param entries An array containing the data for each entry.
     */
    addEntries(
        datasetId: string,
        entries: IData[]
    ): Promise<{
        error?:
            | { code: 'bad_credentials' | 'dataset_not_found' | 'access_denied' | 'unknown' }
            | { code: 'invalid_parameter'; parameterName: string; reason: string }
        entriesResult?: { error?: { code: 'invalid_data' }; entryId?: string }[]
    }>

    /**
     * Add entries to the 'needs review' folder of a dataset.
     * @param datasetId The dataset's id.
     * @param entries An array containing the data for each entry.
     */
    addEntriesToNeedsReview(
        datasetId: string,
        entries: IData[]
    ): Promise<{
        error?:
            | { code: 'bad_credentials' | 'dataset_not_found' | 'access_denied' | 'unknown' }
            | { code: 'invalid_parameter'; parameterName: string; reason: string }
        entriesResult?: { error?: { code: 'invalid_data' }; entryId?: string }[]
    }>

    /**
     * Set the data of an item within the 'needs review' folder of a dataset and move the entry into the actual dataset. Each entry will receive a new ID.
     * @param datasetId The dataset's id.
     * @param entries An array containing the ID and the data for each entry.
     */
    finalizeNeedsReviewEntries(
        datasetId: string,
        entries: {
            entryId: string
            data: IData
        }[]
    ): Promise<{
        error?:
            | { code: 'bad_credentials' | 'dataset_not_found' | 'access_denied' | 'unknown' }
            | { code: 'invalid_parameter'; parameterName: string; reason: string }
        entriesResult?: {
            previousEntryId: string
            error?: { code: 'dataset_entry_not_found' | 'invalid_data' }
            newEntryId?: string
        }[]
    }>

    /**
     * Remove entries from a dataset.
     *
     * Will also check the 'needs review' folder.
     * @param datasetId The dataset's id.
     * @param entryIds An array of entryIds of the elements to remove.
     * @returns An array of entries that failed.
     */
    removeEntries(
        datasetId: string,
        entryIds: string[]
    ): Promise<{
        error?:
            | { code: 'bad_credentials' | 'dataset_not_found' | 'access_denied' | 'unknown' }
            | { code: 'invalid_parameter'; parameterName: string; reason: string }
        entriesResult?: { entryId: string; error?: { code: 'dataset_entry_not_found' } }[]
    }>

    /**
     * Retrieve information about entries in a dataset.
     * @param datasetId The dataset's id.
     * @param entriesToFetch Which entries to fetch. Either an array of entryIds, an array of indexes, or a start/end range. If unspecified, all entries will be retrieved.
     */
    getEntries(
        datasetId: string,
        entriesToFetch?: (string | number)[] | { start: number; end: number }
    ): Promise<{
        error?: { code: 'bad_credentials' | 'dataset_not_found' } | { code: 'invalid_parameter'; parameterName: string; reason: string }
        entries?: {
            entryId: string
            index: number
            byteSize: number
        }[]
    }>

    /**
     * Retrieve information about entries in the 'needs review' folder of a dataset.
     * @param datasetId The dataset's id.
     * @param entriesToFetch Which entries to fetch. Either an array of entryIds, an array of indexes, or a start/end range. If unspecified, all entries will be retrieved.
     */
    getNeedsReviewEntries(
        datasetId: string,
        entriesToFetch?: (string | number)[] | { start: number; end: number }
    ): Promise<{
        error?: { code: 'bad_credentials' | 'dataset_not_found' } | { code: 'invalid_parameter'; parameterName: string; reason: string }
        entries?: {
            entryId: string
            index: number
            byteSize: number
        }[]
    }>
}
