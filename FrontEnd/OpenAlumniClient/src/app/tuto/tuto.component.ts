import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {brand_text, hashCode} from "../tools";
import {ConfigService} from "../config.service";
import {TransPipe} from "../trans.pipe";
import {Router} from "@angular/router";

@Component({
  selector: 'app-tuto',
  templateUrl: './tuto.component.html',
  styleUrls: ['./tuto.component.sass']
})
export class TutoComponent implements OnInit,OnChanges {

  @Input("text") text: string="";
  @Input("text-align") text_align: string="center";
  @Input("title") title: string="";
  @Input("type") _type: string="tips";
  @Input("label") label: string="";
  @Input("subtitle")subtitle: string="";
  @Input("position") position: string="center";
  @Input("delay") delay=0.2;
  @Input("duration") duration=0;
  @Input("background") background="";
  @Input("background-color") bkColor="black";
  @Input('if') _if=true;
  @Input('fullscreen') fullscreen=true;
  @Input('image') image: string="./assets/img/tips.png";
  @Input('main_button') labelButton: string="Continuez";
  @Input('icon') icon:string="";
  @Input('color') color:string="white";
  @Input('force') force:boolean=false;
  @Input('faq') faq:string="";
  @Input('icon_button') _button:string="";
  @Input('height') height:string="auto";
  @Output('click') onclick: EventEmitter<any>=new EventEmitter();
  @Output('close') onclose: EventEmitter<any>=new EventEmitter();

  constructor(public config:ConfigService,
              public router:Router,
              public transPipe:TransPipe) {}

  handle:any;
  code:string="";
  _position="fixed";

  refresh(){
    if(this.icon!=null && this.icon.length>0)this.image="";
    if(this.text==null || this.text.length==0){this.text=this.label;}
    if(this.title!=null && this.title.length>0 || this.subtitle.length>0){
      this._type="title";
      this.text=this.title;
    }
    if(this._type=="tips" && this._button!=null && this._button.length>0)this.image="";

    if(this.text==null || this.text.length==0)return;

    this.code="histo"+hashCode(this.text+this.subtitle);
    if(!this.force){
      if(localStorage.hasOwnProperty("tuto") && localStorage.getItem("tuto").indexOf(this.code)>-1){
        this._if=false;
      }
    }

    if(this.duration==0)this.duration=(this.text.split(" ").length+this.subtitle.split(" ").length)/2;

    if(!this.fullscreen)this._position="relative";
    this.text=brand_text(this.text,this.config);
    this.title=brand_text(this.title,this.config);

    if(!this.config.visibleTuto || this._type=="title" || this.force ){
      if(this._if){
        this.config.visibleTuto=true;
        this.handle=setTimeout(()=>{
          this.hideTuto(true);
        },3000+this.duration*1000);
      } else {
        this.hideTuto();
      }
    }
    else{
      this.hideTuto();
    }

    if(this._type!="title")this.color="#ecdb95";

  }



  ngOnChanges(changes: SimpleChanges) {
    this.refresh();
  }


  hideTuto(addHisto=false) {
    if(addHisto){
      var s=localStorage.getItem("tuto")+","+this.code;
      localStorage.setItem("tuto",s);
    } //Marque l'affichage
    this.text="";
    this._if=false;
    this.config.visibleTuto=false;
    this.title="";
    this.subtitle="";
    this.onclose.emit();
    clearTimeout(this.handle);
  }


  ngOnInit(): void {

  }

  showText(b: boolean) {
    this._if=b;
    this.ngOnChanges(null);
  }
}
