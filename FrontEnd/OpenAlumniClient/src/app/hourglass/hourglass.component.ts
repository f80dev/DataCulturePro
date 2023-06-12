import {Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges} from '@angular/core';
import {Router} from '@angular/router';

export function wait_message(vm:any,message="",modal=false,duration=1000000) : boolean {
  //Active les messages d'attentes
  if(!vm.hasOwnProperty("message"))return false;
  if(vm.hasOwnProperty("modal"))vm.modal=modal;
  vm.message=message;
  setTimeout(()=>{vm.message=""},duration);
  return true;
}

@Component({
  selector: 'app-hourglass',
  templateUrl: './hourglass.component.html',
  styleUrls: ['./hourglass.component.css']
})
export class HourglassComponent implements OnInit, OnDestroy, OnChanges {
  @Input("diameter") diameter = 18;
  @Input("message") message: string = "";
  @Input() modal:boolean=false;
  @Input("long_message") long_message = "";
  @Input("anim") src = "";
  @Input("br") _br = false;
  @Input("tips") tips = [];
  @Input("canCancel") canCancel = false;
  @Input("maxwidth") maxwidth = "100vw";
  @Input("faq") faq = "";
  @Input("duration") duration = 0;
  @Input("fontsize") fontsize = "medium";
  @Output('cancel') oncancel: EventEmitter<any> = new EventEmitter();
  @Input("marginTop") marginTop = "0px";
  pos = 0;
  showMessage = "";
  showTips = "";
  current = 0;
  step = 0;
  @Input() link: string="";

  constructor(public router: Router) {
  }

  ngOnChanges(changes: any): void {
    let new_message=changes.message.currentValue;
    if(new_message){
      if(new_message.startsWith("(i)")){
        this.message=new_message.replace("(i)","")
        this.diameter=0;
      }
      if(new_message.indexOf("https://")>-1){
        this.link="https://"+new_message.split("https://")[1].split(" ")[0];
        this.message=new_message.replace(this.link,"");
      }
    }

  }

  ngOnInit() {
    if(this.long_message.length>0){
      this.read_message();
    }

    if(this.tips.length>0){
      this.showTips=this.tips[Math.random()*this.tips.length];
    }

    if(this.duration>0){
      this.current=0;
      this.step=100/this.duration;
      this.decompte(0);
    }


  }

  handle:any=0;
  decompte(current:any){
    if(current>=100){
      this.current=0;
      this.duration=0;
      clearTimeout(this.handle);
    } else {
      this.current=current;
      this.handle=setTimeout(()=>{
        this.decompte(current+this.step);
        },1000);
    }
  }

  read_message(){
    if(this.pos<this.long_message.split("/").length){
      this.showMessage=this.long_message[this.pos];
      setTimeout(()=> {
        this.pos=this.pos+1;
        this.read_message();
      },1000);
    } else {
      this.showMessage="";
    }
  }



  openfaq() {
    this.router.navigate(["faq"],{queryParams:{open:this.faq}});
  }

  ngOnDestroy(): void {
    clearTimeout(this.handle);
    this.current=0;
    this.duration=0;
    this.step=0;
  }

  open_link() {
    open(this.link,"link");
  }
}
