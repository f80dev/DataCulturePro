import { Component, OnInit } from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {ApiService} from "../api.service";
import {showMessage} from "../tools";
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

  constructor(public router:Router,
              public ngNavigatorShareService:NgNavigatorShareService,
              public _clipboardService:ClipboardService,
              public route:ActivatedRoute,
              public api:ApiService) { }

  //test http://localhost:4200/public/?id=3076
  ngOnInit(): void {
    let id=this.route.snapshot.queryParamMap.get("id");
    if(id){
      this.api._get("extraprofils/"+id+"/").subscribe((p:any)=>{
        this.profil=p;
        this.works=[];
        for(let w of p.works){
          for(var i=0;i<100;i++){
            w=w.replace("'","\"")
          }

          this.works.push(JSON.parse(w));
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
}
