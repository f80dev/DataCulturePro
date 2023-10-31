import {Component, OnDestroy, OnInit} from '@angular/core';
import {Location} from "@angular/common";
import {ActivatedRoute, Router} from "@angular/router";
import {ApiService} from "../api.service";
import {ConfigService} from "../config.service";
import {$$, checkLogin, getParams, group_works, now, showError, showMessage, stringDistance, uniq} from "../tools";
import {MatTableDataSource} from "@angular/material/table";
import {MatDialog} from "@angular/material/dialog";
import {PromptComponent} from "../prompt/prompt.component";
import {ImageSelectorComponent} from "../image-selector/image-selector.component";
import {MatSnackBar} from "@angular/material/snack-bar";
import {EditAwardComponent} from "../edit-award/edit-award.component";
import {wait_message} from "../hourglass/hourglass.component";


export interface Movie {
  title: string;
  url: number;
}

@Component({
  selector: 'app-edit',
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.sass']
})
export class EditComponent implements OnInit,OnDestroy  {

  profil: any=null;
  works: any[]=[];
  add_work:any;
  mustSave=false;
  showAddWork=-1;         //Indique le mode edition ou ajout
  current_work:any=null;
  socials:any[]=[];
  projects: any[];
  jobsites: any[]=[];
  students: any[]=[];
  dataSource: MatTableDataSource<Movie>=null;

  dtStart:Date=new Date();
  dtEnd:Date=new Date(new Date().getTime()+1000*3600*24*5);
  duration=5*8;
  job:string="";
  comment="";
  pow:any;
  earning: any;
  acceptSponsor:boolean;
  message:string="";
  query: string = "";
  awards: any[]=[];
  pows:any[]=[];
  raw_works: any[]=[];


