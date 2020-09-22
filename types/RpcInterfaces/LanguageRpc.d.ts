type Kind = 'module' | 'class' | 'instance' | 'function' | 'param' | 'path' | 'keyword' | 'statement'

type Name = {
    name: string
    kind: Kind
    docstring: string
    full_name: string
    description: string
    params?: Name_small[]
}

type Name_small = {
    name: string
    kind: Kind
    full_name: string
    description: string
}

export interface ILanguageRpc {
    python_getCompletions(
        filename: string,
        offset: number
    ): Promise<{ error?: 'unknown' | 'EACCESS' | 'ENOENT'; result?: Name_small[] }>
    python_getHoverDetails(
        filename: string,
        offset: number
    ): Promise<{ error?: 'unknown' | 'EACCESS' | 'ENOENT'; result?: Name[] }>
    python_getDiagnostics(
        filename: string
    ): Promise<{
        error?: 'unknown' | 'EACCESS' | 'ENOENT'
        result?: { syntaxErrors: { offset: number; message: string; text: string }[]; errors: { offset: number, message: string }[] }
    }>
}
