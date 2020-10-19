import { Injectable } from '@angular/core';
import { environment } from './../../../environments/environment';
import {
  HttpClient,
  HttpErrorResponse,
  HttpResponse,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { JwtHelperService } from '@auth0/angular-jwt';

import { User } from '../../model/User';

@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {
  private host = environment.apiUrl;
  private token: string;
  private loggedInUsername: string;
  private jwtHelper = new JwtHelperService();

  constructor(private http: HttpClient) {}

  public login(user: User): Observable<HttpResponse<any> | HttpErrorResponse> {
    return this.http.post<HttpResponse<any> | HttpErrorResponse>(
      `${this.host}/user/login`,
      user,
      { observe: 'response' } // give me the all response (headers, body etc...)
    );
  }

  public register(user: User): Observable<User | HttpErrorResponse> {
    return this.http.post<User | HttpErrorResponse>(
      `${this.host}/user/register`,
      user
    );
  }

  public logout(): void {
    this.token = null;
    this.loggedInUsername = null;
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('users');
  }

  public saveToken(token: string): void {
    this.token = token;
    localStorage.setItem('token', token); // token value setted key-value pair ex: token: asd23935t
  }

  public addUserToLocalCache(user: User): void {
    localStorage.setItem('user', JSON.stringify(user));
  }

  public getUserFromLocalCache(user: User): User {
    return JSON.parse(localStorage.getItem('user')); // convert it from json string to an object
  }

  public loadToken(): void {
    this.token = localStorage.getItem('token');
  }

  public getToken(): string {
    return this.token;
  }

  public isLoggedIn(): boolean {
    this.loadToken();
    if (this.token != null && this.token !== '') {
      if (this.jwtHelper.decodeToken(this.token).sub != null || '') {
        if (this.jwtHelper.getTokenExpirationDate(this.token)) {
          this.loggedInUsername = this.jwtHelper.decodeToken(this.token).sub; // sub=subject(username)
          return true;
        }
      }
    } else {
      this.logout(); // removes everything from localstorage(user,token,users)
      return false;
    }
  }
}
