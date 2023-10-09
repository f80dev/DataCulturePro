import { Injectable } from '@angular/core';
import {environment} from '../environments/environment';
import {ApiService} from "./api.service";
import {Platform} from "@angular/cdk/platform";
import {HttpClient} from "@angular/common/http";
import { Location } from '@angular/common';
import {$$, initAvailableCameras, showMessage} from "./tools";
import {tProfilPerms, tUser} from "./types";
import {Subject} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  visibleTuto: Boolean | boolean=false;
  user: tUser;
  values: any;
  config:any;
  webcamsAvailable: any;
  width_screen: number;
  ready=false;
  icons:any=null;

  profils:any={};
  jobs:any=null;
  query_cache: any[]; //Conserve le contenu de la dernière requete
  perms: any;
  abreviations: any;
  user_update=new Subject<tUser>();
  infos_server: any;
  show_student: boolean = false;

  constructor(private location: Location,
              private http: HttpClient,
              public platform:Platform,
              public api:ApiService) {
  }


  public async getJson(jsonFile:string): Promise<any> {
    return Promise.resolve((await this.http.get(jsonFile)));
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


  public load_awards(p,vm=null){

  }


  private async getConfig(): Promise<any> {
    if (!this.config) {
      this.api.getyaml("",environment.config_file).subscribe({
        next:(r:any)=>{
          this.config=r
          this.refresh_server()
        }
      });
      $$("Chargement de la configuration "+environment.name);
    }
    return Promise.resolve(this.config);
  }



  /**
   * Initialisation des principaux paramètres
   * @param func
   */
  init(){
    return new Promise((resolve, reject) => {
      if(this.values) resolve(this.values);

      $$("Initialisation de la configuration");
      this.width_screen=window.innerWidth;

      initAvailableCameras((res)=>{this.webcamsAvailable=res;});

      this.api.getyaml("","perms").subscribe((r:any)=>{
        this.perms=r.perms;
      },(err)=>{reject(err)});

      this.api.getyaml("","dictionnary").subscribe((yaml:any)=>{
        $$("Chargement des métiers du dictionnaire ok");
        if(!this.abreviations){
          this.abreviations=yaml.abreviations;
        }
        if(!this.icons){
          this.icons=yaml.Icons;
        }

        if(!this.jobs) {
          let rc=[]
          this.jobs=[];
          for (let i of Object.values(yaml.jobs)) {
            if(rc.indexOf(i)===-1){
              rc.push(i);
              this.jobs.push({label:i,value:i});
            }
          }
          this.jobs.sort( (a,b) => a.label.localeCompare(b.label));
          $$(this.jobs.length+" jobs disponibles");

          this.api.getyaml("", "profils").subscribe((r: any) => {
            $$("Chargements des profils de permissions Ok");
            for(let it of r.profils)
              this.profils[it.id] = it;

            //this.raz_user();
            this.getConfig().then(r => {
              this.values = r;
              $$("Chargement du fichier de configuration Ok",r);
              this.ready = true;
              resolve(this.values);
            }, () => {
              $$("Probléme de chargement de la configuration")
            }).catch((err)=>{reject(err)});
          },(err)=>{reject(err)})
        }
      },(err)=>{reject(err)});
    });

  }


  async init_user(email=null) :Promise<any> {
    return new Promise((resolve, reject) => {
      if(!email || email==""){
        $$("L'email est vide")
        this.raz_user();
        resolve(this.user);
      }
      $$("Initialisation de l'utilisateur "+email);
      this.api.getextrauser(email).subscribe((r:any)=>{
        if(r.count>0){
          $$("Le compte existe déjà. Chargement de l'utilisateur ",r.results[0]);
          this.user=r.results[0];
          this.user_update.next(this.user);
          if(!this.user.profil){
            $$("Si l'utilisateur n'existe pas dans les profils des anciens");
            this.api._get("update_extrauser","email="+this.user.user.email).subscribe((rany)=>{
              showMessage(this,"Message:"+r.result);
            })
          }
          resolve(this.user);
        } else {
          $$("Aucun compte disponible a l'adresse mail"+email+" on réinitialise le compte")
          if(email){
            this.api.logout();
          }
          this.raz_user();
          resolve(this.user)
        }
      });
    });

  }


  public raz_user() {
    $$("Réinitialisation de l'utilisateur courant. Effacement de l'email et des permissions");
    this.user={
      black_list: "", dtCreate: "", dtLogin: "", level: 0, nbLogin: 0, profil_name: "",
      user:{email:"",id:""},
      perm:this.profils["anonyme"].perm,
      profil:"anonyme"
    };
    this.user_update.next(this.user);
  }

  isLogin() {
    let rc=(this.user && this.user.user && this.user.user.email && this.user.user.email.length>0);
    return rc;
  }

  isProd() {
    return environment.production;
  }

  isDesktop() {
    return !this.platform.IOS && !this.platform.ANDROID;
  }

  isMobile() {
    return this.platform.IOS || this.platform.ANDROID;
  }


  refresh_server() {
    this.api._get("infos_server").subscribe((infos:any)=>{
      this.infos_server=infos;
    });
  }
}
