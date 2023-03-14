import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
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
  @Input() maxwidth:string="300px";


  @Input() options:any[]=[];
  @Input() value_field="";          //Value_field permet de ne mettre dans la value de la liste qu'un seul champ d'un dictionnaire
  @Input() placeholder:string="";


  //voir https://angular.io/guide/two-way-binding
  @Input() value:any;
  @Output() valueChange=new EventEmitter<any>();

  @Output() validate=new EventEmitter();
  @Output() cancel=new EventEmitter();

  @Input() value_type:string="";
  @Input() help:string="";
  @Input() help_input: string="";
  @Input() help_button: string="Enregistrez";
  showHelp: boolean=false;
  @Input() cols: number=0;
  @Input() rows: number=0;

  @Input() max: number=0;
  @Input() min: number=0;
  @Input() step: number=1;
  @Input() multiselect: boolean = false;

  constructor() { }

  on_clear() {
    this.value=null;
  }

  on_validate() {
    this.validate.emit(this.value);
  }

  on_key($event: KeyboardEvent) {
    if($event.key=='Enter')
      this.on_validate();
    else
      this.valueChange.emit(this.value);
  }

  sel_change($event: any) {
    this.value=$event.value;
    this.valueChange.emit($event.value);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if(changes["options"] && changes["options"].previousValue!=changes["options"].currentValue){
      this.options=[];
      for(let option of changes["options"].currentValue){
        if(typeof(option)=="string")option={label:option,value:option};
        if(typeof(option)=="object") {
          let txt_label=option["label"] || option["name"] || option["caption"] || option["title"];
          if (this.value_field.length > 0)
            option = {label: txt_label, "value": option[this.value_field]};
          else
            option = {label: txt_label, "value": option}
        }
        this.options.push(option);
      }
      if(this.options.length==1)
        this.sel_change({value:this.options[0].value})
    }
  }

  ngOnInit(): void {
    if(this.options.length>0){this.value_type="list";}
    if(this.rows>0 && this.cols==0)this.cols=10;
  }

  on_cancel() {
    this.cancel.emit();
  }
}


