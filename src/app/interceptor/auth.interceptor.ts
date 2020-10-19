import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
} from '@angular/common/http';
import { Observable } from 'rxjs';

import { AuthenticationService } from './../service/authentication/authentication.service';

/*Interceptors 101

It provides a way to intercept HTTP requests and responses to 
transform or handle them before passing them along.
Although interceptors are capable of mutating requests and responses, 
the HttpRequest and HttpResponse instance properties are read-only , rendering them largely immutable. 
*/

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authenticationService: AuthenticationService) {}

  intercept(
    httpRequest: HttpRequest<any>,
    handler: HttpHandler
  ): Observable<HttpEvent<any>> {
    if (
      httpRequest.url.includes(`${this.authenticationService.host}/user/login`)
    ) {
      return handler.handle(httpRequest); // let the request continue his course
    }

    if (
      httpRequest.url.includes(
        `${this.authenticationService.host}/user/register`
      )
    ) {
      return handler.handle(httpRequest); // let the request continue his course
    }

    if (
      httpRequest.url.includes(
        `${this.authenticationService.host}/user/resetpassword`
      )
    ) {
      return handler.handle(httpRequest); // let the request continue his course
    }

    // for any other routes
    // we need to send the request properly
    this.authenticationService.loadToken();
    const token = this.authenticationService.getToken();
    const request = httpRequest.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });

    return handler.handle(request);
  }
}
