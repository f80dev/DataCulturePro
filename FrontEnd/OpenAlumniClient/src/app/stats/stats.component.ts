import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {Location} from "@angular/common";
import {$$, api, checkLogin, eval_params, getParams, showError, showMessage} from "../tools";
import {ConfigService} from "../config.service";
import {ActivatedRoute, Router} from "@angular/router";
import {ApiService} from "../api.service";
import {environment} from "../../environments/environment";
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
  sel_report: any={html_code:"",html_values:""}
  showGraphQL: boolean=false;
  domain_server="";

  @ViewChild('tabGroup') tabGroup: any;

  instant_reports: any[]=[];
  message: any="";
  rows: any=[];

  filter_name="Filtre";
  sel_instant_report_to_copy: any={};
  sel_table: string="work";
  bLimitData: boolean = true;
  filter_report:string=""
  filters: any[]=[]

  constructor(public _location:Location,
              public api:ApiService,
              public router:Router,
              public ngNavigatorShareService:NgNavigatorShareService,
              public routes:ActivatedRoute,
              public _clipboardService:ClipboardService,
              public config:ConfigService) {
    this.domain_server=environment.domain_server;
  }

  async ngOnInit() {
    if(await checkLogin(this,"search")){
      this.api._get("api_doc").subscribe((r:any)=>{
        this.rows=r.content;
        this.refresh()
      })
    }
  }

  refresh(){
    this.message="Chargement des reporting";
    this.filters=[]
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

      getParams(this.routes).then((param:any)=>{
        this.change_report(param.open || "")
      })

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





  eval_stat() {
    //voir https://github.com/karllhughes/angular-d3
    if(!this.sel_report)return;
    this._location.replaceState("stats","open="+this.sel_report.id);
    this.sel_report.filters=this.filters
    let obj=eval_params(this.sel_report)
    this.filter_name="Filtrer par "+this.sel_report.filter;

    if(this.sel_report.html_code=="" || this.sel_report.html_code==""){
      this.sel_report.url=obj.url;

      this.api._get("export_all/",obj.param+"&out=graph",6000,"").subscribe((html:any)=>{
        this.sel_report.html_code=html.code || "";
        this.sel_report.html_values=html.values || "";
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
        let obj=eval_params(ir);
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

  change_report(report_id:string="") {
    if(report_id=="")report_id=this.instant_reports[0].id

    this.filters=[];
    for(let r of this.instant_reports)
      if(r.id==report_id){
        this.sel_report=r;
        if(r.filters){
          for(let f of r.filters){
            if(typeof(f.values)=="string")f.values=f.values.split(',')
            if(f.add_blank)f.values.push("")
            this.filters.push(f)
          }
        }
      }

    this.sel_report.html_values="";
    this.sel_report.html_code="";
    this.eval_stat();
  }



  export_doc(format="json",complete=true) {
    open(api("api_doc","complete="+complete+"&out="+format,false),"export");
  }

  update_filter_value(filter: any, $event: any) {
    let must_refresh=false;
    for(let f of this.filters){
      if(f.field==filter.field){
        f.value=$event.value
        must_refresh=true;
      }
    }
    if(must_refresh){
      this.refresh_stats();
    }
  }

  clear_filters() {
    for(let f of this.filters){
      f.value=undefined
    }
    this.refresh_stats()
  }
}
