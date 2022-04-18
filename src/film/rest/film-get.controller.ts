/* eslint-disable max-lines */

/**
 * Das Modul besteht aus der Controller-Klasse für Lesen an der REST-Schnittstelle.
 * @packageDocumentation
 */

// eslint-disable-next-line max-classes-per-file
import {
    ApiBearerAuth,
    ApiHeader,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiProperty,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import {
    Film,
    type Genre,
    type FilmDocument,
    type Studio,
} from '../entity/index.js';
import {
    Controller,
    Get,
    Headers,
    HttpStatus,
    Param,
    Query,
    Req,
    Res,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard, RolesGuard } from '../../security/index.js';
import { Request, Response } from 'express';
import { ResponseTimeInterceptor, getLogger } from '../../logger/index.js';
import { FilmReadService } from '../service/index.js';
import { type ObjectID } from 'bson';
import { getBaseUri } from './getBaseUri.js';
import { paths } from '../../config/index.js';

// TypeScript
interface Link {
    href: string;
}
interface Links {
    self: Link;
    // optional
    list?: Link;
    add?: Link;
    update?: Link;
    remove?: Link;
}

// Interface fuer GET-Request mit Links fuer HATEOAS
// DTO = data transfer object
export interface FilmDTO extends Film {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    _links: Links;
}

export interface FilmeDTO {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    _embedded: {
        filme: FilmDTO[];
    };
}

/**
 * Klasse für `FilmGetController`, um Queries in _OpenAPI_ bzw. Swagger zu
 * formulieren. `FilmController` hat dieselben Properties wie die Basisklasse
 * `Film` - allerdings mit dem Unterschied, dass diese Properties beim Ableiten
 * so überschrieben sind, dass sie auch nicht gesetzt bzw. undefined sein
 * dürfen, damit die Queries flexibel formuliert werden können. Deshalb ist auch
 * immer der zusätzliche Typ undefined erforderlich.
 * Außerdem muss noch `string` statt `Date` verwendet werden, weil es in OpenAPI
 * den Typ Date nicht gibt.
 */
export class FilmQuery extends Film {
    @ApiProperty({ required: false })
    declare readonly titel: string | undefined;

    @ApiProperty({ required: false })
    declare readonly rating: number | undefined;

    @ApiProperty({ required: false })
    declare readonly genre: Genre | undefined;

    @ApiProperty({ required: false })
    declare readonly studio: Studio | undefined;

    @ApiProperty({ required: false })
    declare readonly online: boolean | undefined;

    @ApiProperty({ required: false, type: String })
    declare readonly datum: string | undefined;

    @ApiProperty({ required: false })
    declare readonly homepage: string | undefined;

    @ApiProperty({ example: true, type: Boolean, required: false })
    readonly spannend: boolean | undefined;

    @ApiProperty({ example: true, type: Boolean, required: false })
    readonly gruselig: boolean | undefined;

    @ApiProperty({ example: true, type: Boolean, required: false })
    readonly liebe: boolean | undefined;
}

/**
 * Die Controller-Klasse für die Verwaltung von Filmen.
 */
// Decorator in TypeScript
@Controller(paths.api)
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ResponseTimeInterceptor)
@ApiTags('REST-API')
@ApiBearerAuth()
// Klassen ab ES 2015
export class FilmGetController {
    // readonly in TypeScript, vgl. C#
    // private ab ES 2019
    readonly #service: FilmReadService;

    readonly #logger = getLogger(FilmGetController.name);

    // Dependency Injection (DI) bzw. Constructor Injection
    // constructor(private readonly service: FilmReadService) {}
    constructor(service: FilmReadService) {
        this.#service = service;
    }

