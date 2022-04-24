/*eslint linebreak-style: ["error", "windows"]*/
/**
 * Das Modul besteht aus Interfaces, Klassen und Funktionen für Filme als
 * _Entity_ gemäß _Domain Driven Design_. Dazu gehört auch die Validierung.
 * @packageDocumentation
 */

export {
    Film,
    type Genre,
    type FilmDocument,
    type Studio,
    filmSchema,
    collectionName,
    exactFilterProperties,
    modelName,
} from './film';
