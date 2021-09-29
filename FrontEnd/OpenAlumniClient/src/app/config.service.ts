import { Injectable } from '@angular/core';
import {environment} from '../environments/environment';
import {ApiService} from "./api.service";
import {Platform} from "@angular/cdk/platform";
import {HttpClient} from "@angular/common/http";
import { Location } from '@angular/common';
import {$$, initAvailableCameras, showMessage} from "./tools";

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  visibleTuto: Boolean | boolean=false;
  user: any;
  values: any;
  config:any;
  webcamsAvailable: any;
  width_screen: number;
  ready=false;

  profils:any[]=[];
  jobs: any[]=[];
  query_cache: any[]; //Conserve le contenu de la dernière requete

  constructor(private location: Location,
              private http: HttpClient,
              public platform:Platform,
              public api:ApiService) {
  }


  public async getJson(jsonFile:string): Promise<any> {
    return Promise.resolve((await this.http.get(jsonFile).toPromise()));
  }


  public hasPerm(perms:string,comments=""):boolean {
    if(!this.user)return false;
    if(!this.user.perm)return false;
    for(let p of perms.split(" ")){
      if(this.user.perm.indexOf(p)==-1){
        return false;
      }
    }
    return true;
  }



  private async getConfig(): Promise<any> {
    if (!this.config) {
      this.config = (await this.api.getyaml("",environment.config_file).toPromise());
    }
    return Promise.resolve(this.config);
  }



  /**
   * Initialisation des principaux paramètres
   * @param func
   */
  init(func=null){

    if(this.values && func)
      func(this.values);

    $$("Initialisation de la configuration");
    this.width_screen=window.innerWidth;

    initAvailableCameras((res)=>{this.webcamsAvailable=res;});

    $$("Chargement des jobs");
    this.api.getyaml("","dictionnary").subscribe((yaml:any)=>{
      if(this.jobs.length==0) {
        for (let i of Object.values(yaml.jobs)) {
          let new_job={value: i, label: i};
          if(this.jobs.indexOf(new_job)==-1)
            this.jobs.push(new_job);
        }
        this.api.getyaml("", "profils").subscribe((r: any) => {
          this.profils = r.profils;
          this.raz_user();
          this.getConfig().then(r => {
            this.values = r;
            this.ready = true;
            $$("Chargement du fichier de configuration", r);
            if (func) func(this.values);
          }, () => {
            $$("Probléme de chargement de la configuration")
          });
        })
      }
    });
  }


  init_user(func_success=null,func_anonyme=null) {
    $$("Initialisation de l'utilisateur");
    let email=localStorage.getItem("email");
    if(email){
      this.api.getuser(email).subscribe((r:any)=>{
        if(r.count>0){
          $$("Chargement de l'utilisateur ",r.results[0]);
          this.user=r.results[0];
          if(!this.user.profil){
            this.api._get("update_extrauser","email="+this.user.user.email).subscribe((rany)=>{
              showMessage(this,"Message:"+r.result);
            })
          }

          if(func_success)func_success();
        } else {
          $$("Aucun compte disponible a l'adresse mail"+email+" on réinitialise le compte")
          this.raz_user();
          this.api.logout();
          this.user.perm=this.profils[this.values.anonymousOffer].perm;
          this.user.profil=this.values.anonymousOffer;
          if(func_anonyme)func_anonyme();
        }
      });
    }
  }


  public raz_user() {
    this.user={email:"",perm:this.profils[0].perm};
  }

  isLogin() {
    return(this.user && this.user.user && this.user.email && this.user.user.email.length>0);
  }

  isProd() {
    return environment.production;
  }
}
