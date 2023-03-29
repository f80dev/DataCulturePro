import { Component } from '@angular/core';
import {Location} from "@angular/common";
import {$$, getParams, translateQuery} from "../tools";
import {ApiService} from "../api.service";
import {environment} from "../../environments/environment";
import {ActivatedRoute} from "@angular/router";
import {ConfigService} from "../config.service";

@Component({
  selector: 'app-festivals',
  templateUrl: './festivals.component.html',
  styleUrls: ['./festivals.component.sass']
})
export class FestivalsComponent {

  query:string="";
  limit=200
  message="";
  festivals: any[]=[];

  field_style={
    year:{margin:0,padding:0,'font-size':'2.5em','font-weight':'lighter',color: 'grey','margin-top':'50px','margin-bottom':'25px'},
    label:{margin:0,padding:0,'line-height':'120%',color: 'white','margin-bottom':'15px'}
  }

  field_class={
    year: "mat-body-2"
  }

  constructor(public api:ApiService,
              public routes:ActivatedRoute,
              public config:ConfigService,
              public _location:Location) {
    getParams(this.routes).then((param:any)=>{
      if(param.query!="undefined")this.query=param.query;
      this.refresh();
    })
  }

  onQuery($event: KeyboardEvent) {
    this.refresh()
  }

  clearQuery() {
    this.query=""
  }

  refresh() {
    //test: http://localhost:8000/api/festivalsdoc/
    if(this.query && this.query.length<3)return;
    this._location.replaceState("festivals/?query="+this.query);
    let param=translateQuery(this.query,false);
    param=param+"&limit="+this.limit;
    param=param.replace("search_simple_query_string","search");
    $$("Recherche de "+environment.domain_server+"/api/festivals/"+param);
    this.api._get("festivalsdoc",param).subscribe((r:any)=>{
      let rc={};
      for(let f of r.results){

        if(!rc.hasOwnProperty(f.id)){
          rc[f.id]=f;
        } else {
          for(let a of f["award"]){
            rc[f.id]["award"].push(a);
          }
        }
      }

      this.festivals=[];
      for(let f of Object.values(rc)){
        f["expanded"]=false;
        f["award_timeline"]=[]
        for(let a of f['award']){
          f["award_timeline"].push({
            year:Number(a.year),
            title:a.description,
            icon: this.config.icons["Award"],
            type:"award",
            label:a.description
          })
        }
        this.festivals.push(f);
      }
    });
  }
}
