import { Component, OnInit } from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {ApiService} from "../api.service";

@Component({
  selector: 'app-public',
  templateUrl: './public.component.html',
  styleUrls: ['./public.component.sass']
})
export class PublicComponent implements OnInit {

  profil:any;
  works: any[]=[];

  constructor(public router:Router,public route:ActivatedRoute,public api:ApiService) { }

  //test http://localhost:4200/public/?id=3076
  ngOnInit(): void {
    let id=this.route.snapshot.queryParamMap.get("id");
    if(id){
      this.api._get("profils/"+id+"/").subscribe((p:any)=>{
        this.profil=p;
        this.works=[];
        for(let w of p.works){
          for(var i=0;i<100;i++)
            w=w.replace("'","\"")
          this.works.push(JSON.parse(w));
        }
      })
    } else {
      this.router.navigate(["search"]);
    }
  }

}
