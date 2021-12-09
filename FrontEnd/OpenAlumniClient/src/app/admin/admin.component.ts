import { Component, OnInit } from '@angular/core';
import {ApiService} from "../api.service";
import {api, showError, showMessage} from "../tools";
import {Router} from "@angular/router";
import {ConfigService} from "../config.service";
import {environment} from "../../environments/environment";
import {MatSnackBar} from "@angular/material/snack-bar";

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.sass']
})
export class AdminComponent implements OnInit {

  message: string;

  constructor(private api:ApiService,
              public config:ConfigService,
              public router:Router,
              public toast:MatSnackBar) { }

  ngOnInit(): void {
  }

  raz(table:string) {
    this.message="Effacement de la base de données";
    this.api._get("raz/","tables="+table,200).subscribe(()=>{
      showMessage(this,"Base de données effacée");
      this.message="";
      this.initdb();
      this.router.navigate(["import"]);
    },(err)=>{
      showError(this,"Echec d'effacement de la base");
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

  batch(refresh_delay_profil=31,refresh_delay_page=200) {
    let catalog="imdb,unifrance,lefilmfrancais";
    // for(let key of Object.keys(this.config.values.catalog)){
    //   if(this.config.values.catalog[key])catalog=catalog+key.replace(" ","").trim()+"_";
    // }
    this.api._post("batch/","refresh_delay_profil="+refresh_delay_profil+"&refresh_delay_page="+refresh_delay_page,this.config.values.catalog).subscribe(()=>{
      showMessage(this,"traitement terminé")
    })
  }

  batch_movies() {
    this.api._get("batch_movies/").subscribe(()=>{
      showMessage(this,"traitement terminé")
    })
  }

  update_index() {
    this.api._get("rebuild_index","name=profils").subscribe((r:any)=>{
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
    this.message="Traitement qualite sur les profils";
    this.api._get("quality_analyzer","ope="+ope).subscribe(()=>{
      this.message="";
    })
  }
}
