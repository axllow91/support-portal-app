import { FileUploadStatus } from './../model/file-upload.status';
import { Router } from '@angular/router';
import { CustomHtppResponse } from './../model/custom-http-response';
import {
  HttpErrorResponse,
  HttpRequest,
  HttpEvent,
  HttpEventType,
} from '@angular/common/http';
import { NotificationService } from './../service/notification.service';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { User } from '../model/user';
import { UserService } from '../service/user.service';
import { NotificationType } from '../enum/notification-type.enum';
import { NgForm } from '@angular/forms';
import { AuthenticationService } from '../service/authentication.service';
import { Role } from '../enum/role.enum';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css'],
})
export class UserComponent implements OnInit {
  private titleSubject = new BehaviorSubject<string>('Users'); // default value
  public titleAction$ = this.titleSubject.asObservable(); // action
  public users: User[];
  public user: User; // user that represents the profile
  public refreshing: boolean;
  public selectedUser: User;
  public fileName: string;
  public profileImage: File;
  private subscriptions: Subscription[] = [];
  public editUser = new User();
  private currentUsername: string;
  public fileStatus = new FileUploadStatus();

  constructor(
    private userService: UserService,
    private notificationService: NotificationService,
    private authenticationService: AuthenticationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.user = this.authenticationService.getUserFromLocalCache(); // get the user from cache
    this.getUsers(true);
  }

  public changeTitle(title: string): void {
    this.titleSubject.next(title); // the value of this subject will get changed every time the value will change
  }

  public getUsers(showNotification: boolean): void {
    this.refreshing = true;
    this.subscriptions.push(
      this.userService.getUsers().subscribe(
        (response: User[]) => {
          this.userService.addUsersToLocalCache(response); // add it to cache
          this.users = response; // populate the list of users
          this.refreshing = false;
          if (showNotification) {
            const message = `${
              response.length > 1
                ? `${response.length} Users loaded successfully`
                : 'User loaded successfully'
            }`;
            this.sendNotification(NotificationType.SUCCESS, message);
          }
        },
        (errorResponse: HttpErrorResponse) => {
          this.sendNotification(
            NotificationType.ERROR,
            errorResponse.error.message
          );
          this.refreshing = false;
        }
      )
    );
  }

  public onSelectUser(selectedUser: User): void {
    this.selectedUser = selectedUser;
    this.clickButton('openUserInfo');
  }

  public onProfileImageChange(fileName: string, profileImage: File): void {
    this.fileName = fileName;
    this.profileImage = profileImage;
  }

  public saveNewUser(): void {
    this.clickButton('new-user-save');
  }

  public onAddNewUser(userForm: NgForm): void {
    const formData = this.userService.createUserFormDate(
      null, // is null because we are creating a new user (so new user has no currentUsername only 'username')
      userForm.value,
      this.profileImage
    );
    this.subscriptions.push(
      this.userService.addUser(formData).subscribe(
        (response: User) => {
          // close model after creating the user
          this.clickButton('new-user-close');
          this.getUsers(false); // get users but do not show any notification (we want only to reload the users)
          this.fileName = null;
          this.profileImage = null;
          userForm.reset(); // remove all entries from form
          this.sendNotification(
            NotificationType.SUCCESS,
            `${response.firstName} ${response.lastName} added successfully`
          );
        },
        (errorResponse: HttpErrorResponse) => {
          this.sendNotification(
            NotificationType.ERROR,
            errorResponse.error.message
          );
          this.profileImage = null;
        }
      )
    );
  }

  public searchUsers(searchTerm: string): void {
    const results: User[] = [];
    for (const user of this.userService.getUsersFromLocalCache()) {
      // loop through the users from cache
      if (
        user.firstName.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1 ||
        user.lastName.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1 ||
        user.username.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1 ||
        user.userId.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1
      ) {
        results.push(user);
      }
    }
    this.users = results; // our search lists

    // if we deleted the user from search bar we should be return to our full list of users
    if (results.length === 0 || !searchTerm) {
      this.users = this.userService.getUsersFromLocalCache();
      this.clickButton('openUserEdit');
    }
  }

  public onEditUser(editUser: User): void {
    this.editUser = editUser; // init user that will be updated
    this.currentUsername = editUser.username; // hold the username
    this.clickButton('openUserEdit');
  }

  public onUpdateUser(): void {
    const formData = this.userService.createUserFormDate(
      this.currentUsername, // here we use the currentUsername because we have already a username and we want to update the user informations
      this.editUser, // passing the edit user
      this.profileImage
    );
    this.subscriptions.push(
      this.userService.updateUser(formData).subscribe(
        (response: User) => {
          // close model after creating the user
          this.clickButton('closeEditUserModalButton');
          this.getUsers(false); // referesh all users
          this.fileName = null;
          this.profileImage = null;
          this.sendNotification(
            NotificationType.SUCCESS,
            `${response.firstName} ${response.lastName} updated successfully`
          );
        },
        (errorResponse: HttpErrorResponse) => {
          this.sendNotification(
            NotificationType.ERROR,
            errorResponse.error.message
          );
          this.profileImage = null;
        }
      )
    );
  }

