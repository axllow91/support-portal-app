import { UserComponent } from './user/user.component';
import { RegisterComponent } from './register/register.component';
import { NotificationModule } from './sub-modules/notification.module';
import { AppRoutingModule } from './sub-modules/app-routing.module';
import { AuthenticationGuard } from './guard/authentication.guard';
import { AuthInterceptor } from './interceptor/auth.interceptor';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { AppComponent } from './app.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UserService } from './service/user.service';
import { LoginComponent } from './login/login.component';
import { AuthenticationService } from './service/authentication.service';

@NgModule({
  declarations: [AppComponent, LoginComponent, RegisterComponent, UserComponent],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,
    HttpClientModule,
    NotificationModule,
  ],
  providers: [
    AuthenticationService,
    UserService,
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    AuthenticationGuard,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
