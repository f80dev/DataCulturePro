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

  allTags: any[] = [
    {label:'Sortie de film',checked:true},
    {label:'Evénements',checked: false},
    {label:'Info professionnelle',checked: false},
    {label:'Offre d\'emploi',checked: false}
  ];

  constructor(
    public api:ApiService,
    public config:ConfigService,
    public router:Router,
  ) {}


  ngOnInit(): void {
   setTimeout(()=>{
     this.refresh();
   },1500);
  }


  refresh(){
    this.api._get("articles/","").subscribe((articles:any)=>{
      this.articles=[];
      for(let a of articles.results){
        if(this.config.hasPerm('validate') || a.validate){
          for(let tag of this.allTags){
            if(tag.checked && a.tags.indexOf(tag.label)>-1){
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
