import { Component, OnInit } from '@angular/core';
import {ApiService} from "../api.service";
import {ConfigService} from "../config.service";
import {showError} from "../tools";
import {Router} from "@angular/router";
import {tArticle} from "../types";

@Component({
  selector: 'app-blog',
  templateUrl: './blog.component.html',
  styleUrls: ['./blog.component.sass']
})
export class BlogComponent implements OnInit {
  articles: tArticle[]=[];

  allTags: string[] = ['Sortie de film', 'Evénements','Info professionnelle',"Offre d'emploi"];
  selected_tag=this.allTags;

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
          for(let tag of this.selected_tag){
            if(a.tags.indexOf(tag)>-1){
              this.articles.push(a);
              break;
            }
          }
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

  edit(article: any) {
    this.router.navigate(["htmledit"],{queryParams:{article:article.id}});
  }

  notif(article: any) {

  }
}
