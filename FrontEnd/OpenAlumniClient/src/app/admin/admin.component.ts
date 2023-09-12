import {AfterViewInit, Component, OnInit} from '@angular/core';
import {ApiService} from "../api.service";
import {$$, api, showError, showMessage} from "../tools";
import {Router} from "@angular/router";
import {ConfigService} from "../config.service";
import {environment} from "../../environments/environment";
import {MatSnackBar} from "@angular/material/snack-bar";
import {tProfilPerms} from "../types";
import {_prompt} from "../prompt/prompt.component";
import {MatDialog} from "@angular/material/dialog";

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.sass']
})
export class AdminComponent implements OnInit,AfterViewInit {

  message: string;
  users:any[]=[];
  profils: any[]=[];
  backup_files: any[]=[];
  sel_backup_file:string="";
  show_server: boolean=true;
  mongdb_connexion_string: any=""

  constructor(private api:ApiService,
              public config:ConfigService,
              public router:Router,
              public dialog:MatDialog,
              public toast:MatSnackBar) {
    this.config.user_update.subscribe(()=>{
      this.profils=Object.values(this.config.profils);
    })
  }

  ngAfterViewInit(): void {
        setTimeout(()=>{this.refresh();},1500);
    }

  refresh(){
    this.api._get("extrausers").subscribe((r:any)=>{
      this.users=r.results;
      setTimeout(()=>{
        for(let i=0;i<this.users.length;i++){
          $$("Affectation du profil "+this.users[i].profil_name+" pour le user "+i)
          this.users[i].profil_perm=this.config.profils[this.users[i].profil_name]
        }
      },2000)

    })
  }

  ngOnInit(): void {
    this.refresh_backup();
    this.profils=Object.values(this.config.profils);
  }

  async raz(table:string) {
    let rep=await _prompt(this,"Confirmer l'effacement total ?")
    if(rep=="yes"){
      this.message="Effacement de la base de données";
      try {
        await this.save_backup();
        this.api._get("raz/","tables="+table+"&password=oui",200).subscribe(()=>{
          showMessage(this,"Base de données effacée");
          this.message="";
          this.initdb();
          this.router.navigate(["import"]);
        },(err)=>{
          showError(this,"Echec d'effacement de la base");
        })
      }catch (e){
        showError(this,e);
      }

    }

  }

  openQuery() {
    open(environment.domain_server+"/graphql","admin");
  }

  openDjangoAdmin() {
    open(environment.domain_server+"/admin/","admin");
  }

  openAPI() {
    open(environment.domain_server+"/api/users/","admin");
  }

  openHelloWorld() {
    this.api.hello_world().subscribe((r:any)=>{
      showMessage(this,r.message);
    })
  }

  send_update(){
    this.api._get("ask_for_update").subscribe((r:any)=>{
      showMessage(this,r.message);
    })
  }

  initdb() {
    this.api._get("initdb").subscribe(()=>{
      showMessage(this,"Base initialisée")
    });
  }

  batch(refresh_delay_profil=31,refresh_delay_page=200,remove_works=false,filter="*",offline=false) {
    let catalog=this.config.values ? this.config.values.catalog : "imdb,unifrance";
    let params="remove_works="+remove_works+"&refresh_delay_profil="+refresh_delay_profil+"&refresh_delay_page="+refresh_delay_page+"&filter="+filter+"&offline="+offline;

    this.api._post("batch/",params,catalog).subscribe(()=>{
      showMessage(this,"traitement terminé")
    })
  }

  async ask_for_filter() {
    let filter=await _prompt(
        this,"Premières lettres du nom",
        "",
        "Seul les profils dont le nom commence par les lettres suivantes sont analysés",
        "text","Démarrer","Annuler",false);
    if(filter){
      this.batch(31,20,false,filter)
    }
  }

  batch_movies() {
    this.message="Analyse film par film pour complément";
    let cat="";
    for(let key of Object.keys(this.config.values.catalog)){
      if(this.config.values.catalog[key])
        cat=cat+key+","
    }
    this.api._get("analyse_pow/","cat="+cat).subscribe(()=>{
      showMessage(this,"traitement terminé")
      this.message="";
    },(err)=>{
      showError(this,err);
    })
  }

  update_index() {
    this.message="Le moteur de recherche est en cours de réinidexation (ce processus peut être long)" ;
    this.api._get("rebuild_index","name=profils",600).subscribe({
      next:(r:any)=>{this.message="";showMessage(this,r.message);},
      error:(r:any)=>{this.message="";showMessage(this,r.message);}
    });
  }

