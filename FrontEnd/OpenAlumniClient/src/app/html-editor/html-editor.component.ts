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
import {Router} from "@angular/router";


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
  editorContent: string="Votre article ici";
  message: string="";

  constructor(
    public api:ApiService,
    public toast:MatSnackBar,
    public router:Router,
    public config:ConfigService,
    public _location:Location
  ) {
    this.filteredTags = this.tagCtrl.valueChanges.pipe(
        startWith(null),
        map((tag: string | null) => tag ? this._filter(tag) : this.allTags.slice()));
  }

  ngOnInit(): void {
    checkLogin(this);
    this.editorContent=localStorage.getItem("article_content");
    if(!this.editorContent || this.editorContent=="null")this.editorContent="Votre article ici";
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
  }
}
