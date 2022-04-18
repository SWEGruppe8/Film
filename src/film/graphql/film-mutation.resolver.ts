/*
 * Copyright (C) 2021 - present Juergen Zimmermann, Hochschule Karlsruhe
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import {
    FilmWriteService,
    type CreateError,
    type UpdateError,
} from '../service/index.js';
import {
    JwtAuthGraphQlGuard,
    Roles,
    RolesGraphQlGuard,
} from '../../security/index.js';
import { ResponseTimeInterceptor, getLogger } from '../../logger/index.js';
import { UseGuards, UseInterceptors } from '@nestjs/common';
import { Film } from '../entity/index.js';
import { type ObjectId } from 'bson';
import { UserInputError } from 'apollo-server-express';

export type FilmDTO = Film & {
    id: string;
    version: number;
};

export interface FilmUpdateInput {
    id?: string;
    version?: number;
    film: Film;
}

interface Id {
    id: string;
}

// Authentifizierung und Autorisierung durch
//  GraphQL Shield
//      https://www.graphql-shield.com
//      https://github.com/maticzav/graphql-shield
//      https://github.com/nestjs/graphql/issues/92
//      https://github.com/maticzav/graphql-shield/issues/213
//  GraphQL AuthZ
//      https://github.com/AstrumU/graphql-authz
//      https://www.the-guild.dev/blog/graphql-authz

@Resolver()
// alternativ: globale Aktivierung der Guards https://docs.nestjs.com/security/authorization#basic-rbac-implementation
@UseGuards(JwtAuthGraphQlGuard, RolesGraphQlGuard)
@UseInterceptors(ResponseTimeInterceptor)
export class FilmMutationResolver {
    readonly #service: FilmWriteService;

    readonly #logger = getLogger(FilmMutationResolver.name);

    constructor(service: FilmWriteService) {
        this.#service = service;
    }

    @Mutation()
    @Roles('admin', 'mitarbeiter')
    async create(@Args() input: Film) {
        this.#logger.debug('createBuch: input=%o', input);
        const result = await this.#service.create(input);
        this.#logger.debug('createBuch: result=%o', result);
        if (Object.prototype.hasOwnProperty.call(result, 'type')) {
            // UserInputError liefert Statuscode 200
            throw new UserInputError(
                this.#errorMsgCreateFilm(result as CreateError),
            );
        }
        return (result as ObjectId).toString();
    }

    @Mutation()
    @Roles('admin', 'mitarbeiter')
    async update(@Args() filmDTO: FilmUpdateInput) {
        this.#logger.debug('updateFilm: filmDTO=%o', filmDTO);
        // nullish coalescing
        const { id, version, film } = filmDTO;
        const versionStr = `"${(version ?? 0).toString()}"`;

        const result = await this.#service.update(id!, film, versionStr); // eslint-disable-line @typescript-eslint/no-non-null-assertion
        if (typeof result === 'object') {
            throw new UserInputError(this.#errorMsgUpdateFilm(result));
        }
        this.#logger.debug('updateBuch: result=%d', result);
        return result;
    }

    @Mutation()
    @Roles('admin')
    async delete(@Args() id: Id) {
        const idStr = id.id;
        this.#logger.debug('deleteFilm: id=%s', idStr);
        const result = await this.#service.delete(idStr);
        this.#logger.debug('deleteFilm: result=%s', result);
        return result;
    }

    #errorMsgCreateFilm(err: CreateError) {
        switch (err.type) {
            case 'ConstraintViolations':
                return err.messages.join(' ');
            case 'TitelExists':
                return `Der Titel "${err.titel}" existiert bereits`;
            default:
                return 'Unbekannter Fehler';
        }
    }

    #errorMsgUpdateFilm(err: UpdateError) {
        switch (err.type) {
            case 'ConstraintViolations':
                return err.messages.join(' ');
            case 'TitelExists':
                return `Der Titel "${err.titel}" existiert bereits`;
            case 'FilmNotExists':
                return `Es gibt kein Buch mit der ID ${err.id}`;
            case 'VersionInvalid':
                return `"${err.version}" ist keine gueltige Versionsnummer`;
            case 'VersionOutdated':
                return `Die Versionsnummer "${err.version}" ist nicht mehr aktuell`;
            default:
                return 'Unbekannter Fehler';
        }
    }
}
