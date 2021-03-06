import { Component, OnInit } from '@angular/core';
import {Location} from "@angular/common";
import {api, checkLogin, showMessage} from "../tools";
import {ConfigService} from "../config.service";
import {Router} from "@angular/router";
import {ApiService} from "../api.service";
import {environment} from "../../environments/environment";

@Component({
  selector: 'app-stats',
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.sass']
})
export class StatsComponent implements OnInit {
  query: string="";
  reports: any[]=[];
  sel_report: any={}
  showGraphQL: boolean=false;
  domain_server="";

  constructor(public _location:Location,
              public api:ApiService,
              public router:Router,
              public config:ConfigService) {
    this.domain_server=environment.domain_server;
  }

  ngOnInit(): void {
    checkLogin(this);
    this.api._get("getyaml","name=stat_reports").subscribe((r:any)=>{
      this.reports=r["Reports"];
    });
  }

  openStats(){
    open(this.sel_report,"statistiques");
  }


  downloadReport(tools: string) {
    if(tools=="excel"){
      if(!this.config.isProd()){
        open(environment.domain_appli+"/assets/Reporting_local.xlsx");
      }else{
        open(environment.domain_appli+"/assets/Reporting.xlsx");
      }
    }
    if(tools=="powerbi")open(environment.domain_appli+"/assets/reporting.pbix");
    if(tools=="csv")open(api("export_all/csv","",true,""));
    if(tools=="xml")open(api("export_all/xml","",true,""));
  }

  openSocialGraph() {
    this.router.navigate(["visgraph"]);
    //open(environment.domain_server+"/api/social_graph/");
  }
}
