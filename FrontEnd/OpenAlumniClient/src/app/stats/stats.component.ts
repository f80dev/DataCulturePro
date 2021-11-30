import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {Location} from "@angular/common";
import {$$, api, checkLogin, showMessage} from "../tools";
import {ConfigService} from "../config.service";
import {ActivatedRoute, Router} from "@angular/router";
import {ApiService} from "../api.service";
import {environment} from "../../environments/environment";
import {MatTabChangeEvent} from "@angular/material/tabs";
import {NgNavigatorShareService} from "ng-navigator-share";
import {ClipboardService} from "ngx-clipboard";

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

  @ViewChild('tabGroup') tabGroup: any;

  _data:any=[];
  instant_reports: any[]=[];
  message: any="";
  rows: any=[];


  constructor(public _location:Location,
              public api:ApiService,
              public router:Router,
              public ngNavigatorShareService:NgNavigatorShareService,
              public routes:ActivatedRoute,
              public _clipboardService:ClipboardService,
              public config:ConfigService) {
    this.domain_server=environment.domain_server;
  }

  ngOnInit(): void {
    checkLogin(this);
    this.refresh(()=>this.eval_stat());

    this.api._get("api_doc").subscribe((r:any)=>{
      this.rows=r.content;
    })
  }

  refresh(func=null){
    this.message="Chargement des reporting";
    this.api._get("getyaml","name=stat_reports").subscribe((r:any)=>{
      this.message="";

      this.reports=[];
      for(let i of r["Reports"]){
        if(i.prod)this.reports.push(i);
      }

      this.instant_reports=[];
      for(let i of r["Instant_reports"]){
        if(i.prod)this.instant_reports.push(i);
      }

      let open=Number(this.routes.snapshot.queryParamMap.get("open")) || 0;
      this.sel_report=this.instant_reports[open];

      if(func)func();
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
    if(tools=="csv")open(api("export_all/","",true,"csv"));
    if(tools=="xml")open(api("export_all/","",true,"xml"));
  }



  openSocialGraph() {
    this.router.navigate(["visgraph"]);
    //open(environment.domain_server+"/api/social_graph/");
  }



  eval_stat() {
    //voir https://github.com/karllhughes/angular-d3
    if(!this.sel_report)return;
    let param="cols="+this.sel_report.cols+"&color="+this.sel_report.color+"&chart="+this.sel_report.chart;
    if(this.sel_report.sql)param=param+"&sql="+this.sel_report.sql;
    if(this.sel_report.percent)param=param+"&percent=True";
    if(this.sel_report.x)param=param+"&x="+this.sel_report.x+"&y="+this.sel_report.y;
    if(this.sel_report.group_by)param=param+"&group_by="+this.sel_report.group_by;
    if(this.sel_report.func)param=param+"&func="+this.sel_report.fun;
    if(this.sel_report.filter)param=param+"&filter="+this.sel_report.filter.replace(">","_sup_").replace("<","_inf_").replace("=","_is_");
    if(this.sel_report.data_cols){
      param=param+"&data_cols="+this.sel_report.data_cols+"&cols="+this.sel_report.cols+"&table="+this.sel_report.table;
    }

    if(!this.sel_report.html_code){
      this.sel_report.url=api("export_all",param+"&out=graph_html&height="+(window.screen.availHeight*0.9)+"&title="+this.sel_report.title,false,"");
      param=param+"&height="+(window.screen.availHeight*0.6);
      this.api._get("export_all/",param+"&out=graph",60,"").subscribe((html:any)=>{
        this.sel_report.html_code=html.code;
        this.sel_report.html_stat=html.values;
      },(err)=>{
        if(err.status==404){
          this.sel_report.html_code="<div style='width:100%;text-align: center;color:white;font-size: large;'><br>"+err.error+"</div>";
        }
        showMessage(this,err.error);
      });
    }
  }



  refresh_stats() {
    this.sel_report.html_code=null;
    this.eval_stat();
  }



  open_stats() {
    open(this.sel_report.url);
  }

  export_stats() {
    let url=this.sel_report.url.replace("out=graph_html","out=excel");
    open(url);
  }

  share_stats() {
    let url=this.sel_report.url.replace("out=graph_html","out=excel");
    this.ngNavigatorShareService.share({
      title: "Reporting FEMIS: "+this.sel_report.title,
      text: this.sel_report.description,
      url: url
    })
      .then( (response) => {console.log(response);},()=>{
        this._clipboardService.copyFromContent(url);
      })
      .catch( (error) => {
        this._clipboardService.copyFromContent(url);
      });
  }


}
