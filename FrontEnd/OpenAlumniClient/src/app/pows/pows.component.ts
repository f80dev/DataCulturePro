import {Component, OnInit, ViewChild} from '@angular/core';
import {ApiService} from "../api.service";
import {ActivatedRoute, Router} from "@angular/router";
import {$$, showError, showMessage, translateQuery} from "../tools";
import {ConfigService} from "../config.service";
import {NgNavigatorShareService} from "ng-navigator-share";
import {ClipboardService} from "ngx-clipboard";
import {environment} from "../../environments/environment";
import {MatAccordion} from "@angular/material/expansion";

@Component({
  selector: 'app-pows',
  templateUrl: './pows.component.html',
  styleUrls: ['./pows.component.sass']
})
export class PowsComponent implements OnInit {
  pows: any[]=[];
  query: any={value:""};
  limit=50;
  @ViewChild('powAccordion') powAccordion: MatAccordion;
  filter_id: number;

  constructor(public api:ApiService,
              public ngNavigatorShareService:NgNavigatorShareService,
              public _clipboardService:ClipboardService,
              public router:Router,
              public routes:ActivatedRoute,
              public config:ConfigService) { }

  ngOnInit(): void {
    if(this.routes.snapshot.queryParamMap.has("filter"))this.query.value=this.routes.snapshot.queryParamMap.get("filter");
    if(this.routes.snapshot.queryParamMap.has("id"))this.filter_id=Number(this.routes.snapshot.queryParamMap.get("id"));
    this.refresh();
  }

  open_search(name: string) {
    if(name.indexOf(" ")>-1)name=name.split(' ')[1];
    this.router.navigate(["search"],{queryParams:{filter:name}});
  }

  clearQuery() {
    this.query.value='';
    this.refresh();
  }


  message: string ="";
  all: any=true;

  handle:any;
  onQuery($event: KeyboardEvent) {
    clearTimeout(this.handle);
    this.handle=setTimeout(()=>{
      this.refresh();
    },1000);
  }



  refresh() {
    let param=translateQuery(this.query.value,this.all);
    param=param.replace("works__title","title__terms");
    param=param+"&limit="+this.limit;
    this.message="Recherche des films";
    this.api._get("powsdoc",param).subscribe((r:any)=>{
      this.message="";
      this.pows=[];
      for(let i of r.results){
        if(!this.filter_id || this.filter_id==i.id)
          this.pows.push(i);
      }
      if(r.results.length<10){
        this.powAccordion.openAll();
      }
    },(err)=>{
      showError(this,err);
    });
  }

  add_experience(pow: any) {
    this.router.navigate(["edit"],{queryParams:{id:this.config.user.profil,add:pow.id,title:pow.title}})
  }

  share(pow: any) {
    let public_url=environment.domain_appli+"/pows?filter="+pow.title;
    showMessage(this,"Lien du profil disponible dans le presse-papier");
    this.ngNavigatorShareService.share({
      title: pow.title,
      text: "Retrouver les films de la femis",
      url: public_url
    })
      .then( (response) => {console.log(response);},()=>{
        this._clipboardService.copyFromContent(public_url);
      })
      .catch( (error) => {
        this._clipboardService.copyFromContent(public_url);
      });

  }

  get_pow(pow: any) {
      this.api._get("extraworks/","pow__id="+pow.id).subscribe((r:any)=>{
        let rc=[];
        if(r.results.length>0){
          pow.visual=r.results[0].pow.visual;
          pow.description=r.results[0].pow.description;
          for(let item of r.results){
            if(item.public && item.profil.school=="FEMIS"){
              rc.push({
                job:item.job,
                name:item.profil.firstname+" "+item.profil.lastname
              })
            }
          }
          pow.expanded=true;
          pow.works=rc;
        }

      });
  }

  deletePow(pow: any) {
    this.api._delete("/pows/"+pow.id).subscribe(()=>{
      showMessage(this,"film supprimé");
    })
  }

  show_all() {
    if(this.limit==50)
      this.limit=500;
    else
      this.limit=50;

    this.refresh();
  }
}
