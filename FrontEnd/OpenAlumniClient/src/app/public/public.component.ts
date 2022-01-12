import {AfterViewInit, Component, OnInit} from '@angular/core';
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
export class PublicComponent implements OnInit,AfterViewInit {

  profil:any;
  works: any[]=[];
  message: string;
  items: any[]=[];

  constructor(public router:Router,
              public ngNavigatorShareService:NgNavigatorShareService,
              public _clipboardService:ClipboardService,
              public route:ActivatedRoute,
              public api:ApiService) {
  }



  load_awards(p){
    let expe={};
    this.api._get("awards","profil="+p.id).subscribe((awards:any)=> {
      this.message="";

      let rc=[];
      for(let w of p.works){
        for(var i=0;i<100;i++){
          w=w.replace("'","\"")
        }
        try {
          let _w=JSON.parse(w);
          rc.push(_w);
          expe[_w.job]=expe.hasOwnProperty(_w.job) ? expe[_w.job]+1 : 0;
        } catch (e) {
          $$("Probleme de conversion "+w);
        }
      }
      this.profil.expe="";
      for(let k of Object.keys(expe))
        this.profil.expe=this.profil.expe+k+", ";

      if(awards && awards.count>0){
        for(let a of awards.results){
          this.items.push({
            year:a.year,
            title:a.festival,
            comment:a.title,
          })
        }
      }
      this.items=group_works(rc);
      this.items[0].show_year=true;
      for(let i=1;i<this.items.length;i++){
        this.items[i].show_year=(this.items[i].year!=this.items[i-1].year);
      }
    });
  }

  //test http://localhost:4200/public/?id=3076
  ngOnInit(): void {
    let id=this.route.snapshot.queryParamMap.get("id");

    if(id){
      this.message="Chargement des expériences";
      this.api._get("extraprofils/"+id+"/").subscribe((p:any)=>{
        this.profil=p;
        setTimeout(()=>{
          this.load_awards(this.profil);
        },100);
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

  ngAfterViewInit(): void {
  }
}