  public onDeleteUser(username: string): void {
    this.subscriptions.push(
      this.userService.deleteUser(username).subscribe(
        (response: CustomHtppResponse) => {
          this.sendNotification(NotificationType.SUCCESS, response.message);
          this.getUsers(true); // refresh the users list
        },
        (errorResponse: HttpErrorResponse) => {
          this.sendNotification(
            NotificationType.ERROR,
            errorResponse.error.message
          );
        }
      )
    );
  }

  public onResetPassword(emailForm: NgForm): void {
    this.refreshing = true;
    const emailAddress = emailForm.value['reset-password-email'];
    this.subscriptions.push(
      this.userService.resetPassword(emailAddress).subscribe(
        (response: CustomHtppResponse) => {
          this.sendNotification(NotificationType.SUCCESS, response.message);
          this.refreshing = false;
        },
        (error: HttpErrorResponse) => {
          this.sendNotification(NotificationType.WARNING, error.error.message);
          this.refreshing = true;
        },
        () => emailForm.reset()
      )
    );
  }

  public onUpdateCurrentUser(user: User): void {
    this.refreshing = true;
    this.currentUsername = this.authenticationService.getUserFromLocalCache().username;
    const formData = this.userService.createUserFormDate(
      this.currentUsername, // here we use the currentUsername because we have already a username and we want to update the user informations
      user, // passing the edit user
      this.profileImage
    );
    this.subscriptions.push(
      this.userService.updateUser(formData).subscribe(
        (response: User) => {
          this.authenticationService.addUserToLocalCache(response);
          this.getUsers(false); // referesh all users
          this.fileName = null;
          this.profileImage = null;
          this.sendNotification(
            NotificationType.SUCCESS,
            `${response.firstName} ${response.lastName} updated successfully`
          );
        },
        (errorResponse: HttpErrorResponse) => {
          this.sendNotification(
            NotificationType.ERROR,
            errorResponse.error.message
          );
          this.refreshing = false;
          this.profileImage = null;
        }
      )
    );
  }

  public onLogOut(): void {
    this.authenticationService.logOut();
    this.router.navigate(['/login']);
    this.sendNotification(
      NotificationType.SUCCESS,
      "You've been successfully logged out"
    );
  }

  public updateProfileImage(): void {
    this.clickButton('profile-image-input');
  }

  public onUpdateProfileImage(): void {
    const formData = new FormData();
    formData.append('username', this.user.username);
    formData.append('profileImage', this.profileImage);
    this.subscriptions.push(
      this.userService.updateProfileImage(formData).subscribe(
        (event: HttpEvent<any>) => {
          this.reportUploadProgress(event);
        },
        (errorResponse: HttpErrorResponse) => {
          this.sendNotification(
            NotificationType.ERROR,
            errorResponse.error.message
          );
          this.fileStatus.status = 'done'; // if error make progress bar disappear
        }
      )
    );
  }
  private reportUploadProgress(event: HttpEvent<any>): void {
    switch (event.type) {
      case HttpEventType.UploadProgress:
        this.fileStatus.percentage = Math.round(
          (100 * event.loaded) / event.total
        ); // get percetange
        this.fileStatus.status = 'progress';
        break;
      case HttpEventType.Response: // response is done this occurres
        if (event.status === 200) {
          this.user.profileImageUrl = `${
            event.body.profileImageUrl
          }?time=${new Date().getTime()}`;
          this.sendNotification(
            NotificationType.SUCCESS,
            `${event.body.firstName}\'s profile image updated successfully`
          );
          this.fileStatus.status = 'done';
          break;
        } else {
          this.sendNotification(
            NotificationType.ERROR,
            'Unable to upload image. Please try again!'
          );
          break;
        }
      default:
        'Finished all processes';
    }
  }

  private getUserRole(): string {
    return this.authenticationService.getUserFromLocalCache().role;
  }

  public get isAdmin(): boolean {
    return (
      this.getUserRole() === Role.ADMIN ||
      this.getUserRole() === Role.SUPER_ADMIN
    );
  }

  public get isManager(): boolean {
    return this.isAdmin || this.getUserRole() === Role.MANAGER;
  }

  public get isAdminOrManager(): boolean {
    return this.isAdmin || this.isManager;
  }

  private sendNotification(
    notificationType: NotificationType,
    message: string
  ): void {
    if (message) {
      this.notificationService.notify(notificationType, message);
    } else {
      this.notificationService.notify(
        notificationType,
        'An error occurred. Please try again!'
      );
    }
  }

  private clickButton(buttonId: string): void {
    document.getElementById(buttonId).click();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