  export_profils(cursus:string="S") {
    let url=api("export_profils/","cursus="+cursus,true,"csv");
    debugger
    open(url);
  }

  apply_dict() {
    this.message="Uniformise la terminoloie"
    this.api._get("update_dictionnary").subscribe(()=>{
      this.message="";
    })
  }

  init_nft() {
    this.message="Initialisation des NFTs";
    this.api._get("init_nft").subscribe(()=>{
      this.message="";
    })
  }

  analyzer(ope="profils,films") {
    this.message="Traitement qualite sur les "+ope;
    this.api._get("quality_analyzer","ope="+ope).subscribe((r)=>{
      this.message="";
    })
  }

  openServer(url: string) {
    url=url.substring(0,url.lastIndexOf(":"))+":9090/system/terminal"
    if(!url.startsWith("http"))url="http://"+url;
    open(url,"terminal");
  }

  del_user(u: any) {
    this.api._delete("users/"+u.user.id).subscribe((r:any)=>{
      this.refresh();
    });
  }

  async cancel_ask(u: any) {
    let motif=await _prompt(this,"Motiver le refus","Profil réservé","Une phrase suffit","text","Envoyer","Annuler",false);
    this.api.sendmail(u.user.email,"Refus de profil","cancel_profil_update",{motif:motif}).subscribe(()=>{
      u.ask="";
      this.api.setuser(u).subscribe(()=>{
        showMessage(this,"Message envoyé");
        this.refresh();
      })
    })
  }

  async send_email(u: any) {
    let message=await _prompt(this,"Message","Bonjour, ","","text","Envoyer","Annuler",false);
    this.api.sendmail(u.user.email,"Message de Data Culture","mail_message",{message:message}).subscribe(()=>{
      showMessage(this,"Message envoyé");
    })
  }


  export_dict() {
    open(environment.domain_server+"/api/export_dict");
  }


  update_profil(u: any,sel_profil:any) {
    u.profil_name=sel_profil
    u.perm=this.config.profils[sel_profil].perm;
    this.api.setuser(u).subscribe(() => {
      showMessage(this,"Profil mise a jour");
    });
  }


  load_backup() {
    this.message="Chargement en cours ... le processus peut être très long";
    this.api._get("backup","command=load&file="+this.sel_backup_file,60000).subscribe((r:any)=>{
      this.message="";
      showMessage(this,"Chargement terminé")
      this.show_server=true;
    },(err:any)=>{
      showMessage(this,err.error.message);
      this.message="";
    })
  }

  refresh_backup(){
    this.api._get("backup_files","").subscribe((r:any)=>{
      this.backup_files=r.files;
    })
  }

  upload_backup(file:any){
    this.message="Chargement d'un backup";
    this.api._post("backup_files/","",file).subscribe(()=>{
      this.refresh_backup();
    })
  }

  save_backup() {
    return new Promise((resolve, reject) => {
      this.message="Backup en cours";
      this.api._get("backup","command=save").subscribe((r:any)=>{
        this.message="";
        this.refresh_backup();
        showMessage(this,"Enregistrement terminé")
        resolve(true);
      },(err)=>{
        showError(this,err)
        reject();
      })
    })
  }


  fast_batch(refresh_delay_profil=3,refresh_delay_page=200,step=2) {
    let alphabet="a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,,x,y,z".split(",");
    for(let i=0;i<alphabet.length;i=i+step){
      let filter=alphabet.slice(i,i+step);
      $$("Lancement du batch avec "+filter.join(","))
      this.batch(refresh_delay_profil,refresh_delay_page,false,filter.join(","),false)
    }
  }

  async add_user() {
    let rep=await _prompt(this,"Email de l'utilisateur","","Un email d'inscription lui sera envoyé","text","Envoyé","Annuler",false)
    if(rep){
      this.api.getextrauser(rep).subscribe(async (result: any) => {
        if (result.results.length > 0) {
          showMessage(this,"Impossible ce compte existe déjà")
        } else {
          let fullname=await _prompt(this,"Indiquer son prénom et son nom","","","text","Envoyé","Annuler",false)
          let firstname=fullname.split(" ")[0]
          this.api.register({
            email: rep,
            username: rep,
            first_name: firstname,
            last_name: fullname.replace(firstname+" ",""),
          }).subscribe((res: any) => {
            this.refresh();
          },(err)=>{
            showError(this,err);
          });
        }
      })
    }
  }
}
