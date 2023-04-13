import { Component, OnInit } from '@angular/core';
import {ApiService} from "../api.service";
import {api, showError, showMessage} from "../tools";
import {Router} from "@angular/router";
import {ConfigService} from "../config.service";
import {environment} from "../../environments/environment";
import {MatSnackBar} from "@angular/material/snack-bar";
import {tProfilPerms} from "../types";
import {_prompt} from "../prompt/prompt.component";
import {MatDialog} from "@angular/material/dialog";

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.sass']
})
export class AdminComponent implements OnInit {

  message: string;
  users:any[];
  info_server: any;
  profils: tProfilPerms[]=[];
  backup_files: any[]=[];
  sel_backup_file:string="";
  show_server: boolean=true;

  constructor(private api:ApiService,
              public config:ConfigService,
              public router:Router,
              public dialog:MatDialog,
              public toast:MatSnackBar) {
    this.config.user_update.subscribe(()=>{
      this.profils=Object.values(this.config.profils);
      this.refresh();
    })
  }

  refresh(){
    this.api._get("extrausers").subscribe((r:any)=>{
      this.users=r.results;
      for(let i=0;i<this.users.length;i++){
        this.users[i].profil=this.profils[this.users[i].profil_name]
      }
    })
  }

  ngOnInit(): void {
    this.refresh_server();
    this.refresh_backup();
  }

  raz(table:string) {
    _prompt(this,"Confirmer l'effacement total ?").then(()=>{
      this.message="Effacement de la base de données";
      this.api._get("raz/","tables="+table+"&password=oui",200).subscribe(()=>{
        showMessage(this,"Base de données effacée");
        this.message="";
        this.initdb();
        this.router.navigate(["import"]);
      },(err)=>{
        showError(this,"Echec d'effacement de la base");
      })
    })
  }

  openQuery() {
    open(environment.domain_server+"/graphql","admin");
  }

  openDjangoAdmin() {
    open(environment.domain_server+"/admin/","admin");
  }

  openAPI() {
    open(environment.domain_server+"/api/users/","admin");
  }

  openHelloWorld() {
    this.api.hello_world().subscribe((r:any)=>{
      showMessage(this,r.message);
    })
  }

  send_update(){
    this.api._get("ask_for_update").subscribe((r:any)=>{
      showMessage(this,r.message);
    })
  }

  initdb() {
    this.api._get("initdb").subscribe(()=>{
      showMessage(this,"Base initialisée")
    });
  }

  batch(refresh_delay_profil=31,refresh_delay_page=200,remove_works=false,filter="*") {
    let catalog="imdb,unifrance,lefilmfrancais";
    let params="remove_works="+remove_works+"&refresh_delay_profil="+refresh_delay_profil+"&refresh_delay_page="+refresh_delay_page+"&filter="+filter;

    this.api._post("batch/",params,this.config.values.catalog).subscribe(()=>{
      showMessage(this,"traitement terminé")
    })
  }

  async ask_for_filter() {
    let filter=await _prompt(
        this,"Premières lettres du nom",
        "",
        "Seul les profils dont le nom commence par les lettres suivantes sont analysés",
        "text","Démarrer","Annuler",false);
    if(filter){
      this.batch(31,20,false,filter)
    }
  }

  batch_movies() {
    this.message="Analyse film par film pour complément";
    let cat="";
    for(let key of Object.keys(this.config.values.catalog)){
      if(this.config.values.catalog[key])
        cat=cat+key+","
    }
    this.api._get("analyse_pow/","cat="+cat).subscribe(()=>{
      showMessage(this,"traitement terminé")
      this.message="";
    },(err)=>{
      showError(this,err);
    })
  }

  update_index() {
    this.message="Le moteur de recherche est en cours de réinidexation (ce processus peut être long)" ;
    this.api._get("rebuild_index","name=profils",600).subscribe((r:any)=>{
      this.message="";
      showMessage(this,r.message);
    });
  }

  export_profils(cursus:string="S") {
    let url=api("export_profils/","cursus="+cursus,true,"csv");
    debugger
    open(url);
  }

  apply_dict() {
    this.message="Uniformise la terminoloie"
    this.api._get("update_dictionnary").subscribe(()=>{
      this.message="";
    })
  }

  init_nft() {
    this.message="Initialisation des NFTs";
    this.api._get("init_nft").subscribe(()=>{
      this.message="";
    })
  }

  analyzer(ope="profils,films") {
    this.message="Traitement qualite sur les "+ope;
    this.api._get("quality_analyzer","ope="+ope).subscribe(()=>{
      this.message="";
    })
  }

  openServer(url: string) {
    open(url,"terminal");
  }

  del_user(u: any) {
    this.api._delete("users/"+u.user.id).subscribe((r:any)=>{
      this.refresh();
    });
  }

  cancel_ask(u: any) {
  }

  send_email(u: any) {
  }

  accept_ask(u: any) {
  }

  export_dict() {
    open(environment.domain_server+"/api/export_dict");
  }


  update_profil(u: any,sel_profil:string) {
    u.profil_name=sel_profil
    for(let p of this.profils){
      if(p.id==sel_profil)u.perm = p.perm;
    }

    this.api.setuser(u).subscribe(() => {
      showMessage(this,"Profil mise a jour");
    });
  }

    refresh_server() {
      this.api._get("infos_server").subscribe((infos:any)=>{
        this.info_server=infos;
      });
    }

  load_backup() {
    this.message="Chargement en cours ... le processus peut être très long";
    this.api._get("backup","command=load&file="+this.sel_backup_file,60000).subscribe((r:any)=>{
      this.message="";
      showMessage(this,"Chargement terminé")
      this.show_server=true;
    },(err:any)=>{
      showMessage(this,err.error.message);
    })
  }

  refresh_backup(){
    this.api._get("backup_files","").subscribe((r:any)=>{
      this.backup_files=r.files;
    })
  }

  save_backup() {
    this.message="Backup en cours";
    this.api._get("backup","command=save").subscribe((r:any)=>{
      this.message="";
      this.refresh_backup();
      showMessage(this,"Enregistrement terminé")
    })
  }




}
