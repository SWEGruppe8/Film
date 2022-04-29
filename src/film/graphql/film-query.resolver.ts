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
import { Args, Query, Resolver } from '@nestjs/graphql';
import { type Film, type FilmDocument } from '../entity/index.js';
import { ResponseTimeInterceptor, getLogger } from '../../logger/index.js';
import { FilmReadService } from '../service/index.js';
import { UseInterceptors } from '@nestjs/common';
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

@Resolver()
@UseInterceptors(ResponseTimeInterceptor)
export class FilmQueryResolver {
    readonly #service: FilmReadService;

    readonly #logger = getLogger(FilmQueryResolver.name);

    constructor(service: FilmReadService) {
        this.#service = service;
    }

    @Query('film')
    async findById(@Args() id: Id) {
        const idStr = id.id;
        this.#logger.debug('findById: id=%s', idStr);

        const film = await this.#service.findById(idStr);
        if (film === undefined) {
            // UserInputError liefert Statuscode 200
            // Weitere Error-Klasse in apollo-server-errors:
            // SyntaxError, ValidationError, AuthenticationError, ForbiddenError,
            // PersistedQuery, PersistedQuery
            // https://www.apollographql.com/blog/graphql/error-handling/full-stack-error-handling-with-graphql-apollo
            throw new UserInputError(
                `Es wurde kein Film mit der ID ${idStr} gefunden.`,
            );
        }
        const filmDTO = this.#toFilmDTO(film);
        this.#logger.debug('findById: filmDTO=%o', filmDTO);
        return filmDTO;
    }

    @Query('filme')
    async find(@Args() titel: { titel: string } | undefined) {
        const titelStr = titel?.titel;
        this.#logger.debug('find: titel=%s', titelStr);
        const suchkriterium = titelStr === undefined ? {} : { titel: titelStr };
        const filme = await this.#service.find(suchkriterium);
        if (filme.length === 0) {
            // UserInputError liefert Statuscode 200
            throw new UserInputError('Es wurden keine Filme gefunden.');
        }

        const filmeDTO = filme.map((film) => this.#toFilmDTO(film));
        this.#logger.debug('find: filmeDTO=%o', filmeDTO);
        return filmeDTO;
    }

    // Resultat mit id (statt _id) und version (statt __v)
    // __ ist bei GraphQL fuer interne Zwecke reserviert
    #toFilmDTO(film: FilmDocument) {
        const filmDTO: FilmDTO = {
            id: film._id.toString(),
            version: film.__v as number,
            titel: film.titel,
            rating: film.rating,
            genre: film.genre,
            studio: film.studio,
            online: film.online,
            datum: film.datum,
            homepage: film.homepage,
            schlagwoerter: film.schlagwoerter,
        };
        return filmDTO;
    }
}
