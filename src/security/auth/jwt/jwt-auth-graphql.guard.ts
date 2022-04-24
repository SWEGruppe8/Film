import { type ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';
import { type Request } from 'express';
import { type User } from '../service/index.js';
import { getLogger } from '../../../logger/index.js';

@Injectable()
export class JwtAuthGraphQlGuard extends AuthGuard('jwt') {
    readonly #logger = getLogger(JwtAuthGraphQlGuard.name);

    /**
     * Ermittlung des Request-Objekts bei GraphQL.
     * @param context der Ausführungskontext, mit dem das Request-Objekt
     * ermittelt wird. Siehe https://docs.nestjs.com/security/authentication#graphql
     *
     * `override` kann nicht verwendet werden. Details siehe in der funktionalen
     * Implementierung in https://github.com/nestjs/passport/blob/master/lib/auth.guard.ts
     */
    getRequest(context: ExecutionContext): Request {
        this.#logger.debug('getRequest');
        return GqlExecutionContext.create(context).getContext().req as Request;
    }

    /**
     * Die geerbte Methode wird überschrieben, damit das User-Objekt im
     * Request-Objekt gespeichert wird.
     * @param _err wird nicht benutzt
     * @param user das User-Objekt, das durch `LocalStrategy` ermittelt wurde.
     * @param _info wird nicht benutzt
     * @param context der Ausführungskontext, mit dem das Request-Objekt
     * ermittelt wird
     */
    // eslint-disable-next-line max-params
    override handleRequest(
        _err: any,
        user: any,
        _info: any,
        context: ExecutionContext,
    ) {
        this.#logger.debug('handleRequest: user=%o', user);
        const request = this.getRequest(context);
        request.user = user as User;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return user;
    }
}
