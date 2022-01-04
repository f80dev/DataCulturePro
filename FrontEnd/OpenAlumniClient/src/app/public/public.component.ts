import { Component, OnInit } from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {ApiService} from "../api.service";
import {$$, group_works, showMessage} from "../tools";
import {NgNavigatorShareService} from "ng-navigator-share";
import {ClipboardService} from "ngx-clipboard";

@Component({
  selector: 'app-public',
  templateUrl: './public.component.html',
  styleUrls: ['./public.component.sass']
})
export class PublicComponent implements OnInit {

  profil:any;
  works: any[]=[];
  message: string;

  constructor(public router:Router,
              public ngNavigatorShareService:NgNavigatorShareService,
              public _clipboardService:ClipboardService,
              public route:ActivatedRoute,
              public api:ApiService) { }

  //test http://localhost:4200/public/?id=3076
  ngOnInit(): void {
    let id=this.route.snapshot.queryParamMap.get("id");
    if(id){
      this.message="Chargement des expériences";
      this.api._get("extraprofils/"+id+"/").subscribe((p:any)=>{
        this.message="";
        this.profil=p;
        let rc=[];
        debugger
        for(let w of p.works){
          for(var i=0;i<100;i++){
            w=w.replace("'","\"")
          }
          try {
            rc.push(JSON.parse(w));
          } catch (e) {
            $$("Probleme de conversion "+w);
          }
        }
        this.works=group_works(rc);
        this.works[0].show_year=true;
        for(let i=1;i<this.works.length;i++){
          this.works[i].show_year=(this.works[i].pow.year!=this.works[i-1].pow.year);
        }
      })
    } else {
      this.router.navigate(["search"]);
    }
  }

  share() {
    showMessage(this,"Lien du profil disponible dans le presse-papier");
    this.ngNavigatorShareService.share({
      title: this.profil.firstname+" "+this.profil.lastname,
      text: "Profil de l'annuaire de la FEMIS",
      url: this.profil.public_url
    })
      .then( (response) => {console.log(response);},()=>{
        this._clipboardService.copyFromContent(this.profil.public_url);
      })
      .catch( (error) => {
        this._clipboardService.copyFromContent(this.profil.public_url);
      });
  }

  open_price(a: any,movie_title) {
    let url="https://www.google.com/search?q="+a.title+" "+movie_title;
    open(url.replace(" ","+"),"search");
  }
}
