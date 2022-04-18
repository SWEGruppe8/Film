/**
 * Das Modul besteht aus der Funktion {@linkcode getLogger} für einen Logger auf
 * der Basis von Pino: https://getpino.io
 * Alternativen: Winston, log4js, Bunyan
 * @packageDocumentation
 */

 import { type SonicBoom } from 'sonic-boom';
 import { parentLogger } from '../config/index.js';
 import type pino from 'pino';