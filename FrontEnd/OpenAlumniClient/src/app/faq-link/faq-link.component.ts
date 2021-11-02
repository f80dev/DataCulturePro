import {Component, Input, OnInit} from '@angular/core';
import {Router} from '@angular/router';

@Component({
  selector: 'app-faq-link',
  templateUrl: './faq-link.component.html',
  styleUrls: ['./faq-link.component.sass']
})
export class FaqLinkComponent {

  @Input('faq') faq = '';

  constructor(public router: Router) { }

}
