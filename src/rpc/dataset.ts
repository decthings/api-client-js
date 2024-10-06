import { DecthingsParameterDefinition, DecthingsTensor } from '../tensor'

export type Dataset = {
    id: string
    name: string
    description: string
    createdAt: number
    tags: {
        tag: string
        value: string
    }[]
    owner: {
        userId: string
        username: string
    }
    access: 'read' | 'readwrite'
    keys: DecthingsParameterDefinition[]
    entries: {
        count: number
        totalByteSize: number
    }
    needsReviewEntries: {
        count: number
        totalByteSize: number
    }
    entriesWaitingToBeDeleted: {
        count: number
        totalByteSize: number
    }
    /**
     * The version identifier will be updated every time the data in the dataset changes, for example when an element
     * is added. It can be used to prevent synchronization issues if multiple sources edit a dataset simultaneously.
     */
    versionId: string
}

export interface DatasetRpc {
    /**
     * Create a new dataset.
     */
    createDataset(params: {
        /** The dataset's name. */
        name: string
        /** A description of the dataset. */
        description: string
        /** Tags are used to specify things like dataset type (image classification, etc.) and other metadata. */
        tags?: {
            tag: string
            value: string
        }[]
        /**
         * Each key contains separate data, allowing you to mix multiple types. For example, for an image dataset you
         * could have an "image" of type image, and "label" of type string.
         */
        keys: DecthingsParameterDefinition[]
    }): Promise<{
        error?:
            | {
                  code: 'name_already_used' | 'quota_exceeded' | 'bad_credentials' | 'too_many_requests' | 'payment_required' | 'unknown'
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {
            /** A unique identifier which you should use in subsequent API calls. */
            datasetId: string
            /** The initial version identifier. */
            datasetVersionId: string
        }
    }>

    /**
     * Change dataset information.
     */
    updateDataset(params: {
        /** The dataset's id. */
        datasetId: string
        /** Properties and values to change. Empty fields will not be changed. */
        properties: {
            name?: string
            description?: string
            tags?: {
                tag: string
                value: string
            }[]
        }
    }): Promise<{
        error?:
            | {
                  code: 'dataset_not_found' | 'access_denied' | 'name_already_used' | 'bad_credentials' | 'too_many_requests' | 'payment_required' | 'unknown'
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {}
    }>

    /**
     * Delete a dataset and all contents in it. This cannot be reverted.
     */
    deleteDataset(params: {
        /** The dataset's id. */
        datasetId: string
    }): Promise<{
        error?:
            | {
                  code: 'dataset_not_found' | 'access_denied' | 'bad_credentials' | 'too_many_requests' | 'payment_required' | 'unknown'
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {}
    }>

    /**
     * Retrieve information about datasets. If the requested dataset wasn't returned, it means it doesn't exist (or
     * you don't have access to it).
     */
    getDatasets(params: {
        /** Number of items from the results to skip. Defaults to 0. */
        offset?: number
        /** Max number of items to return. Defaults to 20. */
        limit?: number
        /** If specified, determines which items to retrieve. */
        filter?: {
            owners?: string[]
            tags?: {
                tag: string
                value: string
            }[]
            ids?: string[]
            names?: string[]
            searchName?: string
        }
        /** Specifies a field in the returned items to sort by. Defaults to "createdAt". */
        sort?: string
        sortDirection?: 'asc' | 'desc'
    }): Promise<{
        error?:
            | {
                  code: 'bad_credentials' | 'too_many_requests' | 'payment_required' | 'unknown'
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {
            datasets: Dataset[]
            /** The total number of datasets that matched the filter. */
            total: number
            offset: number
            limit: number
        }
    }>

    /**
     * Add entries to a dataset.
     */
    addEntries(params: {
        /** The dataset's id. */
        datasetId: string
        /**
         * New data to add to the dataset. There should be one entry for each key in the dataset, and the length of the
         * data to add to all keys must be the same.
         */
        keys: {
            key: string
            data: DecthingsTensor[]
        }[]
        /**
         * If specified, the operation will only be performed if the current dataset versionId is equal to the specified
         * string.
         */
        datasetVersionId?: string
    }): Promise<{
        error?:
            | {
                  code:
                      | 'dataset_not_found'
                      | 'access_denied'
                      | 'limit_exceeded'
                      | 'quota_exceeded'
                      | 'bad_credentials'
                      | 'too_many_requests'
                      | 'payment_required'
                      | 'unknown'
              }
            | {
                  code: 'incorrect_version_id'
                  /** The correct current dataset version ID, which should be used instead. */
                  datasetVersionId: string
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {
            /** The new dataset version identifier, which should be used as the version identifier in subsequent requests. */
            newDatasetVersionId: string
        }
    }>

    /**
     * Add entries to the 'needs review' folder of a dataset.
     */
    addEntriesToNeedsReview(params: {
        /** The dataset's id. */
        datasetId: string
        /**
         * New data to add to the dataset. There should be one entry for each key in the dataset, and the length of the
         * data to add to all keys must be the same.
         */
        keys: {
            key: string
            data: DecthingsTensor[]
        }[]
        /**
         * If specified, the operation will only be performed if the current dataset versionId is equal to the specified
         * string.
         */
        datasetVersionId?: string
    }): Promise<{
        error?:
            | {
                  code:
                      | 'dataset_not_found'
                      | 'access_denied'
                      | 'limit_exceeded'
                      | 'quota_exceeded'
                      | 'bad_credentials'
                      | 'too_many_requests'
                      | 'payment_required'
                      | 'unknown'
              }
            | {
                  code: 'incorrect_version_id'
                  /** The correct current dataset version ID, which should be used instead. */
                  datasetVersionId: string
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {
            /** The new dataset version identifier, which should be used as the version identifier in subsequent requests. */
            newDatasetVersionId: string
        }
    }>

    /**
     * Set the data of an item within the 'needs review' folder of a dataset and move the entry into the actual
     * dataset.
     */
    finalizeNeedsReviewEntries(params: {
        /** The dataset's id. */
        datasetId: string
        /** An array containing the index to remove from 'needs review'. */
        indexes: number[]
        /**
         * New data to add to the dataset, in place of the entries removed from 'needs review'. There should be one entry
         * for each key in the dataset, and the length of the data in each key must equal the length of *indexes*.
         */
        keys: {
            key: string
            data: DecthingsTensor[]
        }[]
        /**
         * If specified, the operation will only be performed if the current dataset versionId is equal to the specified
         * string.
         */
        datasetVersionId?: string
    }): Promise<{
        error?:
            | {
                  code:
                      | 'dataset_not_found'
                      | 'index_out_of_range'
                      | 'access_denied'
                      | 'quota_exceeded'
                      | 'bad_credentials'
                      | 'too_many_requests'
                      | 'payment_required'
                      | 'unknown'
              }
            | {
                  code: 'incorrect_version_id'
                  /** The correct current dataset version ID, which should be used instead. */
                  datasetVersionId: string
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {
            /** The new dataset version identifier, which should be used as the version identifier in subsequent requests. */
            newDatasetVersionId: string
            /** The number of bytes that was removed from 'needs review'. */
            removedBytesFromNeedsReview: number
        }
    }>

    /**
     * Retrieve entries in a dataset.
     */
    getEntries(params: {
        /** The dataset's id. */
        datasetId: string
        /** Which entries to fetch. Either an array of indexes or a start/end range. */
        entries:
            | number[]
            | {
                  start: number
                  end: number
              }
        /**
         * If specified, the operation will only be performed if the current dataset versionId is equal to the specified
         * string.
         */
        datasetVersionId?: string
    }): Promise<{
        error?:
            | {
                  code: 'dataset_not_found' | 'bad_credentials' | 'too_many_requests' | 'payment_required' | 'unknown'
              }
            | {
                  code: 'incorrect_version_id'
                  /** The correct current dataset version ID, which should be used instead. */
                  datasetVersionId: string
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {
            keys: {
                name: string
                data: {
                    index: number
                    data: DecthingsTensor
                }[]
            }[]
        }
    }>

    /**
     * Retrieve entries from the 'needs review' folder of a dataset.
     */
    getNeedsReviewEntries(params: {
        /** The dataset's id. */
        datasetId: string
        /** Which entries to fetch. Either an array of indexes or a start/end range. */
        entries:
            | number[]
            | {
                  start: number
                  end: number
              }
        /**
         * If specified, the operation will only be performed if the current dataset versionId is equal to the specified
         * string.
         */
        datasetVersionId?: string
    }): Promise<{
        error?:
            | {
                  code: 'dataset_not_found' | 'bad_credentials' | 'too_many_requests' | 'payment_required' | 'unknown'
              }
            | {
                  code: 'incorrect_version_id'
                  /** The correct current dataset version ID, which should be used instead. */
                  datasetVersionId: string
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {
            keys: {
                name: string
                data: {
                    index: number
                    data: DecthingsTensor
                }[]
            }[]
        }
    }>

    /**
     * Remove entries from a dataset.
     */
    removeEntries(params: {
        /** The dataset's id. */
        datasetId: string
        /** An array of indexes of the elements to remove. */
        entries: number[]
        /**
         * If specified, the operation will only be performed if the current dataset versionId is equal to the specified
         * string.
         */
        datasetVersionId?: string
    }): Promise<{
        error?:
            | {
                  code: 'dataset_not_found' | 'index_out_of_range' | 'access_denied' | 'bad_credentials' | 'too_many_requests' | 'payment_required' | 'unknown'
              }
            | {
                  code: 'incorrect_version_id'
                  /** The correct current dataset version ID, which should be used instead. */
                  datasetVersionId: string
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {
            /** The new dataset version identifier, which should be used as the version identifier in subsequent requests. */
            newDatasetVersionId: string
            removedBytes: number
            newWaitingToRemoveBytes: number
            newWaitingToRemoveAmount: number
        }
    }>

    /**
     * Remove entries from the 'needs review' folder of a dataset.
     */
    removeNeedsReviewEntries(params: {
        /** The dataset's id. */
        datasetId: string
        /** An array of indexes of the elements to remove. */
        entries: number[]
        /**
         * If specified, the operation will only be performed if the current dataset versionId is equal to the specified
         * string.
         */
        datasetVersionId?: string
    }): Promise<{
        error?:
            | {
                  code: 'dataset_not_found' | 'index_out_of_range' | 'access_denied' | 'bad_credentials' | 'too_many_requests' | 'payment_required' | 'unknown'
              }
            | {
                  code: 'incorrect_version_id'
                  /** The correct current dataset version ID, which should be used instead. */
                  datasetVersionId: string
              }
            | {
                  code: 'invalid_parameter'
                  parameterName: string
                  reason: string
              }
        result?: {
            /** The new dataset version identifier, which should be used as the version identifier in subsequent requests. */
            newDatasetVersionId: string
            removedBytes: number
        }
    }>
}
