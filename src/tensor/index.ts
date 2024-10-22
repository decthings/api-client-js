import { DecthingsElementType } from './element'

export * from './element'
export * from './parameter'
export * from './tensor'

/**
 * Specifies rules for the shape and allowed data types for a tensor.
 */
export type DecthingsTensorRules = {
    /**
     * Shape of the tensor.
     *
     * DecthingsTensors are multi-dimensional arrays. The shape defines how many dimensions there are, and
     * the number of elements in each dimension.
     *
     * [] would mean a scalar.
     * [1] would mean an array that contains just a single element, [2] would mean two elements and so on.
     * [2, 1] would mean an array that contains two arrays that each contain one element.
     * [2, 2, 1] would mean an array that contains two arrays that each contain two arrays that each contain
     * one element, and so on.
     *
     * Providing a value of -1 in any place would allow that dimension to be of any length.
     */
    shape: number[]
    /**
     * A list of the allowed types of elements in the data array.
     */
    allowedTypes: DecthingsElementType[]
    /**
     * Annotations are used by the user interface to for example specify minimum/maximum values for a field.
     */
    annotations: string[]
}

/**
 * Defines name and rules for a parameter.
 */
export type DecthingsParameterDefinition = {
    name: string
    required: boolean
    rules: DecthingsTensorRules
}
