import { Component, OnInit } from '@angular/core';
import {ApiService} from "../api.service";
import {ConfigService} from "../config.service";
import {Location} from "@angular/common";
import {showError} from "../tools";
import {COMMA, ENTER} from "@angular/cdk/keycodes";
import {FormControl} from "@angular/forms";
import {Observable} from "rxjs";
import {MatChipInputEvent} from "@angular/material/chips";
import {MatAutocompleteSelectedEvent} from "@angular/material/autocomplete";
import {Router} from "@angular/router";

@Component({
  selector: 'app-blog',
  templateUrl: './blog.component.html',
  styleUrls: ['./blog.component.sass']
})
export class BlogComponent implements OnInit {
  articles: any[]=[];

  selected_tag: string;
  allTags: string[] = ['News', 'Job','Annonce'];


  constructor(
    public api:ApiService,
    public config:ConfigService,
    public router:Router,
  ) {}





  ngOnInit(): void {
   this.refresh();
  }



  refresh(){
    this.api._get("articles/","").subscribe((articles:any)=>{
      this.articles=[];
      for(let a of articles.results){
        if(this.config.hasPerm('validate') || a.validate){
          if(!this.selected_tag || a.tags.indexOf(this.selected_tag)>-1)
            this.articles.push(a);
        }
      }
    });
  }



  publish(article:any,_value=true) {
    let dtPublish=new Date().toISOString().split("T")[0];
    this.api._patch("articles/"+article.id,"",{validate:_value,dtPublish:dtPublish}).subscribe(()=>{
      this.refresh();
    },(err)=>{showError(this,err)});
  }


  delete(article: any) {
    this.api._delete("articles/"+article.id,"").subscribe(()=>{
      this.refresh();
    })
  }
}
