import { Injectable } from '@angular/core';
import {$$, api, now, showError} from "./tools";
import {timeout} from "rxjs/operators";
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {environment} from "../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  user:any;
  token: string=null;
  token_expires: Date;

  constructor(public http:HttpClient) {
    this.token=localStorage.getItem("token");
  }


  getHttpOptions(){
    let httpOptions:any = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };
    if(!this.token)this.token=localStorage.getItem("token");
    if(this.token && this.token.length>0)httpOptions.headers["Authorization"]='Token ' + this.token;
    return httpOptions;
  }



  _get(url,params:string="",_timeoutInSec=60,format="json"){
    url=api(url,params,true,format);
    return this.http.get(url,this.getHttpOptions()).pipe(timeout(_timeoutInSec*1000));
  }

  _post(url,params="",body,_timeoutInSec=60,format="json"){
    url=api(url,params,true,format);
    $$("!Appel de "+url)
    return this.http.post(url,body,this.getHttpOptions()).pipe(timeout(_timeoutInSec*1000));
  }

  _delete(url,params="") {
    url=api(url,params,true,"");
    return this.http.delete(url,this.getHttpOptions()).pipe();
  }

  _put(url,params="",body,_timeoutInSec=60){
    url=api(url,params,true,"");
    return this.http.put(url,body,this.getHttpOptions()).pipe(timeout(_timeoutInSec*1000));
  }

  _patch(url,params="",body,_timeoutInSec=60){
    url=api(url,params,true,"");
    return this.http.patch(url,body,this.getHttpOptions()).pipe(timeout(_timeoutInSec*1000));
  }

  resend(email: string) {
    return this._get("resend","email="+email);
  }

  refreshToken() {
    this.http.post('/api-token-refresh/', JSON.stringify({token: this.token}), this.getHttpOptions()).subscribe(
      data => {
        this.token=data['token'];
      },
      err => {showError(this,err);}
    );
  }

  logout(){
    $$("Déconnexion de l'utilisateur");
    this.token=null;
    this.token_expires = null;
    localStorage.removeItem("token");
    localStorage.removeItem("email");
  }


  getyaml(url:string="",name:string=""){
    let param="";
    if(url.length>0)param="url="+url;
    if(name.length>0)param="name="+name;
    return this._get("getyaml",param);
  }

  updateData(token) {
    this.token = token;
    // decode the token to read the username and expiration timestamp
    const token_parts = this.token.split(/\./);
    const token_decoded = JSON.parse(window.atob(token_parts[1]));
    this.token_expires = new Date(token_decoded.exp * 1000);
    //this.username = token_decoded.username;
  }



  login(user) {
    this.http.post('/api-token-auth/', JSON.stringify(user), this.getHttpOptions()).subscribe(
      data => {
        this.updateData(data['token']);
      },
      err => {showError(this,err);}
    );
  }



  checkCode(username: string, code: string) {
    $$("Vérification du code pour username="+username);
    return this._post("api-token-auth/", "",{"username":username,"password":code})
  }



  deluser(address: HTMLElement) {
    return this._get("deluser");
  }


  getuser(email: string) {
    return this._get("users","email="+email);
  }

  getextrauser(email: string) {
    return this._get("extrausers","search="+email);
  }

  existuser(email: string) {
    return this._get("users","email="+email);
  }


  register(body:any) {
    return this._post("users/register","",body);
  }



  setuser(fields:any) {
    return this._put("extrausers/"+fields.id+"/","",fields);
  }

  hello_world() {
    return this._get("helloworld/");
  }

  //http://localhost:8000/api/extrapows/
  getPOW(id=null) {
    let params="";
    if(id)params=id+"/";
    return this._get("extrapows/"+params);
  }

  addpow(pow: any) {
    return this._post("pows/","",pow);
  }

  addwork(work:any) {
    work.dtEnd=work.dtEnd.split("T")[0];
    work.dtStart=work.dtStart.split("T")[0];
    work.profil=environment.domain_server+"/api/profils/"+work.profil+"/";
    work.pow=environment.domain_server+"/api/pows/"+work.pow+"/";
    return this._post("works/","",work);
  }

  getworks(email: any) {
    return this._get("extraworks","profil__email="+email);
  }

  //Mise a jour du profil du user
  setprofil(data:any) {
    data.dtLastUpdate=now();
    return this._put("profils/"+data.id,"",data);
  }


  send(id: string, _from:string,text:string,social:string,send_copy:boolean,fullname:string) {
    let obj={
      _to:id,
      text:text,
      fullname:fullname,
      social:social,
      send_copy:send_copy,
      _from:_from
    }
    return this._post("send_to/","",obj);
  }

  sendmail(_to:string,subject:string,modele:string,dict:any) {
    let obj={
      to:_to,
      template:modele,
      replacement:dict,
      subject:subject
    }
    return this._post("sendmail/","",obj);
  }


  searchImage(result: any, number: number, access_token: any) {

  }

  searchPOW(query: string) {
    return this._get("pows","search="+query);
  }



  getfaqs() {
    return this.http.get(api('getyaml',"name=faqs"));
  }

  ask_perm(user: any, id: string) {
    return this.http.get(api('ask_perms',"perm="+id+"&user="+user.id));
  }
}
