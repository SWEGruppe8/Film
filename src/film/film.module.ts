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
    FilmFileController,
    FilmGetController,
    FilmWriteController,
} from './rest/index.js';
import {
    FilmFileService,
    FilmReadService,
    FilmValidationService,
    FilmWriteService,
} from './service/index.js';
import { FilmMutationResolver, FilmQueryResolver } from './graphql/index.js';
import { collectionName, filmSchema } from './entity/index.js';
import { AuthModule } from '../security/auth/auth.module.js';
import { DbModule } from '../db/db.module.js';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

/**
 * Das Modul besteht aus Controller- und Service-Klassen für die Verwaltung von
 * Filmen.
 * @packageDocumentation
 */

/**
 * Die dekorierte Modul-Klasse mit Controller- und Service-Klassen sowie der
 * Funktionalität für Mongoose.
 */
@Module({
    imports: [
        MongooseModule.forFeature([
            {
                name: collectionName,
                schema: filmSchema,
                collection: collectionName,
            },
        ]),
        AuthModule,
        DbModule,
    ],
    controllers: [FilmGetController, FilmWriteController, FilmFileController],
    // Provider sind z.B. Service-Klassen fuer DI
    providers: [
        FilmReadService,
        FilmWriteService,
        FilmFileService,
        FilmValidationService,
        FilmQueryResolver,
        FilmMutationResolver,
    ],
    // Export der Provider fuer DI in anderen Modulen
    exports: [
        FilmReadService,
        FilmWriteService,
        FilmValidationService,
        FilmFileService,
    ],
})
export class FilmModule {}
