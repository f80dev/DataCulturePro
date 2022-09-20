import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {Location} from "@angular/common";
import {$$, api, checkLogin, showError, showMessage} from "../tools";
import {ConfigService} from "../config.service";
import {ActivatedRoute, Router} from "@angular/router";
import {ApiService} from "../api.service";
import {environment} from "../../environments/environment";
import {NgNavigatorShareService} from "ng-navigator-share";
import {ClipboardService} from "ngx-clipboard";
import {delay, retry} from "rxjs/operators";

@Component({
  selector: 'app-stats',
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.sass']
})
export class StatsComponent implements OnInit {
  query: string="";
  reports: any[]=[];
  sel_report: any={html_code:"",html_values:""}
  showGraphQL: boolean=false;
  domain_server="";

  @ViewChild('tabGroup') tabGroup: any;

  _data:any=[];
  instant_reports: any[]=[];
  message: any="";
  rows: any=[];
  filter_values=[];
  sel_filter="";
  filter_name="Filtre";
  sel_instant_report_to_copy: any={};
  sel_table: string="work";
  bLimitData: boolean = true;

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
    checkLogin(this,()=>{
      this.api._get("api_doc").subscribe((r:any)=>{
        this.rows=r.content;
        this.refresh(()=>{
          setTimeout(()=>{
            this.eval_stat()
          },500);
        });
      })
    });
  }

  refresh(func=null){
    this.message="Chargement des reporting";
    this.api._get("getyaml","name=stat_reports").subscribe((r:any)=>{
      this.message="";

      this.reports=[];
      for(let i of r["Reports"]){
        if(i.prod){
          if(!i.hasOwnProperty("visiblity") || this.config.hasPerm(i.visibility)){
            this.reports.push(i);
          }
        }
      }

      this.instant_reports=[];
      for(let i of r["Instant_reports"]){
        if(i.prod)this.instant_reports.push(i);
      }


      let open=this.routes.snapshot.queryParamMap.get("open");
      if(open){
        for(let r of this.instant_reports)
          if(r.id==open){
            this.sel_report=r;
          }
      } else {
        this.sel_report=this.instant_reports[0];
      }
      this.sel_report.html_code="";
      this.sel_report.html_values="";
      if(func)func();
    });
  }

  openStats(){
    open(this.sel_report,"statistiques");
  }


  downloadReport(tools: string,table:string="work") {
    if(tools=="excel"){
      if(!this.config.isProd()){
        open(environment.domain_appli+"/assets/Reporting_local.xlsx");
      }else{
        open(environment.domain_appli+"/assets/Reporting.xlsx");
      }
    }
    if(tools=="powerbi"){
      open(environment.domain_appli+"/assets/reporting.pbix");
    } else {
      let param="table="+table+"&out="+tools;
      if(!this.bLimitData)param=param+"&limit=100";
      open(api("export_all/",param,true,""));
    }
  }



  openSocialGraph() {
    this.router.navigate(["visgraph"]);
  }



  eval_params(inst_report){
    let param="color="+inst_report.color+"&chart="+inst_report.chart;
    if(inst_report.cols)param=param+"&cols="+inst_report.cols;
    if(inst_report.sql)param=param+"&sql="+inst_report.sql;
    if(inst_report.percent)param=param+"&percent=True";
    if(inst_report.table)param=param+"&table="+inst_report.table;
    if(inst_report.x)param=param+"&x="+inst_report.x+"&y="+inst_report.y;
    if(inst_report.group_by)param=param+"&group_by="+inst_report.group_by;
    if(inst_report.template)param=param+"&template="+inst_report.template;
    if(inst_report.replace)param=param+"&replace="+JSON.stringify(inst_report.replace);
    if(inst_report.func)param=param+"&func="+inst_report.fun;
    if(inst_report.title)param=param+"&title="+inst_report.title;
    if(inst_report.filter){
      param=param+"&filter="+inst_report.filter;
      this.filter_name="Filtrer par "+inst_report.filter;
    }
    if(this.sel_filter)param=param+"&filter_value="+this.sel_filter;
    //if(inst_report.filter)param=param+"&filter="+inst_report.filter.replace(">","_sup_").replace("<","_inf_").replace("=","_is_");
    if(inst_report.data_cols){
      param=param+"&data_cols="+inst_report.data_cols+"&cols="+inst_report.cols+"&table="+inst_report.table;
    }
    param=param+"&height="+Math.trunc(window.screen.availHeight*0.6);
    return {
      param: param,
      url: api("export_all", param + "&out=graph_html&height=" + Math.trunc(window.screen.availHeight * 0.9) + "&title=" + this.sel_report.title, false, "")
    }
  }



  eval_stat(evt=null) {
    //voir https://github.com/karllhughes/angular-d3
    if(!this.sel_report)return;
    this._location.replaceState("stats","open="+this.sel_report.id);
    let obj=this.eval_params(this.sel_report)
    if(this.sel_report.html_code=="" || this.sel_report.html_code==""){
      this.sel_report.url=obj.url;

      this.api._get("export_all/",obj.param+"&out=graph",6000,"").subscribe((html:any)=>{
        this.sel_report.html_code=html.code || "";
        this.sel_report.html_values=html.values || "";
        if(this.filter_values && this.filter_values.length==0)this.filter_values=html.filter_values;
      },(err)=>{
        showError(this,err);
        if(err.status==404){
          this.sel_report.html_code="<div style='width:100%;text-align: center;color:white;font-size: large;'><br>"+err.error+"</div>";
        }
      });
    }
  }


  copyInstantReports() {
    let rc="<table style='margin: 10px;padding:10px;background-color: lightgray;border-radius:8px;'>";
    rc=rc+"<tr style='padding:5px'><th>Titre du rapport</th><th></th><th>Description</th>"
    for(let ir of this.instant_reports){
      if(this.sel_instant_report_to_copy.indexOf(ir.id)>-1){
        let obj=this.eval_params(ir);
        rc=rc+"<tr>\n";
        rc=rc+"<td style='padding:5px'>"+ir.title+"</td>\n";
        rc=rc+"<td style='padding:5px'><a href='"+encodeURI(obj.url)+"'>Ouvrir</a></td>\n";
        rc=rc+"<td style='padding:5px'>"+ir.description || ""+"</td>\n";
        rc=rc+"</tr>\n";
      }
    }
    rc=rc+"</table>";
    this._clipboardService.copyFromContent(rc);
    this.api._post("send_report_by_email","userid="+this.config.user.user.id,{html:rc}).subscribe(()=>{
      showMessage(this,"Rapport complet envoyé sur votre boite mail");
    })
  }



  refresh_stats() {
    this.sel_report.html_code="";
    this.sel_report.html_values="";
    this.eval_stat();
  }



  open_stats() {
    open(this.sel_report.url);
  }

  export_stats() {
    let url=this.sel_report.url.replace("out=graph_html","out=excel");
    let pos_start=url.indexOf("LIMIT ");
    if(pos_start>0) {
      let pos_end = pos_start + 6;
      while (url[pos_end] != " " && url[pos_end] != "&") pos_end++;
      url = url.replace(url.substr(pos_start, pos_end - pos_start), "")
    }
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

  change_report($event: any) {
    this.sel_filter="";
    this.sel_report.html_values="";
    this.sel_report.html_code="";
    this.filter_values=[];
    this.eval_stat($event);
  }

  cancel_filter() {
    this.sel_filter="";
    this.refresh_stats();
  }


  export_doc(format="json",complete=true) {
    open(api("api_doc","complete="+complete+"&out="+format,false),"export");
  }
}
