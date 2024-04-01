import { DecthingsParameterDefinition, DecthingsTensor } from '../tensor'

export type Dataset = {
    id: string
    name: string
    description: string
    /**
     * If this dataset was created by a user, the owner will be the userId for that user. Otherwise, the dataset was
     * be created by Decthings, in which case the owner will be "decthings".
     */
    owner: string
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
        /**
         * Each key contains separate data, allowing you to mix multiple types. For example, for an image dataset you
         * could have an "image" of type image, and "label" of type string.
         */
        keys: DecthingsParameterDefinition[]
    }): Promise<{
        error?:
            | {
                  code: 'quota_exceeded' | 'bad_credentials' | 'too_many_requests' | 'payment_required' | 'unknown'
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
        }
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
        /** Which datasets to fetch. If unspecified, all datasets will be fetched. */
        datasetIds?: string[]
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
