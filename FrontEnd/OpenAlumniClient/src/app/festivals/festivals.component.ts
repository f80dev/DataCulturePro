import { Component } from '@angular/core';

@Component({
  selector: 'app-festivals',
  templateUrl: './festivals.component.html',
  styleUrls: ['./festivals.component.sass']
})
export class FestivalsComponent {

  query: any={value:""};


  onQuery($event: KeyboardEvent) {
    this.refresh()
  }

  clearQuery() {
    this.query={value:""}
  }

  private refresh() {
    debugger
  }
}
