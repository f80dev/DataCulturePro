import {Component, OnInit, ViewChild} from '@angular/core';
import {ApiService} from "../api.service";
import {ActivatedRoute, ParamMap, Router} from "@angular/router";
import {$$, normaliser, remove_ponctuation, showError, showMessage, translateQuery} from "../tools";
import {ConfigService} from "../config.service";
import {NgNavigatorShareService} from "ng-navigator-share";
import {ClipboardService} from "ngx-clipboard";
import {environment} from "../../environments/environment";
import {MatAccordion} from "@angular/material/expansion";
import {Observable} from "rxjs";


@Component({
  selector: 'app-pows',
  templateUrl: './pows.component.html',
  styleUrls: ['./pows.component.sass']
})
export class PowsComponent implements OnInit {
  pows: any[]=[];
  query: any={value:""};
  limit=200;
  @ViewChild('powAccordion') powAccordion: MatAccordion;
  filter_id: number;
  filter$: Observable<string>;
  advanced=false;

  constructor(public api:ApiService,
              public ngNavigatorShareService:NgNavigatorShareService,
              public _clipboardService:ClipboardService,
              public router:Router,
              public routes:ActivatedRoute,
              public config:ConfigService) {

  }

  ngOnInit(): void {
    if(this.routes.snapshot.queryParamMap.has("filter")){
      this.query.value=remove_ponctuation(this.routes.snapshot.queryParamMap.get("filter"));
    } else {
      //exemple : http://localhost:4200/pows?query=grave
      if(this.routes.snapshot.queryParamMap.has("query")){
        this.query.value=remove_ponctuation(this.routes.snapshot.queryParamMap.get("query"));
      }
    }

    if(this.routes.snapshot.queryParamMap.has("id"))this.filter_id=Number(this.routes.snapshot.queryParamMap.get("id"));
    setTimeout(()=>{this.refresh();},1000);
  }

  open_search(work: any) {
    let name=work.name
    if(name.indexOf(" ")>-1)name=name.substr(name.lastIndexOf(' ')).trim();
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
        if(!this.filter_id || this.filter_id==i.id){
          let origin=i.links.length>0 ? i.links[0].text.split(":")[1] : "*";
          if(origin){
            origin=origin.replace("-","");
            if(origin=="*" || this.config.hasPerm("r_"+origin.toLowerCase()))
              this.pows.push(i);
          } else {
            $$(i.links[0].url+" est en anomalie");
          }
        }
      }
      if(r.results.length==1){
        setTimeout(()=>{
          this.pows[0].expanded=true;
        },1000);
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
    this.api._get("extrapows/"+pow.id,"").subscribe((r:any)=>{
      let rc=[];
      if(r){
        pow.title=r.title;
        pow.visual=r.visual;
        pow.award=r.award;
        for(let item of r.works){
          if(item.public){
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
      this.refresh();
    })
  }

  show_all() {
    if(this.limit==50)
      this.limit=500;
    else
      this.limit=50;

    this.refresh();
  }

  openGoogle(pow: any) {
    let url=pow.title.replace(" ","+")+" "+pow.year;
    open("https://www.google.com/search?q="+url,"_blank");
  }

  analyse(pow: any) {
    this.api._get("analyse_pow","id="+pow.id+"&search_by=title").subscribe((r:any)=>{
      debugger
    });
  }
}
