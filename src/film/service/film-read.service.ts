/**
 * Das Modul besteht aus der Klasse {@linkcode AuthService} für die
 * Authentifizierung.
 * @packageDocumentation
 */

 import {
    type FilmDocument,
    exactFilterProperties,
    modelName,
} from '../entity/index.js';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { ObjectID } from 'bson';
import { getLogger } from '../../logger/index.js';
import mongoose from 'mongoose';

@Injectable()
export class FilmReadService {
    readonly #filmModel: mongoose.Model<FilmDocument>;

    readonly #logger = getLogger(FilmReadService.name);

    constructor(
        @InjectModel(modelName) filmModel: mongoose.Model<FilmDocument>,
    ) {
        this.#filmModel = filmModel;
    }

    /**
     * Einen Film asynchron anhand seiner ID suchen
     * @param id ID des gesuchten Filmes
     * @returns Das gefundene Film vom Typ {@linkcode Film} oder undefined
     *          in einem Promise aus ES2015 (vgl.: Mono aus Project Reactor oder
     *          Future aus Java)
     */
         async findById(idStr: string) {
            this.#logger.debug('findById: idStr=%s', idStr);
    
            if (!ObjectID.isValid(idStr)) {
                this.#logger.debug('findById: Ungueltige ObjectID');
                return undefined;
            }
    
            const id = new ObjectID(idStr);
            const film = await this.#filmModel.findById(id); //NOSONAR
            this.#logger.debug('findById: film=%o', film);
    
            return film || undefined;
        }

    /**
     * Filme asynchron suchen.
     * @param filter Die DB-Query als JSON-Objekt
     * @returns Ein JSON-Array mit den gefundenen Filmen. Ggf. ist das Array leer.
     */
    async find(filter?: mongoose.FilterQuery<FilmDocument> | undefined) {
        this.#logger.debug('find: filter=%o', filter);

        if (filter === undefined || Object.entries(filter).length === 0) {
            return this.#findAll();
        }

        const { titel, javascript, typescript, ...dbFilter } = filter;
        if (this.#checkInvalidProperty(dbFilter)) {
            return [];
        }

        if (
            titel !== undefined &&
            titel !== null &&
            typeof titel === 'string'
        ) {
            dbFilter.titel =
                // TODO Komplexitaet des regulaeren Ausrucks analysieren
                titel.length < 10
                    ? new RegExp(titel, 'iu')
                    : titel;
        }

        const schlagwoerter = [];
        if (javascript === 'true') {
            schlagwoerter.push('JAVASCRIPT');
        }
        if (typescript === 'true') {
            schlagwoerter.push('TYPESCRIPT');
        }
        if (schlagwoerter.length === 0) {
            if (Array.isArray(dbFilter.schlagwoerter)) {
                dbFilter.schlagwoerter.splice(0);
            }
        } else {
            dbFilter.schlagwoerter = schlagwoerter;
        }

        const filme = await this.#filmModel.find( //NOSONAR
            dbFilter as mongoose.FilterQuery<FilmDocument>,
        );
        this.#logger.debug('find: filme=%o', filme);

        return filme;
    }

    async #findAll() {
        this.#logger.debug('#findAll');
        const filme = await this.#filmModel.find().sort('titel'); //NOSONAR
        this.#logger.debug('#findAll: filme=%o', filme);
        return filme;
    }

    #checkInvalidProperty(dbFilter: Record<string, string>) {
        const filterKeys = Object.keys(dbFilter);
        const result = filterKeys.some(
            (key) => !exactFilterProperties.includes(key),
        );
        this.#logger.debug('#checkInvalidProperty: result=%o', result);
        return result;
    }
}