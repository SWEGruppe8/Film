/*
 * Copyright (C) 2017 - present Juergen Zimmermann, Hochschule Karlsruhe
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
 * Das Modul besteht aus der Klasse {@linkcode BuchFileService}, damit
 * Binärdateien mit dem Treiber von _MongoDB_ in _GridFS_ abgespeichert und
 * ausgelesen werden können.
 * @packageDocumentation
 */

import {
    type FilmNotExists,
    type FileFindError,
    type FileNotFound,
    type MultipleFiles,
} from './errors.js';
import {
    GridFSBucket,
    type GridFSBucketReadStream,
    type GridFSFile,
} from 'mongodb';
import { FilmReadService } from './film-read.service.js';
import { DbService } from '../../db/db.service.js';
import { type FileTypeResult } from 'file-type';
import { Injectable } from '@nestjs/common';
import { dbConfig } from '../../config/index.js';
import { getLogger } from '../../logger/index.js';
import intoStream from 'into-stream';

/**
 * Das Interface {@linkcode FileFindSuccess} beschreibt das Resultat, wenn eine
 * Binärdatei gefunden wurde und besteht aus dem Stream zum Lesen sowie dem
 * MIME-Type.
 */
export interface FileFindSuccess {
    type: 'FileFindSuccess';
    readStream: GridFSBucketReadStream;
    contentType: string;
}

/**
 * Mit der Klasse {@linkcode BuchFileService} können Binärdateien mit dem
 * Treiber von _MongoDB_ in _GridFS_ abgespeichert und ausgelesen werden.
 */
@Injectable()
export class FilmFileService {
    readonly #service: FilmReadService;

    readonly #dbService: DbService;

    readonly #logger = getLogger(FilmFileService.name);

    constructor(service: FilmReadService, dbService: DbService) {
        this.#service = service;
        this.#dbService = dbService;
    }

    /**
     * Asynchrones Abspeichern einer Binärdatei.
     *
     * @param filename ID des zugehörigen Films, die als Dateiname verwendet wird.
     * @param buffer Node-Buffer mit den Binärdaten.
     * @param contentType MIME-Type, z.B. `image/png`.
     * @returns true, falls die Binärdaten abgespeichert wurden. Sonst false.
     */
    async save(
        filename: string,
        buffer: Buffer,
        fileType: FileTypeResult | undefined,
    ) {
        this.#logger.debug(
            'save: filename=%s, fileType=%o',
            filename,
            fileType,
        );

        if (fileType === undefined) {
            return false;
        }

        // Gibt es ein Buch zur angegebenen ID?
        const film = await this.#service.findById(filename); //NOSONAR
        if (film === undefined) {
            return false;
        }

        const client = await this.#dbService.connect();
        const bucket = new GridFSBucket(client.db(dbConfig.dbName));
        await this.#delete(filename, bucket);

        const stream = intoStream(buffer);
        const options = { contentType: fileType.mime };
        stream.pipe(bucket.openUploadStream(filename, options));
        return true;
    }

    /**
     * Asynchrones Suchen nach einer Binärdatei in _GridFS_ anhand des Dateinamens.
     * @param filename Der Dateiname der Binärdatei.
     * @returns GridFSBucketReadStream, falls es eine Binärdatei mit dem
     *  angegebenen Dateinamen gibt. Im Fehlerfall ein JSON-Objekt vom Typ:
     * - {@linkcode FilmNotExists}
     * - {@linkcode FileNotFound}
     * - {@linkcode MultipleFiles}
     */
    async find(filename: string): Promise<FileFindError | FileFindSuccess> {
        this.#logger.debug('find: filename=%s', filename);
        const resultCheckFilename = await this.#checkFilename(filename);
        if (resultCheckFilename !== undefined) {
            return resultCheckFilename;
        }

        // https://mongodb.github.io/node-mongodb-native/3.5/tutorials/gridfs/streaming
        const client = await this.#dbService.connect();
        const bucket = new GridFSBucket(client.db(dbConfig.dbName));
        const contentType = await this.#getContentType(filename, bucket);
        if (typeof contentType !== 'string') {
            return { type: 'InvalidContentType' };
        }
        this.#logger.debug('find: contentType=%s', contentType);

        // https://mongodb.github.io/node-mongodb-native/3.5/tutorials/gridfs/streaming/#downloading-a-file
        // https://www.freecodecamp.org/news/node-js-streams-everything-you-need-to-know-c9141306be93
        const readStream = bucket.openDownloadStreamByName(filename);
        const result: FileFindSuccess = {
            type: 'FileFindSuccess',
            readStream,
            contentType,
        };
        return result;
    }

    async #delete(filename: string, bucket: GridFSBucket) {
        this.#logger.debug('#delete: filename=%s', filename);
        const idObjects: GridFSFile[] = await bucket
            .find({ filename })
            .toArray();
        const ids = idObjects.map((obj) => obj._id);
        this.#logger.debug('#delete: ids=%o', ids);
        ids.forEach((fileId) =>
            bucket.delete(fileId, () =>
                this.#logger.debug('#delete: geloeschte File-ID=%s', fileId),
            ),
        );
    }

    async #checkFilename(filename: string): Promise<FilmNotExists | undefined> {
        this.#logger.debug('#checkFilename: filename=%s', filename);

        // Gibt es ein Film mit dem gegebenen "filename" als ID?
        const film = await this.#service.findById(filename); //NOSONAR
        if (film === undefined) {
            const result: FilmNotExists = {
                type: 'FilmNotExists',
                id: filename,
            };
            this.#logger.debug('#checkFilename: FilmNotExists=%o', result);
            return result;
        }

        this.#logger.debug('#checkFilename: film vorhanden=%o', film );
        return undefined;
    }

    async #getContentType(filename: string, bucket: GridFSBucket) {
        let files: GridFSFile[];
        try {
            files = await bucket.find({ filename }).toArray();
        } catch (err) {
            this.#logger.error('%o', err);
            files = [];
        }

        switch (files.length) {
            case 0: {
                const error = { type: 'FileNotFound', filename };
                this.#logger.debug('#getContentType: FileNotFound=%o', error);
                return error;
            }

            case 1: {
                const [file] = files;
                if (file === undefined) {
                    const error: FileNotFound = {
                        type: 'FileNotFound',
                        filename,
                    };
                    this.#logger.debug(
                        '#getContentType: FileNotFound=%o',
                        error,
                    );
                    return error;
                }

                const { contentType } = file;
                if (contentType === undefined) {
                    return { type: 'InvalidContentType' };
                }

                this.#logger.debug(
                    '#getContentType: contentType=%s',
                    contentType,
                );
                return contentType;
            }

            default: {
                const error: MultipleFiles = {
                    type: 'MultipleFiles',
                    filename,
                };
                this.#logger.debug('#getContentType: MultipleFiles=%o', error);
                return error;
            }
        }
    }
}
