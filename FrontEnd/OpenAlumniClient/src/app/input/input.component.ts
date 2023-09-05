import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {FormControl} from "@angular/forms";
//version 1.0 3/3/23

@Component({
  selector: 'app-input',
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.scss']
})
export class InputComponent implements OnChanges,OnInit {
  @Input() infobulle:string="";
  @Input() label:string="";
  @Input() color:string="black";

  @Input() label_button:string="";
  @Input() cancel_button:string="";

  @Input() maxlength:string=""
  @Input() width:string="100%";
  @Input() maxwidth:string="100%";
  @Input() color_value="darkgray";
  @Input() size_image="40px";
  @Input() filter="";


  @Input() options:any=[];
  @Input() value_field="";          //Value_field permet de ne mettre dans la value de la liste qu'un seul champ d'un dictionnaire
  @Input() placeholder:string="";


  //voir https://angular.io/guide/two-way-binding
  @Input() value:any;
  valueCtrl=new FormControl()

  @Output() valueChange=new EventEmitter<any>();

  @Output() validate=new EventEmitter();
  @Output() cancel=new EventEmitter();

  @Input() value_type:"text" | "number" | "memo" | "list" | "listimages" | "boolean" | "images" | "slide" | "slider" = "text";
  @Input() help:string="";
  @Input() help_input: string="";
  @Input() help_button: string="Enregistrez";
  showHelp: boolean=false;
  @Input() cols: number=0;
  @Input() rows: number=0;

  @Input() max: number=1e18;
  @Input() min: number=0;
  @Input() step: number=1;
  @Input() multiselect: boolean = false;
  @Input() showClear: boolean=true
  @Input() fontname="mat-body-2"
  @Input() height="200px"
  @Input() unity: string="";


  constructor() { }

  on_clear() {
    this.value=null;
    if(this.value_type=="text")this.value="";
    this.valueChange.emit(this.value);
    this.on_validate();
  }

  on_validate() {
    this.validate.emit(this.value);
    this.valueChange.emit(this.value);
  }

  on_key($event: KeyboardEvent) {
    if($event.key=='Enter')
      this.on_validate();
    else
      this.valueChange.emit(this.value);
  }

  sel_change($event: any) {
    if($event.hasOwnProperty("options")){
      let values= $event.options
      this.value=values[0].value
    }else {
      if(this.value_type=="slide" || this.value_type=="slider"){
        this.value=$event.value
      } else {
        this.value = $event;
      }

    }

    if(this.value_field==""){
      this.valueChange.emit(this.value);
    } else {
      this.valueChange.emit(this.value[this.value_field]);
    }


  }

  ngOnChanges(changes: SimpleChanges): void {
    if(this.value_type=="list" || this.value_type=="listimages" || this.value_type=="images") {
      if(changes["value"]){
        if(this.value_field==""){
          let v=changes["value"].currentValue
          if(typeof(v)=="string")v={label:v,value:v}
          this.valueCtrl.setValue(v)
        }else{
          for(let o of this.options){
            if(o[this.value_field]==changes["value"].currentValue){
              this.valueCtrl.setValue(o)
              break
            }
          }
        }
      }

      if (typeof (changes["options"]) == "string") { // @ts-ignore
        changes["options"] = changes["options"].split(",")
      }
      if (changes["options"] && changes["options"].previousValue != changes["options"].currentValue) {
        this.options = [];
        for (let option of changes["options"].currentValue) {
          if (typeof(option) == "string") option = {label: option, value: option};
          if (typeof(option) == "object") {
            option.label = option["label"] || option["name"] || option["caption"] || option["title"];
            // if (this.value_field.length > 0){
            //   option.value=option[this.value_field]
            // }else{
            //   option.value= JSON.parse(JSON.stringify(option))
            // }
          }
          this.options.push(option);
        }
      }
    }
  }

  ngOnInit(): void {
    if(typeof(this.options)=="string")this.options=this.options.split(",")
    if(this.options.length>0){this.value_type="list";}
    if(this.rows>0 && this.cols==0)this.cols=10;
  }

  on_cancel() {
    this.cancel.emit();
  }

  direct_change_slider() {
    if(this.value_type=="slider" || this.value_type=="slide"){
      if(this.value>this.max)this.value=this.max;
      if(this.value<this.min)this.value=this.min;
    }

  }

  compareFn(obj1:any,obj2:any){
    let c_obj1=typeof(obj1)=="object" ? JSON.stringify(obj1) : obj1
    let c_obj2=typeof(obj2)=="object" ? JSON.stringify(obj2) : obj2
    //TODO: faire un tri des propriété par ordre alphabétique pour s'assurrer que {a:1,b:2} est égale à {b:2,a:1}
    return c_obj1===c_obj2
  }

  explore(value: any) {
    open(value,"Explorer")
  }
}


