import {Component, OnInit} from '@angular/core';
import {ConfigService} from "../config.service";
import {ActivatedRoute, Router} from "@angular/router";
import {environment} from "../../environments/environment";

@Component({
  selector: 'app-splash',
  templateUrl: './splash.component.html',
  styleUrls: ['./splash.component.sass']
})
export class SplashComponent implements OnInit {

  version:any;

  constructor(public config:ConfigService,
              public routes: ActivatedRoute,
              public router:Router) { }


  ngOnInit(): void {
    this.version=environment.appVersion;
    setTimeout(()=>{this.read_params();},2000);
  }

  read_params(){
    let id=this.routes.snapshot.queryParamMap.get("id");
    let name=this.routes.snapshot.queryParamMap.get("name");

    if(id){
      let url=this.routes.snapshot.url.join("/");
      if(url.length==0){url="public"}
      if(url.indexOf("works")>-1)this.router.navigate(["works"],{queryParams:{id:id,name:name},replaceUrl:true});
      if(url.indexOf("public")>-1)this.router.navigate(["public"],{queryParams:{id:id},replaceUrl:true});
    }
    else{
      this.router.navigate(["search"]);
    }
  }

}
