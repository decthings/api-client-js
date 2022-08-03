import { Data, DataElement, DataRules } from '../DataTypes'
import { Dataset } from '../types'
import { GenericError } from './Error'

export interface IDatasetRpc {
    /**
     * Create a new dataset.
     * @param name The dataset's name.
     * @param description A description of the dataset.
     * @param rules The rules for each element.
     */
    createDataset(
        name: string,
        description: string,
        rules: DataRules
    ): Promise<{
        error?: { code: 'quota_exceeded' } | GenericError
        result?: {
            datasetId: string
            datasetVersionId: string
        }
    }>

    /**
     * Change information about a dataset.
     * @param datasetId The dataset's id.
     * @param properties Properties and values to change. Empty fields will not be changed.
     */
    updateDataset(
        datasetId: string,
        properties: {
            name?: string
            description?: string
        }
    ): Promise<{
        error?: { code: 'dataset_not_found' | 'access_denied' } | GenericError
        result?: {}
    }>

    /**
     * Delete a dataset and all contents in it. This cannot be reverted.
     * @param datasetId The dataset's id.
     */
    deleteDataset(datasetId: string): Promise<{
        error?: { code: 'dataset_not_found' | 'access_denied' } | GenericError
        result?: {}
    }>

    /**
     * Retrieve information about datasets. If the requested dataset wasn't returned, it means it doesn't exist (or you don't have access to it).
     * @param datasetIds Which datasets to fetch. If unspecified, all datasets will be fetched.
     */
    getDatasets(datasetIds?: string[]): Promise<{
        error?: GenericError
        result?: { datasets: Dataset[] }
    }>

    /**
     * Add entries to a dataset.
     * @param datasetId The dataset's id.
     * @param entries An array containing the data for each entry.
     * @param datasetVersionId If specified, the operation will only be performed if the current dataset versionId is equal to the specified string.
     */
    addEntries(
        datasetId: string,
        entries: Data[] | DataElement[],
        datasetVersionId?: string
    ): Promise<{
        error?:
            | { code: 'dataset_not_found' | 'access_denied' | 'quota_exceeded' | 'limit_exceeded' }
            | { code: 'incorrect_version_id'; datasetVersionId: string }
            | GenericError
        result?: {
            newDatasetVersionId: string
        }
    }>

    /**
     * Add entries to the 'needs review' folder of a dataset.
     * @param datasetId The dataset's id.
     * @param entries An array containing the data for each entry.
     * @param datasetVersionId If specified, the operation will only be performed if the current dataset versionId is equal to the specified string.
     */
    addEntriesToNeedsReview(
        datasetId: string,
        entries: Data[] | DataElement[],
        datasetVersionId?: string
    ): Promise<{
        error?:
            | { code: 'dataset_not_found' | 'access_denied' | 'quota_exceeded' | 'limit_exceeded' }
            | { code: 'incorrect_version_id'; datasetVersionId: string }
            | GenericError
        result?: {
            newDatasetVersionId: string
        }
    }>

    /**
     * Set the data of an item within the 'needs review' folder of a dataset and move the entry into the actual dataset.
     * @param datasetId The dataset's id.
     * @param entries An array containing the indexes and the data for each entry.
     * @param datasetVersionId If specified, the operation will only be performed if the current dataset versionId is equal to the specified string.
     */
    finalizeNeedsReviewEntries(
        datasetId: string,
        entries: {
            index: number
            data: Data | DataElement
        }[],
        datasetVersionId?: string
    ): Promise<{
        error?: { code: 'dataset_not_found' | 'access_denied' | 'quota_exceeded' } | { code: 'incorrect_version_id'; datasetVersionId: string } | GenericError
        result?: {
            newDatasetVersionId: string
        }
    }>

    /**
     * Retrieve entries in a dataset.
     * @param datasetId The dataset's id.
     * @param entriesToFetch Which entries to fetch. Either an array of indexes or a start/end range.
     * @param datasetVersionId If specified, the operation will only be performed if the current dataset versionId is equal to the specified string.
     */
    getEntries(
        datasetId: string,
        entriesToFetch: number[] | { start: number; end: number },
        datasetVersionId?: string
    ): Promise<{
        error?: { code: 'dataset_not_found' } | { code: 'incorrect_version_id'; datasetVersionId: string } | GenericError
        result?: {
            entries: {
                index: number
                byteSize: number
                data: Data | DataElement
            }[]
        }
    }>

    /**
     * Retrieve entries from the 'needs review' folder of a dataset.
     * @param datasetId The dataset's id.
     * @param entriesToFetch Which entries to fetch. Either an array of entryIds, an array of indexes, or a start/end range. If unspecified, all entries will be retrieved.
     * @param datasetVersionId If specified, the operation will only be performed if the current dataset versionId is equal to the specified string.
     */
    getNeedsReviewEntries(
        datasetId: string,
        entriesToFetch?: number[] | { start: number; end: number },
        datasetVersionId?: string
    ): Promise<{
        error?: { code: 'dataset_not_found' } | { code: 'incorrect_version_id'; datasetVersionId: string } | GenericError
        result?: {
            entries: {
                index: number
                byteSize: number
                data: Data | DataElement
            }[]
        }
    }>

    /**
     * Remove entries from a dataset.
     * @param datasetId The dataset's id.
     * @param entries An array of indexes of the elements to remove.
     * @param datasetVersionId If specified, the operation will only be performed if the current dataset versionId is equal to the specified string.
     */
    removeEntries(
        datasetId: string,
        entries: number[],
        datasetVersionId?: string
    ): Promise<{
        error?: { code: 'dataset_not_found' | 'access_denied' } | { code: 'incorrect_version_id'; datasetVersionId: string } | GenericError
        result?: {
            newDatasetVersionId: string
        }
    }>

    /**
     * Remove entries from the needs review folder of a dataset.
     * @param datasetId The dataset's id.
     * @param entries An array of indexes of the elements to remove.
     * @param datasetVersionId If specified, the operation will only be performed if the current dataset versionId is equal to the specified string.
     */
    removeNeedsReviewEntries(
        datasetId: string,
        entries: number[],
        datasetVersionId?: string
    ): Promise<{
        error?: { code: 'dataset_not_found' | 'access_denied' } | { code: 'incorrect_version_id'; datasetVersionId: string } | GenericError
        result?: {
            newDatasetVersionId: string
        }
    }>
}
