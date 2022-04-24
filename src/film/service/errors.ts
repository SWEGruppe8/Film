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

/**
 * Das Modul besteht aus den Klassen für die Fehlerbehandlung bei der Verwaltung
 * von Filmen, z.B. beim DB-Zugriff.
 * @packageDocumentation
 */

/**
 * Klasse für fehlerhafte Filmdaten. Die Meldungstexte sind in der Property
 * `msg` gekapselt.
 */
export interface ConstraintViolations {
    readonly type: 'ConstraintViolations';
    readonly messages: string[];
}

/**
 * Klasse für einen bereits existierenden Titel.
 */
export interface TitelExists {
    readonly type: 'TitelExists';
    readonly titel: string | null | undefined;
    readonly id?: string;
}

/**
 * Union-Type für Fehler beim Neuanlegen eines Filmes:
 * - {@linkcode ConstraintViolations}
 * - {@linkcode TitelExists}
 */
export type CreateError = ConstraintViolations  | TitelExists;

/**
 * Klasse für eine ungültige Versionsnummer beim Ändern.
 */
export interface VersionInvalid {
    readonly type: 'VersionInvalid';
    readonly version: string | undefined;
}

/**
 * Klasse für eine veraltete Versionsnummer beim Ändern.
 */
export interface VersionOutdated {
    readonly type: 'VersionOutdated';
    readonly id: string;
    readonly version: number;
}

/**
 * Klasse für ein nicht-vorhandenen Film beim Ändern.
 */
export interface FilmNotExists {
    readonly type: 'FilmNotExists';
    readonly id: string | undefined;
}

/**
 * Union-Type für Fehler beim Ändern eines Filmes:
 * - {@linkcode FilmNotExists}
 * - {@linkcode ConstraintViolations}
 * - {@linkcode TitelExists}
 * - {@linkcode VersionInvalid}
 * - {@linkcode VersionOutdated}
 */
export type UpdateError =
    | FilmNotExists
    | ConstraintViolations
    | TitelExists
    | VersionInvalid
    | VersionOutdated;

/**
 * Klasse für eine nicht-vorhandene Binärdatei.
 */
export interface FileNotFound {
    readonly type: 'FileNotFound';
    readonly filename: string;
}

/**
 * Klasse, falls es mehrere Binärdateien zu einem Film gibt.
 */
export interface MultipleFiles {
    readonly type: 'MultipleFiles';
    readonly filename: string;
}

/**
 * Klasse, falls der ContentType nicht korrekt ist.
 */
export interface InvalidContentType {
    readonly type: 'InvalidContentType';
}

/**
 * Union-Type für Fehler beim Lesen einer Binärdatei zu einem Film:
 * - {@linkcode FilmNotExists}
 * - {@linkcode FileNotFound}
 * - {@linkcode InvalidContentType}
 * - {@linkcode MultipleFiles}
 */
export type FileFindError =
    | FilmNotExists
    | FileNotFound
    | InvalidContentType
    | MultipleFiles;
