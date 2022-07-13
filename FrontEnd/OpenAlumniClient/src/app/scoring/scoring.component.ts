import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

@Component({
  selector: 'app-scoring',
  templateUrl: './scoring.component.html',
  styleUrls: ['./scoring.component.sass']
})
export class ScoringComponent {

  @Input() value: number=0;
  @Output() valueChange : EventEmitter<number>=new EventEmitter<number>();
  @Input("options") options=["Pas du tout","Un peu","Suffisament","Beaucoup"];
  @Input("width") width="300px"

  constructor() { }

  onchange($event: number) {
    this.valueChange.emit($event);
  }
}
