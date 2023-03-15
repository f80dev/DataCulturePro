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
    festivals: {label:"Récompenses",title:"Voir les festivals qui récompense les anciens de la FEMIS",icon:"emoji_events",queryParam:{},actif:true},
    blog: {label:"Actualités",title:"Voir le blog",icon:"rss_feed",queryParam:{},actif:false},
    edit: {label:"Mon profil",title:"Editer votre profil",icon:"build",queryParam:{id:this.config.user?.profil},actif:false},
    htmledit: {label:"Publier",title:"Rédiger un article",icon:"history_edu",queryParam:{},actif:false},
    addpow: {label:"Catalogue",title:"Ajouter des films dans le catalogue",icon:"videocam",queryParam:{owner:'public'},actif:false},
    stats: {label:"Datas",title:"Accèder à la console de statistiques",icon:"leaderboard",queryParam:{},actif:false}
  }
  menu_footer:menu_items= {
    dev:{label:"Développeurs",title:"Accèder à la console developper",icon:"build",queryParam:{},actif:false},
    settings: {label:"Mon compte",title:"Modifier vos paramètres",icon:"person",queryParam:{},actif:false},
    _logout: {label:"Se déconnecter",title:"Se déconnecter",icon:"logout",queryParam:{},actif:false},
    login: {label:"Se connecter",title:"Se connecter",icon:"login",queryParam:{},actif:true},
    nfts: {label:"Certification",title:"Voir les certifications NFTs",icon:"shield",queryParam:{},actif:false},
    faqs: {label:"Aide",title:"Aide / Questions fréquentes",icon:"help",queryParam:{},actif:true},
    about: {label:"A propos",title:"A propos de Data Culture",icon:"info",queryParam:{},actif:true},
    admin: {label:"Administration",title:"Administration de DataCulture",icon:"settings",queryParam:{},actif:false}
  }
  status="disconnect";

  constructor(public router:Router,
              public dialog:MatDialog,
              public toast:MatSnackBar,
              public _location:Location,
              public config:ConfigService,
              public api:ApiService) {

  }

  ngOnInit(): void {
    this.isLocal=!environment.production;
    this.config.user_update.subscribe((r:any)=>{
      let isLogin=r.user.email.length>0;
      this.status=isLogin ? "connect" : "disconnect";
      this.menu_footer.login.actif=!isLogin;
      this.menu_footer._logout.actif=isLogin;
      this.menu_footer.settings.actif=isLogin;
      this.menu_header.addpow.actif=isLogin && this.config.hasPerm("add_movie");
      //this.menu_header.edit.actif=isLogin && this.config.hasPerm("edit");
      this.menu_header.blog.actif=isLogin && this.config.hasPerm("blog");
      this.menu_footer.admin.actif=isLogin && this.config.hasPerm("admin") || !this.config.isProd();
      this.menu_footer.dev.actif=isLogin && this.config.hasPerm("dev");
      this.menu_header.htmledit.actif=isLogin && this.config.hasPerm("publish");
      this.menu_header.stats.actif=isLogin && this.config.hasPerm("stats");
    })
  }


  help() {
  }

  onselect($event: any) {
    if($event.icon=="logout")this.onlogout.emit();
  }
}

