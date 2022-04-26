/*
 * Copyright (C) 2016 - present Juergen Zimmermann, Hochschule Karlsruhe
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
    type Film,
    MAX_RATING,
    apiPath,
    createTestserver,
    host,
    httpsAgent,
    port,
    shutdownTestserver,
} from '../index.js';
import { afterAll, beforeAll, describe, test } from '@jest/globals';
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import { HttpStatus } from '@nestjs/common';
import { loginRest } from '../login';

// -----------------------------------------------------------------------------
// T e s t d a t e n
// -----------------------------------------------------------------------------
const geaenderterFilm: Film = {
    titel: 'Geaendert',
    rating: 1,
    genre: 'ACTION',
    studio: 'WARNER',
    online: false,
    datum: '2022-02-03',
    homepage: 'https://test.te',
    schlagwoerter: ['SPANNEND', 'GRUSELIG'],
};
const idVorhanden = '000000000000000000000040';

const geaenderterFilmIdNichtVorhanden: Film = {
    titel: 'Nichtvorhanden',
    rating: 1,
    genre: 'ACTION',
    studio: 'UNIVERSAL',
    online: true,
    datum: '2022-02-04',
    homepage: 'https://nichtvorhanden.de',
    schlagwoerter: ['SPANNEND', 'GRUSELIG'],
};
const idNichtVorhanden = '999999999999999999999999';

const geaenderterFilmInvalid: Record<string, unknown> = {
    titel: '?!$',
    rating: -1,
    genre: 'UNSICHTBAR',
    studio: 'NO_Studio',
    online: true,
    datum: '12345-123-123',
    schlagwoerter: [],
};

// studio wird nicht geaendet
const veraltesFilm: Omit<Film, 'studio'> = {
    titel: 'Veraltet',
    rating: 1,
    genre: 'COMEDY',
    online: true,
    datum: '2022-02-03',
    homepage: 'https://test.te',
    schlagwoerter: ['LIEBE'],
};

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
// Test-Suite
// eslint-disable-next-line max-lines-per-function
describe('PUT /api/:id', () => {
    let client: AxiosInstance;
    const headers: Record<string, string> = {
        'Content-Type': 'application/json', // eslint-disable-line @typescript-eslint/naming-convention
    };

    // Testserver starten und dabei mit der DB verbinden
    beforeAll(async () => {
        await createTestserver();

        const baseURL = `https://${host}:${port}/`;
        client = axios.create({
            baseURL,
            headers,
            httpsAgent,
            validateStatus: (status) => status < 500, // eslint-disable-line @typescript-eslint/no-magic-numbers
        });
    });

    afterAll(async () => {
        await shutdownTestserver();
    });

    test('Vorhandenen Film aendern', async () => {
        // given
        const url = `${apiPath}/${idVorhanden}`;
        const token = await loginRest(client);
        headers.Authorization = `Bearer ${token}`;
        headers['If-Match'] = '"0"';

        // when
        const response: AxiosResponse<string> = await client.put(
            url,
            geaenderterFilm,
            { headers },
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.NO_CONTENT);
        expect(data).toBe('');
    });

    test('Nicht-vorhandenen Film aendern', async () => {
        // given
        const url = `${apiPath}/${idNichtVorhanden}`;
        const token = await loginRest(client);
        headers.Authorization = `Bearer ${token}`;
        headers['If-Match'] = '"0"';

        // when
        const response: AxiosResponse<string> = await client.put(
            url,
            geaenderterFilmIdNichtVorhanden,
            { headers },
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.PRECONDITION_FAILED);
        expect(data).toBe(
            `Es gibt kein Film mit der ID "${idNichtVorhanden}".`,
        );
    });

    test('Vorhandenes Film aendern, aber mit ungueltigen Daten', async () => {
        // given
        const url = `${apiPath}/${idVorhanden}`;
        const token = await loginRest(client);
        headers.Authorization = `Bearer ${token}`;
        headers['If-Match'] = '"0"';

        // when
        const response: AxiosResponse<string> = await client.put(
            url,
            geaenderterFilmInvalid,
            { headers },
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
        expect(data).toEqual(
            expect.arrayContaining([
                'Ein Filmtitel muss mit einem Buchstaben, einer Ziffer oder _ beginnen.',
                `Eine Bewertung muss zwischen 0 und ${MAX_RATING} liegen.`,
                'Das Genre eines Filmes muss COMEDY, ACTION oder ROMANCE sein.',
                'Das Studio eines Filmes muss DISNEY, WARNER oder UNIVERSAL sein.',
                'Das Datum muss im Format yyyy-MM-dd sein.',
            ]),
        );
    });

    test('Vorhandenen Film aendern, aber ohne Versionsnummer', async () => {
        // given
        const url = `${apiPath}/${idVorhanden}`;
        const token = await loginRest(client);
        headers.Authorization = `Bearer ${token}`;
        delete headers['If-Match'];

        // when
        const response: AxiosResponse<string> = await client.put(
            url,
            geaenderterFilm,
            { headers },
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.PRECONDITION_REQUIRED);
        expect(data).toBe('Header "If-Match" fehlt');
    });

    test('Vorhandenen Film aendern, aber mit alter Versionsnummer', async () => {
        // given
        const url = `${apiPath}/${idVorhanden}`;
        const token = await loginRest(client);
        headers.Authorization = `Bearer ${token}`;
        headers['If-Match'] = '"-1"';

        // when
        const response: AxiosResponse<string> = await client.put(
            url,
            veraltesFilm,
            { headers },
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.PRECONDITION_FAILED);
        expect(data).toEqual(expect.stringContaining('Die Versionsnummer'));
    });

    test('Vorhandenen Film aendern, aber ohne Token', async () => {
        // given
        const url = `${apiPath}/${idVorhanden}`;
        delete headers.Authorization;
        headers['If-Match'] = '"0"';

        // when
        const response: AxiosResponse<Record<string, any>> = await client.put(
            url,
            geaenderterFilm,
            { headers },
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.FORBIDDEN);
        expect(data.statusCode).toBe(HttpStatus.FORBIDDEN);
    });

    test('Vorhandenen Film aendern, aber mit falschem Token', async () => {
        // given
        const url = `${apiPath}/${idVorhanden}`;
        const token = 'FALSCH';
        headers.Authorization = `Bearer ${token}`;

        // when
        const response: AxiosResponse<Record<string, any>> = await client.put(
            url,
            geaenderterFilm,
            { headers },
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.FORBIDDEN);
        expect(data.statusCode).toBe(HttpStatus.FORBIDDEN);
    });
});
