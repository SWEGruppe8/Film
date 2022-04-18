import { Global, Module } from '@nestjs/common';
import { InfoService } from './info.service.js';
import { ResponseTimeInterceptor } from './response-time.interceptor.js';

/**
 * Das Modul besteht aus allgemeinen Services
 * @packageDocumentation
 */

/**
 * Die dekorierte Modul-Klasse mit den Service-Klassen.
 */
@Global()
@Module({
    providers: [InfoService, ResponseTimeInterceptor],
    exports: [InfoService, ResponseTimeInterceptor],
})
export class LoggerModule {}