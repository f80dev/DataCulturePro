import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {COMMA, ENTER} from "@angular/cdk/keycodes";
import {FormControl} from "@angular/forms";
import {Observable} from "rxjs";
import {MatAutocomplete, MatAutocompleteSelectedEvent} from "@angular/material/autocomplete";
import {map, startWith} from "rxjs/operators";
import {MatChipInputEvent} from "@angular/material/chips";
import {ApiService} from "../api.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {ConfigService} from "../config.service";
import {checkLogin, showError, showMessage} from "../tools";
import {Location} from "@angular/common";
import {ActivatedRoute, Router} from "@angular/router";
import {PromptComponent} from "../prompt/prompt.component";
import {MatDialog} from "@angular/material/dialog";
import {ImageSelectorComponent} from "../image-selector/image-selector.component";


@Component({
  selector: 'app-html-editor',
  templateUrl: './html-editor.component.html',
  styleUrls: ['./html-editor.component.sass']
})

export class HtmlEditorComponent implements OnInit {
  visible = true;
  selectable = true;
  removable = true;
  separatorKeysCodes: number[] = [ENTER, COMMA];
  tagCtrl = new FormControl();
  filteredTags: Observable<string[]>;
  tags: string[] = ['Job'];
  allTags: string[] = ['News', 'Job','Annonce'];

  @ViewChild('fruitInput') tagInput: ElementRef<HTMLInputElement>;
  @ViewChild('auto') matAutocomplete: MatAutocomplete;
  editorContent: string="";
  message: string="";
  title="";
  resumer="";
  onlyPreview=false;

  constructor(
    public api:ApiService,
    public toast:MatSnackBar,
    public router:Router,
    public dialog:MatDialog,
    public config:ConfigService,
    public routes:ActivatedRoute,
    public _location:Location
  ) {
    this.filteredTags = this.tagCtrl.valueChanges.pipe(
      startWith(null),
      map((tag: string | null) => tag ? this._filter(tag) : this.allTags.slice()));
  }

  ngOnInit(): void {
    checkLogin(this,()=>{
      this.editorContent=localStorage.getItem("article_content");
      if(!this.editorContent || this.editorContent=="null")this.editorContent="";
      if(this.routes.snapshot.queryParamMap.has("article")){
        this.api._get("/articles/"+this.routes.snapshot.queryParamMap.get("article")).subscribe((article:any)=>{
          this.title=article.title;
          this.editorContent=article.html;
          this.resumer=article.sumary;
        })
      }
    });
  }


  publish() {
    this.message="En cours de publication";
    this.save((id)=>{
      this.api._patch("articles/"+id+"/","", {to_publish:true}).subscribe((r:any)=>{
        this.message="";
        showMessage(this,"Article en attente de publication");
        localStorage.setItem("article_id",null);
        localStorage.setItem("article_content",null);
        this.editorContent="";
        this._location.back();
      },(err)=>{showError(this,err)});
    });

  }



  add(event: MatChipInputEvent): void {
    const input = event.input;
    const value = event.value;

    // Add our fruit
    if ((value || '').trim()) {
      this.tags.push(value.trim());
    }

    // Reset the input value
    if (input) {
      input.value = '';
    }

    this.tagCtrl.setValue(null);
  }



  remove(fruit: string): void {
    const index = this.tags.indexOf(fruit);
    if (index >= 0) {
      this.tags.splice(index, 1);
    }
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    this.tags.push(event.option.viewValue);
    this.tagInput.nativeElement.value = '';
    this.tagCtrl.setValue(null);
  }


  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.allTags.filter(fruit => fruit.toLowerCase().indexOf(filterValue) === 0);
  }


  save(func=null) {
    localStorage.setItem("article_content",this.editorContent);
    let id=localStorage.getItem("article_id");
    let body= {
      html: this.editorContent,
      title:this.title,
      sumary:this.resumer,
      owner: this.config.user.id,
      validate: false,
      tags:this.tags.join(" "),
      to_publish:false
    }
    if(!id || id=="null"){
      this.api._post("articles","",body).subscribe((r:any)=>{
        localStorage.setItem("article_id",r.id);
        showMessage(this,"Nouvel Article enregistré");
        if(func)func(r.id);
      },(err)=>{
        showError(this,err);
      });
    } else {
      this.api._put("articles/"+id+"/","",body).subscribe((r:any)=>{
        showMessage(this,"Article modifié");
        if(func)func(id);
      });
    }

  }

  _import(fileInputEvent: any) {
    var reader = new FileReader();
    reader.onload = ()=>{
      this.editorContent=String(reader.result);
    };
    reader.readAsText(fileInputEvent.target.files[0],"utf-8");
    this.onlyPreview=true;
  }

  clear_article() {
    this.dialog.open(PromptComponent, {
      backdropClass:"removeBackground",
      data: {
        title: 'Effacer le contenu de votre article ?',
        question: "",
        onlyConfirm: true,
        lbl_ok: 'Effacer',
        lbl_cancel: 'Annuler'
      }
    }).afterClosed().subscribe((result_code) => {
      if(result_code=="yes"){
        this.editorContent="";
        this.onlyPreview=false;
        this.title="";
        this.resumer="";
      }
    });

  }

  clearTitle() {
    this.title="";
  }

  import_image() {
    this.dialog.open(ImageSelectorComponent, {position:{left: '5vw', top: '5vh'},
      maxWidth: 600, maxHeight: 900, width: 'fit-content', height: 'fit-content', data:
                {
                  result:"",
                  checkCode: true,
                  width: 200,
                  height: 200,
                  emoji: false,
                  webcam: true,
                  internet: true,
                  ratio: 1,
                  bank:true,
                  quality:0.7
                }
            }).afterClosed().subscribe((result) => {
      if (result) {
        this.editorContent=this.editorContent+"<img src=\""+result.img+"\">";
      }
    });
  }
}
