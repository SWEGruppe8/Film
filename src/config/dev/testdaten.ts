/*
 * Copyright (C) 2020 - present Juergen Zimmermann, Hochschule Karlsruhe
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
import { type Film } from '../../film/entity/index.js';
import { ObjectID } from 'bson';

// eslint-disable-next-line @typescript-eslint/naming-convention
type FilmIdVersion = Film & { _id: ObjectID; __v: number };

/* eslint-disable @typescript-eslint/naming-convention */
export const testdaten: FilmIdVersion[] = [
    // -------------------------------------------------------------------------
    // L e s e n
    // -------------------------------------------------------------------------
    {
        _id: new ObjectID('000000000000000000000001'),
        titel: 'Matrix',
        rating: 4,
        genre: 'ACTION',
        studio: 'WARNER BROS',
        online: false,
        datum: '1999-11-04',
        homepage: 'https://matrix.de',
        schlagwoerter: ['SPANNEND', 'GRUSELIG'],
        __v: 0,
    },
    {
        _id: new ObjectID('000000000000000000000002'),
        titel: 'Herbert',
        rating: 2,
        genre: 'COMEDY',
        studio: 'UNIVERSAL STUDIOS',
        online: false,
        datum: '2015-11-07',
        homepage: 'https://herbert.de',
        schlagwoerter: ['LIEBE'],
        __v: 0,
    },
    {
        _id: new ObjectID('000000000000000000000003'),
        titel: 'Sailor',
        rating: 5,
        genre: 'ROMANCE',
        studio: 'WARNER BROS',
        online: true,
        datum: '1993-07-11',
        homepage: 'https://sailor.de',
        schlagwoerter: ['SPANNEND', 'GRUSELIG'],
        __v: 0,
    },
    // -------------------------------------------------------------------------
    // A e n d e r n
    // -------------------------------------------------------------------------
    {
        _id: new ObjectID('000000000000000000000040'),
        titel: 'Moon',
        rating: 2,
        genre: 'ACTION',
        studio: 'WARNER BROS',
        online: false,
        datum: '1992-01-15',
        homepage: 'https://moon.de',
        schlagwoerter: ['SPANNEND', 'GRUSELIG'],
        __v: 0,
    },
    // -------------------------------------------------------------------------
    // L o e s c h e n
    // -------------------------------------------------------------------------
    {
        _id: new ObjectID('000000000000000000000050'),
        titel: 'Leopold',
        rating: 5,
        genre: 'ACTION',
        studio: 'WARNER BROS',
        online: false,
        datum: '1803-11-04',
        homepage: 'https://leopold.de',
        schlagwoerter: ['GRUSELIG'],
        __v: 0,
    },
    // -------------------------------------------------------------------------
    // z u r   f r e i e n   V e r f u e g u n g
    // -------------------------------------------------------------------------
    {
        _id: new ObjectID('000000000000000000000060'),
        titel: 'Bibi',
        rating: 1,
        genre: 'COMEDY',
        studio: 'DISNEY',
        online: true,
        datum: '2000-11-04',
        homepage: 'https://bibi.de',
        schlagwoerter: ['SPANNEND'],
        __v: 0,
    },
];
/* eslint-enable @typescript-eslint/naming-convention */
