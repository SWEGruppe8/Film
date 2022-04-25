import { type GenericJsonSchema } from './GenericJsonSchema.js';

export const MAX_RATING = 5;

export const jsonSchema: GenericJsonSchema = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: 'https://acme.com/film.json#',
    title: 'Film',
    description: 'Eigenschaften eines Films: Typen und Constraints',
    type: 'object',
    properties: {
        _id: { type: 'object' },
        _v: {
            type: 'number',
            minimum: 0,
        },
        version: {
            type: 'number',
            minimum: 0,
        },
        titel: {
            type: 'string',
            pattern: '^\\w.*',
        },
        rating: {
            type: 'number',
            minimum: 0,
            maximum: MAX_RATING,
        },
        genre: {
            type: 'string',
            enum: ['COMEDY', 'ACTION', 'ROMANCE', ''],
        },
        studio: {
            type: 'string',
            enum: ['DISNEY', 'WARNER', 'UNIVERSAL', ''],
        },

        online: { type: 'boolean' },
        datum: { type: 'string', format: 'date' },
        homepage: { type: 'string', format: 'uri' },
        schlagwoerter: {
            type: 'array',
            items: { type: 'string' },
        },
    },

    required: ['titel', 'genre', 'studio'],
    additionalProperties: false,
    errorMessage: {
        properties: {
            version: 'Die Versionsnummer muss mindestens 0 sein.',
            titel: 'Ein Filmtitel muss mit einem Buchstaben, einer Ziffer oder _ beginnen.',
            rating: 'Eine Bewertung muss zwischen 0 und 5 liegen.',
            genre: 'Das Genre eines Filmes muss COMEDY, ACTION oder ROMANCE sein.',
            studio: 'Das Studio eines Filmes muss DISNEY, WARNER oder UNIVERSAL sein.',
            online: '"online" muss auf true oder false gesetzt sein.',
            datum: 'Das Datum muss im Format yyyy-MM-dd sein.',
            homepage: 'Die Homepage ist nicht korrekt.',
        },
    },
};
