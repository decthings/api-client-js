export type GenericError = { code: 'bad_credentials' | 'too_many_requests' | 'unknown' } | { code: 'invalid_parameter'; parameterName: string; reason: string }
