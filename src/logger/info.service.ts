/**
 * Das Modul enthält die Funktion, um die Test-DB neu zu laden.
 * @packageDocumentation
 */

 import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';
 import { cloud, k8sConfig, nodeConfig, paths } from '../config/index.js';
 import { release, userInfo } from 'node:os';
 import { getLogger } from './logger.js';
 import { hash } from 'argon2';
 import ip from 'ip';
 import osName from 'os-name';
 import stripIndent from 'strip-indent';
 
 /**
  * Die Test-DB wird im Development-Modus neu geladen, nachdem die Module
  * initialisiert sind, was duch `OnApplicationBootstrap` realisiert wird.
  */
 @Injectable()
 export class InfoService implements OnApplicationBootstrap {
     readonly #logger = getLogger(InfoService.name);
 
     /**
      * Die Test-DB wird im Development-Modus neu geladen.
      */
     async onApplicationBootstrap() {
         const banner = `Film`;
         const { host, httpsOptions, nodeEnv, port, serviceHost, servicePort } =
             nodeConfig;
         const isK8s = k8sConfig.detected;
         let plattform: string;
         if (isK8s) {
             plattform = `Kubernetes: BUCH_SERVICE_HOST=${serviceHost}, BUCH_SERVICE_PORT=${servicePort}`;
         } else if (cloud === 'heroku') {
             plattform = 'Heroku';
         } else {
             plattform = 'Kubernetes: N/A';
         }
 
         this.#logger.info(stripIndent(banner));
         // https://nodejs.org/api/process.html
         // "Template String" ab ES 2015
         this.#logger.info('Node: %s', process.version);
         this.#logger.info('NODE_ENV: %s', nodeEnv);
         this.#logger.info(plattform);
 
         const desPods = isK8s ? ' des Pods' : '';
         this.#logger.info('Rechnername%s: %s', desPods, host);
         this.#logger.info('IP-Adresse%s: %s', desPods, ip.address());
         this.#logger.info('Port%s: %s', desPods, port);
         if (cloud !== 'heroku') {
             this.#logger.info(
                 '%s',
                 httpsOptions === undefined ? 'HTTP (ohne TLS)' : 'HTTPS',
             );
         }
         this.#logger.info('Betriebssystem: %s (%s)', osName(), release());
         this.#logger.info('Username: %s', userInfo().username);
         this.#logger.info(
             'OpenAPI: /%s /%s-json',
             paths.swagger,
             paths.swagger,
         );
 
         // const options: argon2.Options = {...};
         const hashValue = await hash('p');
         this.#logger.debug('argon2: p -> %s', hashValue);
     }
 }
 