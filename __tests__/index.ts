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
export type { FilmDTO, FilmeDTO } from '../src/film/rest/film-get.controller';
export type { Film } from '../src/film/entity/index.js';
export type { FilmDTO as FilmDTOGraphQL } from '../src/film/graphql/film-query.resolver.js';
export { MAX_RATING } from '../src/film/service/index.js';
export { loginGraphQL, loginRest } from './login.js';
export {
    apiPath,
    createTestserver,
    host,
    httpsAgent,
    loginPath,
    port,
    shutdownTestserver,
} from './testserver.js';
