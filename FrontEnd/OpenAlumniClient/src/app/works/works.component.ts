import { Component, OnInit } from '@angular/core';
import {Location} from "@angular/common";
import {ActivatedRoute} from "@angular/router";
import {ApiService} from "../api.service";
import {$$, showError, showMessage} from "../tools";
import {MatSnackBar} from "@angular/material/snack-bar";

@Component({
  selector: 'app-works',
  templateUrl: './works.component.html',
  styleUrls: ['./works.component.sass']
})
export class WorksComponent implements OnInit {
  works:any;
  message: any;
  categories: any[]=["Tous"];
  jobs: any[]=["Tous"];
  cat_filter="Tous";
  name: any;
  job_filter="Tous";

  constructor(public _location:Location,public toast:MatSnackBar,
              public routes:ActivatedRoute,
              public api:ApiService) { }

  ngOnInit(): void {
    $$("Chargement des expériences");
    this.name=this.routes.snapshot.queryParamMap.get("name");
    let id=this.routes.snapshot.queryParamMap.get("id");
    this.message="Chargement des expériences ...";
    this.api._get("extraworks","profil__id="+id).subscribe((r:any)=>{
      this.message="";
      if(r.results.length==0){
        $$("Pas d'expérience pour "+this.name);
        showMessage(this,"Aucune production référencée pour ce profil");
        this._location.back();
      }else{
        this.works=[];
        for(let w of r.results){
          if(w && w.public) {
            w.filter=w.pow.nature;
            if(this.categories.indexOf(w.pow.nature.trim())==-1)this.categories.push(w.pow.nature.trim());
            if(this.jobs.indexOf(w.job.trim())==-1)this.jobs.push(w.job);
            w.pow.short_desc=w.pow.description.substr(0,Math.min(200,w.pow.description.length));

            let bAdd=true;
            for(let tmp of this.works){
              if(tmp.pow.title==w.pow.title){
                tmp.job=tmp.job + " & " + w.job;
                bAdd=false;
              }
            }
            if(bAdd)this.works.push(w);

          }
        }

        this.cat_filter="Tous";
      }
    },(err)=>{
      showError(this,err);
    });
  }

}
