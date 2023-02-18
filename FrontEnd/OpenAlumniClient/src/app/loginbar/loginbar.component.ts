import {Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation} from '@angular/core';
import {Router} from "@angular/router";
import {Location} from "@angular/common";
import {ApiService} from "../api.service";
import {ConfigService} from "../config.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {environment} from "../../environments/environment";
import {MatDialog} from "@angular/material/dialog";
import {menu_items} from "../menu/menu.component";

@Component({
  selector: 'app-loginbar',
  templateUrl: './loginbar.component.html',
  styleUrls: ['./loginbar.component.sass']
})
export class LoginbarComponent implements OnInit {

  @Input("user") user:any;
  @Output('logout') onlogout: EventEmitter<any>=new EventEmitter();

  isLocal=false;
  menu_header:menu_items= {
    search: {label:"Annuaire",title:"Consultation de l'annuaire",icon:"people_alt",queryParam:{},actif:true},
    pows: {label:"Films",title:"Voir les oeuvres des anciens",icon:"movie",queryParam:{},actif:true},
    blog: {label:"Actualités",title:"Voir le blog",icon:"rss_feed",queryParam:{},actif:true},
    edit: {label:"Mon profil",title:"Editer votre profil",icon:"build",queryParam:{id:this.config.user?.profil},actif:true},
    htmledit: {label:"Publier",title:"Rédiger un article",icon:"history_edu",queryParam:{},actif:true},
    addpow: {label:"Catalogue",title:"Ajouter des films dans le catalogue",icon:"videocam",queryParam:{owner:'public'},actif:true},
    stats: {label:"Datas",title:"Accèder à la console de statistiques",icon:"leaderboard",queryParam:{},actif:true}
  }
  menu_footer:menu_items= {
    dev:{label:"Développeurs",title:"Accèder à la console developper",icon:"build",queryParam:{},actif:true},
    settings: {label:"Mon compte",title:"Modifier vos paramètres",icon:"person",queryParam:{},actif:true},
    logout: {label:"Se déconnecter",title:"Se déconnecter",icon:"logout",queryParam:{},actif:true},
    login: {label:"Se connecter",title:"Se connecter",icon:"login",queryParam:{},actif:true},
    nfts: {label:"Certification",title:"Voir les certifications NFTs",icon:"shield",queryParam:{},actif:true},
    faqs: {label:"Aide",title:"Aide / Questions fréquentes",icon:"help",queryParam:{},actif:true},
    about: {label:"A propos",title:"A propos de Data Culture",icon:"info",queryParam:{},actif:true},
    admin: {label:"Administration",title:"Administration de DataCulture",icon:"settings",queryParam:{},actif:true}
  }

  constructor(public router:Router,
              public dialog:MatDialog,
              public toast:MatSnackBar,
              public _location:Location,
              public config:ConfigService,
              public api:ApiService) { }

  ngOnInit(): void {
    this.isLocal=!environment.production;
  }

  logout() {
    this.onlogout.emit();
  }

  help() {
  }
}

