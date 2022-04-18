/**
 * Das Modul besteht aus der Klasse {@linkcode FilmValidationService}.
 * @packageDocumentation
 */

import Ajv2020 from 'ajv/dist/2020.js';
import { type Film } from '../entity/index.js';
import { Injectable } from '@nestjs/common';
import ajvErrors from 'ajv-errors';
import formatsPlugin from 'ajv-formats';
import { getLogger } from '../../logger/index.js';
import { jsonSchema } from './jsonSchema.js';

@Injectable()
export class FilmValidationService {
    #ajv = new Ajv2020({
        allowUnionTypes: true,
        allErrors: true,
    });

    readonly #logger = getLogger(FilmValidationService.name);

    constructor() {
        formatsPlugin(this.#ajv, ['date', 'uri']);
        ajvErrors(this.#ajv);
    }

    /**
     * Funktion zur Validierung, wenn neue Filme angelegt oder vorhandene Filme
     * aktualisiert bzw. überschrieben werden sollen.
     */
    validate(film: Film) {
        const validate = this.#ajv.compile<Film>(jsonSchema);
        validate(film);
        const errors = validate.errors ?? [];
        const messages = errors
            .map((error) => error.message)
            .filter((msg) => msg !== undefined);
        this.#logger.debug(
            'validate: errors=%o, messages=%o',
            errors,
            messages,
        );
        return messages as string[];
    }
}