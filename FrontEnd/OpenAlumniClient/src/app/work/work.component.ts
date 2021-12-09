import {Component, Input, OnInit} from '@angular/core';
import {Location} from "@angular/common";
import {ApiService} from "../api.service";
import {ActivatedRoute} from "@angular/router";
import {ConfigService} from "../config.service";

@Component({
  selector: 'app-work',
  templateUrl: './work.component.html',
  styleUrls: ['./work.component.sass']
})
export class WorkComponent implements OnInit {

  @Input("work") work:any={};
  @Input("level") level:number=1;
  @Input("perm") perm:string="";
  @Input("height") height:string="auto";
  @Input("width") width:string="auto";
  @Input("maxwidth") maxwidth:string="auto";
  @Input("minwidth") minwidth:string="auto";
  @Input("minheight") minheight:string="auto";
  @Input("showAction") showAction:boolean=true;
  @Input("writeAccess") writeAccess:boolean=false;
  @Input("backgroundColor") backgroundColor:string="grey";

  constructor(public _location:Location,
              public config:ConfigService,
              public routes:ActivatedRoute,
              public api:ApiService) { }

  ngOnInit(): void {

  }

  openInfo(pow: any) {
    open(pow.url,"_blank");
  }
}
