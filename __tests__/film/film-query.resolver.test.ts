/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-extra-non-null-assertion */
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
import {
    type FilmDTOGraphQL,
    createTestserver,
    host,
    httpsAgent,
    port,
    shutdownTestserver,
} from '../index.js';
import { type GraphQLRequest, type GraphQLResponse } from 'apollo-server-types';
import { afterAll, beforeAll, describe, test } from '@jest/globals';
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import { HttpStatus } from '@nestjs/common';
import each from 'jest-each';

// -----------------------------------------------------------------------------
// T e s t d a t e n
// -----------------------------------------------------------------------------
const idVorhanden = [
    '000000000000000000000001',
    '000000000000000000000002',
    '000000000000000000000003',
];

const titelVorhanden = ['Matrix', 'Herbert', 'Sailor'];

const teilTitelVorhanden = ['a', 't', 'r'];

const teilTitelNichtVorhanden = ['Xyz', 'abc'];

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
// Test-Suite
// eslint-disable-next-line max-lines-per-function
describe('GraphQL Queries', () => {
    let client: AxiosInstance;
    const graphqlPath = 'graphql';

    // Testserver starten und dabei mit der DB verbinden
    beforeAll(async () => {
        await createTestserver();
        const baseURL = `https://${host}:${port}/`;
        client = axios.create({
            baseURL,
            httpsAgent,
        });
    });

    afterAll(async () => {
        await shutdownTestserver();
    });

    each(idVorhanden).test('Film zu vorhandener ID %s', async (id: string) => {
        // given
        const body: GraphQLRequest = {
            query: `
                {
                    film(id: "${id}") {
                        titel
                        genre
                        studio
                        version
                    }
                }
            `,
        };

        // when
        const response: AxiosResponse<GraphQLResponse> = await client.post(
            graphqlPath,
            body,
        );

        // then
        const { status, headers, data } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.errors).toBeUndefined();
        expect(data.data).toBeDefined();

        const { film } = data.data!;
        const result: FilmDTOGraphQL = film;

        expect(result.titel).toMatch(/^\w/u);
        expect(result.version).toBeGreaterThan(-1);
        expect(result.id).toBeUndefined();
    });

    test('Film zu nicht-vorhandener ID', async () => {
        // given
        const id = '999999999999999999999999';
        const body: GraphQLRequest = {
            query: `
                {
                    film(id: "${id}") {
                        titel
                    }
                }
            `,
        };

        // when
        const response: AxiosResponse<GraphQLResponse> = await client.post(
            graphqlPath,
            body,
        );

        // then
        const { status, headers, data } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.data!.film).toBeNull();

        const { errors } = data;

        expect(errors).toHaveLength(1);

        const [error] = errors!;
        const { message, path, extensions } = error!;

        expect(message).toBe(`Es wurde kein Film mit der ID ${id} gefunden.`);
        expect(path).toBeDefined();
        expect(path!![0]).toBe('film');
        expect(extensions).toBeDefined();
        expect(extensions!.code).toBe('BAD_USER_INPUT');
    });

    each(titelVorhanden).test(
        'Film zu vorhandenem Titel %s',
        async (titel: string) => {
            // given
            const body: GraphQLRequest = {
                query: `
                    {
                        filme(titel: "${titel}") {
                            titel
                            genre
                        }
                    }
                `,
            };

            // when
            const response: AxiosResponse<GraphQLResponse> = await client.post(
                graphqlPath,
                body,
            );

            // then
            const { status, headers, data } = response;

            expect(status).toBe(HttpStatus.OK);
            expect(headers['content-type']).toMatch(/json/iu);
            expect(data.errors).toBeUndefined();

            expect(data.data).toBeDefined();

            const { filme } = data.data!;

            expect(filme).not.toHaveLength(0);

            const filmeArray: FilmDTOGraphQL[] = filme;

            expect(filmeArray).toHaveLength(1);

            const [film] = filmeArray;

            expect(film!.titel).toBe(titel);
        },
    );

    each(teilTitelVorhanden).test(
        'Film zu vorhandenem Teil-Titel %s',
        async (teilTitel: string) => {
            // given
            const body: GraphQLRequest = {
                query: `
                    {
                        filme(titel: "${teilTitel}") {
                            titel
                            genre
                        }
                    }
                `,
            };

            // when
            const response: AxiosResponse<GraphQLResponse> = await client.post(
                graphqlPath,
                body,
            );

            // then
            const { status, headers, data } = response;

            expect(status).toBe(HttpStatus.OK);
            expect(headers['content-type']).toMatch(/json/iu);
            expect(data.errors).toBeUndefined();
            expect(data.data).toBeDefined();

            const { filme } = data.data!;

            expect(filme).not.toHaveLength(0);

            (filme as FilmDTOGraphQL[])
                .map((film) => film.titel!)
                .forEach((titel: string) =>
                    expect(titel.toLowerCase()).toEqual(
                        expect.stringContaining(teilTitel),
                    ),
                );
        },
    );

    each(teilTitelNichtVorhanden).test(
        'Film zu nicht vorhandenem Titel %s',
        async (teilTitel: string) => {
            // given
            const body: GraphQLRequest = {
                query: `
                    {
                        filme(titel: "${teilTitel}") {
                            titel
                            genre
                        }
                    }
                `,
            };

            // when
            const response: AxiosResponse<GraphQLResponse> = await client.post(
                graphqlPath,
                body,
            );

            // then
            const { status, headers, data } = response;

            expect(status).toBe(HttpStatus.OK);
            expect(headers['content-type']).toMatch(/json/iu);
            expect(data.data!.filme).toBeNull();

            const { errors } = data;

            expect(errors).toHaveLength(1);

            const [error] = errors!;
            const { message, path, extensions } = error!;

            expect(message).toBe('Es wurden keine Filme gefunden.');
            expect(path).toBeDefined();
            expect(path!![0]).toBe('filme');
            expect(extensions).toBeDefined();
            expect(extensions!.code).toBe('BAD_USER_INPUT');
        },
    );
});
/* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-extra-non-null-assertion */
