/**
 * An array with any number of dimensions, but where each element still must be of type T.
 */
export interface AnyDimensionalArray<T> extends Array<AnyDimensionalArray<T> | T> {}

/**
 * An array with any number of dimensions, but where each element still must be of type T.
 *
 * Also allows the value to not be an array, i.e just type T.
 */
export type AnyDimensional<T> = T | AnyDimensionalArray<T>

/**
 * All available data types.
 */
export type IDataType = 'string' | 'number' | 'boolean' | 'empty' | 'binary' | 'image' | 'audio' | 'video' | 'labelled_data'

/**
 * A blob of data that isn't an array.
 */
export type IDataElement =
    | string
    | number
    | boolean
    | { type: 'empty' }
    | { type: 'binary'; value: string }
    | { type: 'image'; imageFormat: 'png' | 'jpeg'; value: string }
    | { type: 'audio'; value: string }
    | { type: 'video'; value: string }
    | {
          type: 'labelled_data'
          value: { data: IData; label: IData }
      }

/**
 * A blob of data.
 */
export type IData = AnyDimensional<IDataElement>

/**
 * A blob of data, but it must be a one-dimensional array.
 */
export type IDataOneDimensional = IDataElement[]

/**
 * A blob of data, but it must an array (can have any number of dimensions).
 */
export type IDataMultiDimensional = AnyDimensionalArray<IDataElement>

/**
 * Provides a blob of data that isn't an array.
 */
export type IDataProviderElement =
    | Exclude<IDataElement, { type: 'labelled_data' }>
    | { type: 'labelled_data'; value: { data: IDataProvider; label: IDataProvider } }

/**
 * Provides a blob of data.
 */
export type IDataProvider = AnyDimensional<IDataProviderElement | { type: 'dataset'; datasetId: string }>

/**
 * Provides a blob of data, but it must be a one-dimensional array.
 */
export type IDataProviderOneDimensional = IDataProviderElement[] | { type: 'dataset'; datasetId: string }

/**
 * Provides a blob of data, but it must be an array (can have any number of dimensions).
 */
export type IDataProviderMultiDimensional =
    | AnyDimensionalArray<IDataProviderElement | { type: 'dataset'; datasetId: string }>
    | { type: 'dataset'; datasetId: string }

/**
 * All available array types.
 */
export type IArrayType = 'not-array' | 'one-dimensional' | 'multi-dimensional' | 'any'

/**
 * All available array types for a dataset. Since a dataset cannot be a single element, "not-array" and "any" are excluded.
 */
export type IDatasetArrayType = 'one-dimensional' | 'multi-dimensional'

/**
 * Specifies a name for a parameter, and rules defining the type of the value.
 */
export type IParameterDef = {
    name: string
    rules: { array: 'not-array' | 'one-dimensional' | 'multi-dimensional' | 'any'; type: IDataType | 'any' }
}

/**
 * Provides a value for the parameter with the specified name.
 */
export type IParameter = {
    name: string
    value: IDataProvider
}
