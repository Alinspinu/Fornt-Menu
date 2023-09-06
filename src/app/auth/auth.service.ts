import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import {  BehaviorSubject, from, map, tap } from "rxjs";
import  jwt_decode  from 'jwt-decode'
import { Preferences } from "@capacitor/preferences";
import User from "./user.model";
import { CartService } from "../cart/cart.service";
import { TabsService } from "../tabs/tabs.service";


export interface AuthResData {
message: string ,
user: {
  name: string,
  email: string,
  id: string,
}
}


@Injectable({providedIn: 'root'})

export class AuthService{
  baseUrl: string = 'http://localhost:8080/auth/';
  baseUrlHeroku: string = 'https://www.cafetish.com/api/';
  newUrl: string = 'https://flow-api-394209.lm.r.appspot.com/auth/';
  activeLogoutTimer!: any;
  emptyUser: User = {_id: '', name:'',token:'',cashBack: -1, admin: 0, email:'', tokenExpirationDate: '', status: ''};

  private user = new BehaviorSubject<User>(this.emptyUser);

  get user$() {
      return from(Preferences.get({key: 'authData'})).pipe(map(data => {
        if(data.value){
          const userData = JSON.parse(data.value) as {
            _id: string,
            name: string,
            token: string,
            admin: number,
            cashBack: number,
            email: string,
            tokenExpirationDate: any,
            status: string,
          };
          const tokenDate = new Date(userData.tokenExpirationDate).getTime() - new Date().getTime();
          if(tokenDate <= 0){
            return this.user.asObservable();
          } else if(tokenDate > 0) {
            this.user.next(userData);
            this.aoutoLogout(tokenDate);
            return this.user.asObservable();
          } else if(this.user.value.cashBack < userData.cashBack && this.user.value.cashBack !== -1){
            userData.cashBack = this.user.value.cashBack;
            this.user.next(userData);
            return this.user.asObservable();
          }else {
            this.user.next(userData);
            return this.user.asObservable();
          };
        } else {
          return this.user.asObservable();
        };
      }));
  };

  constructor(private http: HttpClient, private cartSrv: CartService, private tabSrv: TabsService){}

  onLogin(name: string, password: string){
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };
    return this.http.post<any>(`${this.newUrl}login`,{name, password}, httpOptions)
        .pipe(tap(this.setAndStoreUserData.bind(this)));
  }

  onRegister(name: string, email: string, password: string, confirmPassword: string, firstCart: string){
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };
    return this.http.post<{message: string, id: string}>(`${this.newUrl}register`,{name, email, password, confirmPassword, firstCart}, httpOptions);
  };

  verifyToken(token: string){
    return this.http.post<any>(`${this.newUrl}verify-token`, {token: token})
        .pipe(tap(this.setAndStoreUserData.bind(this)));
  };

  sendResetEmail(email: string){
   return this.http.post<AuthResData>(`${this.newUrl}send-reset-email`, {email});
  };

  resetPassword(token: string, password: string, confirmPassword: string){
    return this.http.post(`${this.newUrl}reset-password`, {token, password, confirmPassword})
        .pipe(tap(this.setAndStoreUserData.bind(this)));
  }

  private setAndStoreUserData(userData: any){
    if(userData.message){
    } else {
      const decodedToken: any = jwt_decode(userData.token);
      const expirationDate: any = new Date(+Date.now().toString() + (decodedToken.exp-decodedToken.iat) * 1000);
      const data = JSON.stringify({
        _id: decodedToken.userId,
        name: userData.name,
        token: userData.token,
        admin: userData.admin,
        cashBack: userData.cashBack,
        email: userData.email,
        tokenExpirationDate: expirationDate,
        status: userData.status,
      });
      const tokenDate = new Date(expirationDate).getTime() - new Date().getTime();
      this.aoutoLogout(tokenDate);
      this.user.next(JSON.parse(data));
      Preferences.set({key: 'authData', value: data});
    };
  };

  updateCaskBack(user: User){
     this.user.next(user);
  }

  logout(){
    if(this.activeLogoutTimer){
      clearTimeout(this.activeLogoutTimer);
    }
    Preferences.remove({key: "authData"});
    Preferences.remove({key: 'data'});
    this.cartSrv.removeCart();
    this.tabSrv.clearQty();
    this.user.next(this.emptyUser);
  }

  private aoutoLogout(duration: number) {
    if(this.activeLogoutTimer){
      clearTimeout(this.activeLogoutTimer);
    }
    this.activeLogoutTimer = setTimeout(()=> {
      this.logout();
    }, duration);
  };

};
