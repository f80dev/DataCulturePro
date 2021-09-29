import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Router} from "@angular/router";

@Component({
  selector: 'app-hourglass',
  templateUrl: './hourglass.component.html',
  styleUrls: ['./hourglass.component.sass']
})
export class HourglassComponent implements OnInit {

  @Input("diameter") diameter=18;
  @Input("message") message="";
  @Input("canCancel") canCancel=false;
  @Input("maxwidth") maxwidth="100vw";
  @Input("faq") faq="";
  @Input("fontsize") fontsize="medium";
  @Output('cancel') oncancel: EventEmitter<any>=new EventEmitter();

  constructor(public router:Router) { }

  ngOnInit() {
  }

  openfaq() {
    this.router.navigate(["faq"],{queryParams:{open:this.faq}});
  }

}