  constructor(public _location:Location,
              public routes:ActivatedRoute,
              public dialog:MatDialog,
              public toast:MatSnackBar,
              public config:ConfigService,
              public router:Router,
              public api:ApiService) {
    this.api.getyaml("","social").subscribe((r:any)=>{
      this.socials=r.services;
    })
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  ngOnInit(): void {
    this.config.user_update.subscribe(()=>{
      this.refresh();
    })
    this.refresh();
  }

  async refresh(){
    $$("Rafraichir les expériences");
    let isConnected=await checkLogin(this)
    if(isConnected){
      this.message = "Chargement de votre profil";
      await this.loadProfil()
      let data=await this.loadMovies()
      this.dataSource = new MatTableDataSource<Movie>(data);
      this.autoAddMovie();
      this.showAddWork = 0;
      this.message = "";
      this.refresh_job();
      this.refresh_students();
      this.refresh_works();
      this.refresh_awards();
        //this.refresh_relations(); //TODO: a corriger avant de réactiver
    }else{
      showMessage(this,"Vous devez être connecté pour éditer un profil");
      this.quit();
    }
  }



  async autoAddMovie(){
    let params:any=await getParams(this.routes)
    if(params.add){
      this.select({title:params.title,id:params.add});
    }
  }


  //Récupération des experiences;
  expanded_experience_pnl=false;
  expanded_internet_pnl=false;


  refresh_works(){
    this.add_works=[];
    this.works=[];
    this.api._get("extraworks","profil__id="+this.profil.id,600).subscribe((r:any)=>{
      $$("Travaux chargés");
      //TODO: ouvrir la fenetre works si non vide
      this.raw_works=r.results;
      this.works=group_works(r.results);
      for(let w of this.works) {
        if(w.state!='D'){
          w.job=w.jobs.join(" & ");
          this.pows.push(w);
        }
      }

    },(err)=>{
      showError(this,err);
    });
  }

  relations:any;
  score_school: number=0;
  score_salary: number=0;
  score_skill: number = 0;
  add_works: any[]=[];

  refresh_relations(){
    this.api._get("social_distance","profil_id="+this.profil.id,600).subscribe((r:any)=> {
      this.relations=[];
      for(let it of r){
        if(it.distance==1)this.relations.push(it);
      }
    });
  }


  loadProfil(){
    return new Promise<any>(async (resolve)=> {
      let params:any=await getParams(this.routes)
      if(!params.hasOwnProperty("id"))this.quit();
      $$("Chargement du profil & des travaux");
      this.api._get("extraprofils/"+params["id"]+"/","").subscribe((p:any)=>{
        $$("Profil chargé ",p);

        if(p){
          if(!p.hasOwnProperty("links") || !p.links)p.links=[];
          p.links.push({url:"https://www.google.com/search?q="+p.firstname+"+"+p.lastname,text:"Google"});
          p.links.push({url:"https://en.wikipedia.org/w/index.php?search="+p.firstname+"+"+p.lastname,text:"Wikipedia"});
          p.links.push({url:"https://www.allocine.fr/rechercher/?q="+p.firstname+"+"+p.lastname,text:"Allocine"});
          p.links.push({url:"https://twitter.com/search?q="+p.firstname+"%20"+p.lastname,text:"Twitter"});

          //Suppression des doublons sur la présence sur internet
          p.links=uniq(p.links);

          this.profil=p;
          if(this.profil.sponsorBy){
            this.api._get("profils/"+this.profil.sponsorBy+"/","").subscribe((sponsor:any)=>{
              this.profil.sponsorBy=sponsor;
            })
          }

          let d_min=1e9;
          for(let j of this.config.jobs){
            let d=stringDistance(p.department,j.value);
            if(d<d_min){
              d_min=d;
              this.job=j.value;
            }
          }
        }

        resolve(true)
      });
    })
  }



  async loadMovies() {
    return new Promise<any[]>((resolve)=>{
      let rc=[];
      this.api._get("extraprofils/"+this.profil.id+"/").subscribe((r:any)=>{
        for(let w of r.works){
          rc.push(w);
        }
        resolve(rc)
      });
    })
  }



  select(work: any,next_step=2) {

    // for(let element of elements){
    //   this.add_work={
    //     movie:element.title,
    //     year:element.year,
    //     movie_id:element.pow.id
    //   };
    //   if(element.year && Number(element.year)>1900){
    //     this.dtStart=new Date(Number(element.year),1,1);
    //     this.dtEnd=new Date(Number(element.year),31,12);
    //   }
    //   this.score_salary=element.score_salary;
    //   this.score_school=element.score_school;
    //   this.score_skill=element.score_skill;
    //   this.earning=element.earning;
    //   this.comment=element.comment;
    // }

    this.showAddWork=next_step;
    this.current_work=work;
  }


  save_newwork() {
    // this.add_work={
    //   profil:this.profil.id,
    //   pow:this.current_work.pow,
    //   job:this.job,
    //   state:"E",
    //   score_shool:this.score_school,
    //   score_skill:this.score_skill,
    //   score_salary:this.score_salary,
    //   earning:this.earning,
    //   comment:this.comment,
    //   dtStart:this.dtStart.toISOString().split("T")[0],
    //   dtEnd:this.dtEnd.toISOString().split("T")[0],
    //   duration:this.duration,
    //   source:"man_"+this.config.user.user.id,
    // };

    // if(this.showAddWork==3){
    //   this.api._delete("works/"+this.current_work.id,"").subscribe(()=>{
    //     $$("Suppression de l'ancienne contribution");
    //   })
    // }


    $$("Insertion de ",this.add_work);
    for(let w of this.add_works){
      if(w.id) {
        w.source = "man_" + this.config.user.user.id
        w.dtStart = new Date(Number(this.current_work.year),1,1).toISOString().split("T")[0]
        w.dtEnd = new Date(Number(this.current_work.year),31,12).toISOString().split("T")[0]
        w.pow=w.pow.id
        w.profil=w.profil.id
        w.job=w.job.value
        this.api._patch("works/" + w.id, "", w).subscribe((r: any) => {
          if(this.add_works.indexOf(w)==this.add_works.length-1){
            this.showAddWork=0;
            this.refresh_works();
          }
        }, (err) => {
          showError(this, err);
        })
      } else {
        this.api._post("works/","",w).subscribe((r:any)=>{
          this.showAddWork=0;
          this.loadProfil();
          this.router.navigate(["edit"],{queryParams:{id:this.profil.id},replaceUrl:true});
          showMessage(this,"Travail enregistré");
        },(err)=>{
          showError(this,err);
        })
      }
    }

  }


  save_profil(evt=null,field=""){
    if(this.profil){
      if(field=="acceptSponsor")this.profil.acceptSponsor=evt.checked;
      if(field=="public_photo")this.profil.public_photo=evt.checked;
      this.profil.dtLastUpdate=new Date().toISOString();
      this.api.setprofil(this.profil).subscribe(()=>{
        showMessage(this,"Profil enregistré")
      },(err)=>{showError(this,err);});
    }
  }



  quit() {
    this.router.navigate(["search"],{replaceUrl:true});
  }



  del_work(wrk:any) {
    this.dialog.open(PromptComponent,{data: {
        title: 'Confirmation',
        question: "Supprimer l'expérience sur '"+wrk.title+"'",
        onlyConfirm: true,
        canEmoji: false,
        lbl_ok: 'Oui',
        lbl_cancel: 'Non'
      }}).afterClosed().subscribe((result_code) => {
      if (result_code) {
        this.api._delete("works/" + wrk.id + "/").subscribe(() => {
          this.loadProfil();
          this.api.setprofil(this.profil).subscribe(()=>{});
          this.refresh_works();
        });
      }
    });
  }

  change_photo($event:any) {
    this.profil.photo= $event.file
    this.save_profil();
  }


  add_pow() {
    if(this.config.user.user){
      this.router.navigate(['addpow'],
        {queryParams:{
            redirect:'addwork',
            id:this.profil.id,
            owner:this.config.user.user.id}
        })
    }
  }



  save_user(evt=null) {
    if(this.config.user){
      if(evt!=null){
        let prop=Object.keys(evt)[0];
        this.config.user.user[prop]=evt[prop].checked;
      }
      this.api.setuser(this.config.user.user).subscribe(()=>{});
    }
  }


  _private(work: any) {
    work.public=!work.public;
    for(let id of work.works) {
      this.api._patch("works/" + id + "/", "", {"public": work.public}).subscribe(() => {
      });
    }
  }


  analyse() {
    this.message="Analyse en cours des principaux annuaires";
    let handle=setInterval(()=>{this.refresh_works();},10000);
    this.expanded_experience_pnl=true;
    this.api._post("batch/","filter="+this.profil.id+"&refresh_delay_page=1&refresh_delay_profil=0",
      this.config.values.catalog,600,
    ).subscribe((r:any)=>{
      this.message="";
      clearInterval(handle);
      showMessage(this,"Analyse terminée. Ajour de "+r.films+" film(s) et "+r.works+" contribution(s)");
      this.refresh_works();
    },(err)=>{
      showError(this,err);
    });
  }


  reset_works() {
    let total=this.works.length;
    for(let w of this.works){
      if(w.source && w.source.startsWith("man")){
        this.api._delete("works/"+w.id+"/","").subscribe(()=>{
          total=total-1;
          this.works.splice(this.works.indexOf(w),1);
        });
      }
    }
  }

  reset_awards() {
    let total=this.awards.length;
    for(let a of this.awards){
      if(!a.source.startsWith("man")){
        this.api._delete("awards/"+a.id+"/","").subscribe(()=>{
          total=total-1;
          this.awards.splice(this.awards.indexOf(a),1);
        });
      }
    }
  }


  check_format(social: any) {
    if(this.profil[social.name] && this.profil[social.name].length>0){
      if(!this.profil[social.name].startsWith("http"))this.profil[social.name]="https://"+this.profil[social.name];
      if(!this.profil[social.name].startsWith(social.format))
        social.message="Format incorrect, l'url doit commencer par "+social.format;
      else
        social.message="";
    } else
      social.message="";
  }


  edit_work(work: any) {
    this.add_works=[]
    for(let w of this.raw_works)
      if(work.works.indexOf(w.id)>-1){
        // for(let j of this.config.jobs){
        //   if(w.job==j.value)w.job=j;
        // }
        w.job={label:w.job,value:w.job}
        if(w.state!="D")this.add_works.push(w);
      }
    this.select(work,3);
  }

  refresh_job(func:Function=null) {
    this.api._get("jobsites/","profil="+this.profil.id+"&job="+this.query).subscribe((res:any)=>{
      this.jobsites=res.sites.content;
      this.query=res.job;
      if(func)func();
    })
  }

  refresh_awards() {
      this.awards=[];
      let l_awards=this.profil.award.sort((a,b)=>{return a.year > b.year ? -1 : 1})

      for(let a of l_awards)
        if(a.state!="D")this.awards.push(a);

  }

  opensite(site: any, page: string) {
    if(page=="search")open(site.job_page)
    if(page=="login")open(site.login_page)
  }

  open_all_site(search: string) {
    this.refresh_job(()=>{
      let i=0;
      for(let site of this.jobsites){
        i++;
        open(site.job_page,"screen"+i);
      }
    });
  }


  contact_profil(profil: any) {
    this.router.navigate(["write"],{queryParams:{id:profil.id}})
  }

  remove_tuteur() {
    this.api._patch("profils/"+this.profil.id+"/","", {sponsorBy:null}).subscribe(()=>{
      this._location.back();
    },(err)=>{showError(this,err)});
  }

  open_profil(profil: any) {
    this.router.navigate(["search"],{queryParams:{filter:profil.firstname+" "+profil.lastname}})
  }

  refresh_students() {
    this.api._get("get_students","sponsor="+this.profil.id).subscribe((r:any)=>{
      this.students=r;
    });
  }

  remove_student(id: string) {
    this.api._patch("profils/"+id+"/","",{sponsorBy:null}).subscribe(()=>{
      this._location.back();
    });
  }

  write_all() {
    //TODO: implémenter la saisie d'un message pour envoie à tous les tutorés
  }

  ngOnDestroy(): void {
    this.save_profil(()=> {
      showMessage(this, "Profil enregistré");
    });
    this.save_user();
  }

  open_page(url,target="_blank") {
    open(url,target);
  }


  delete_pows() {
    for(let w of this.works){
      this.api._delete("pows/"+w.pow).subscribe((r:any)=>{
        this.works.splice(this.works.indexOf(w),1);
      });
    }
  }

  edit_award(award: any) {

  }


  add_award() {
    this.api._get("festivals","").subscribe((festivals:any)=>{
      this.dialog.open(EditAwardComponent,{width: '350px',data: {
          profil:this.profil,
          pows:this.pows,
          title:"Ajouter une récompense",
          question: "",
          festivals:festivals.results,
      }}).afterClosed().subscribe((result) => {
        if(result){
          this.api._post("awards","",{
            pow:result.pow.id,
            winner: true,
            festival:result.festival.id,
            description: result.title,
            profil: this.profil.id,
            year: result.year,
            state: 'E'
          }).subscribe((r:any)=>{
            this.refresh_awards();
          })
        }
      });
    })

  }

  del_award(award: any) {
    this.api._patch("awards/"+award.id,"",{state:'D'}).subscribe((r:any)=>{
      this.refresh_awards();
    })
  }

  open_source_award(award: any) {
    open(award.source,"_blank");
  }

  open_movie(movie_title) {
    this.router.navigate(['pows'],{queryParams:{query:"\""+movie_title+"\""}});
  }

  reset_contrib_profil() {
    this.reset_works();
    this.reset_awards();
  }

  open_faqs(rubrique:string) {
    this.router.navigate(["faqs"],{queryParams:{open:'ref_'+rubrique}})
  }

  cancel() {
    this.showAddWork=0;
    this.refresh_works();
  }

  apply_quality() {
    wait_message(this,"Traitement qualité en cours")
    this.api._get("quality_analyzer","filter="+this.profil.id+"&ope=profils").subscribe(()=>{
      wait_message(this)
      this.loadProfil()
    })
  }
}