    /**
     * Ein Film wird asynchron anhand seiner ID als Pfadparameter gesucht.
     *
     * Falls es einen solchen Film gibt und `If-None-Match` im Request-Header
     * auf die aktuelle Version des Films gesetzt war, wird der Statuscode
     * `304` (`Not Modified`) zurückgeliefert. Falls `If-None-Match` nicht
     * gesetzt ist oder eine veraltete Version enthält, wird der gefundene
     * Film im Rumpf des Response als JSON-Datensatz mit Atom-Links für HATEOAS
     * und dem Statuscode `200` (`OK`) zurückgeliefert.
     *
     * Falls es keinen Film zur angegebenen ID gibt, wird der Statuscode `404`
     * (`Not Found`) zurückgeliefert.
     *
     * @param id Pfad-Parameter `id`
     * @param req Request-Objekt von Express mit Pfadparameter, Query-String,
     *            Request-Header und Request-Body.
     * @param version Versionsnummer im Request-Header bei `If-None-Match`
     * @param accept Content-Type bzw. MIME-Type
     * @param res Leeres Response-Objekt von Express.
     * @returns Leeres Promise-Objekt.
     */
    // vgl Kotlin: Schluesselwort "suspend"
    // eslint-disable-next-line max-params, max-lines-per-function
    @Get(':id')
    @ApiOperation({ summary: 'Film mit der ID suchen' })
    @ApiParam({
        name: 'id',
        description: 'Z.B. 000000000000000000000001',
    })
    @ApiHeader({
        name: 'If-None-Match',
        description: 'Header für bedingte GET-Requests, z.B. "0"',
        required: false,
    })
    @ApiOkResponse({ description: 'Der Film wurde gefunden' })
    @ApiNotFoundResponse({ description: 'Kein Film zur ID gefunden' })
    @ApiResponse({
        status: HttpStatus.NOT_MODIFIED,
        description: 'Der Film wurde bereits heruntergeladen',
    })
    async findById(
        @Param('id') id: string,
        @Req() req: Request,
        @Headers('If-None-Match') version: string | undefined,
        @Res() res: Response,
    ) {
        this.#logger.debug('findById: id=%s, version=%s"', id, version);

        if (req.accepts(['json', 'html']) === false) {
            this.#logger.debug('findById: accepted=%o', req.accepted);
            return res.sendStatus(HttpStatus.NOT_ACCEPTABLE);
        }

        let film: FilmDocument | undefined;
        try {
            // vgl. Kotlin: Aufruf einer suspend-Function
            film = await this.#service.findById(id);
        } catch (err) {
            // err ist implizit vom Typ "unknown", d.h. keine Operationen koennen ausgefuehrt werden
            // Exception einer export async function bei der Ausfuehrung fangen:
            // https://strongloop.com/strongblog/comparing-node-js-promises-trycatch-zone-js-angular
            this.#logger.error('findById: error=%o', err);
            return res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
        }

        if (film === undefined) {
            this.#logger.debug('findById: NOT_FOUND');
            return res.sendStatus(HttpStatus.NOT_FOUND);
        }
        this.#logger.debug('findById(): film=%o', film);

        // ETags
        const versionDb = film.__v as number;
        if (version === `"${versionDb}"`) {
            this.#logger.debug('findById: NOT_MODIFIED');
            return res.sendStatus(HttpStatus.NOT_MODIFIED);
        }
        this.#logger.debug('findById: versionDb=%s', versionDb);
        res.header('ETag', `"${versionDb}"`);

        // HATEOAS mit Atom Links und HAL (= Hypertext Application Language)
        const filmDTO = this.#toDTO(film, req, id);
        this.#logger.debug('findById: filmDTO=%o', filmDTO);
        return res.json(filmDTO);
    }

    /**
     * Filme werden mit Query-Parametern asynchron gesucht. Falls es mindestens
     * ein solchen Film gibt, wird der Statuscode `200` (`OK`) gesetzt. Im Rumpf
     * des Response ist das JSON-Array mit den gefundenen Filmen, die jeweils
     * um Atom-Links für HATEOAS ergänzt sind.
     *
     * Falls es kein Film zu den Suchkriterien gibt, wird der Statuscode `404`
     * (`Not Found`) gesetzt.
     *
     * Falls es keine Query-Parameter gibt, werden alle Filme ermittelt.
     *
     * @param query Query-Parameter von Express.
     * @param req Request-Objekt von Express.
     * @param res Leeres Response-Objekt von Express.
     * @returns Leeres Promise-Objekt.
     */
    @Get()
    @ApiOperation({ summary: 'Filme mit Suchkriterien suchen' })
    @ApiOkResponse({ description: 'Eine evtl. leere Liste mit Filme' })
    async find(
        @Query() query: FilmQuery,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        this.#logger.debug('find: query=%o', query);

        if (req.accepts(['json', 'html']) === false) {
            this.#logger.debug('find: accepted=%o', req.accepted);
            return res.sendStatus(HttpStatus.NOT_ACCEPTABLE);
        }

        const filme = await this.#service.find(query);
        this.#logger.debug('find: %o', filme);
        if (filme.length === 0) {
            this.#logger.debug('find: NOT_FOUND');
            return res.sendStatus(HttpStatus.NOT_FOUND);
        }

        // HATEOAS: Atom Links je Film
        const filmeDTO = filme.map((film: FilmDocument) => {
            const id = (film.id as ObjectID).toString();
            return this.#toDTO(film, req, id, false);
        });
        this.#logger.debug('find: filmeDTO=%o', filmeDTO);

        const result: FilmeDTO = { _embedded: { filme: filmeDTO } };
        return res.json(result).send();
    }

    // eslint-disable-next-line max-params
    #toDTO(film: FilmDocument, req: Request, id: string, all = true) {
        const baseUri = getBaseUri(req);
        this.#logger.debug('#toDTO: baseUri=%s', baseUri);
        const links = all
            ? {
                  self: { href: `${baseUri}/${id}` },
                  list: { href: `${baseUri}` },
                  add: { href: `${baseUri}` },
                  update: { href: `${baseUri}/${id}` },
                  remove: { href: `${baseUri}/${id}` },
              }
            : { self: { href: `${baseUri}/${id}` } };

        this.#logger.debug('#toDTO: film=%o, links=%o', film, links);
        const filmDTO: FilmDTO = {
            titel: film.titel,
            rating: film.rating,
            genre: film.genre,
            studio: film.studio,
            online: film.online,
            datum: film.datum,
            homepage: film.homepage,
            schlagwoerter: film.schlagwoerter,
            _links: links,
        };
        return filmDTO;
    }
}
/* eslint-enable max-lines */
