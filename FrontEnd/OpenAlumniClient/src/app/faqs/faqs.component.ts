import { Component, OnInit } from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {ApiService} from '../api.service';
import {Location} from '@angular/common';
import {ConfigService} from '../config.service';
import {checkConfig} from '../tools';
import {environment} from "../../environments/environment";

@Component({
  selector: 'app-faqs',
  templateUrl: './faqs.component.html',
  styleUrls: ['./faqs.component.sass']
})
export class FaqsComponent implements OnInit {

  faqs: any[] = [];

  constructor(public api: ApiService,
              public config: ConfigService,
              public _location: Location,
              public route: ActivatedRoute) {
  }

  ngOnInit() {
    this.api.getfaqs().subscribe((rc: any) => {
      const params = this.route.snapshot.queryParamMap;

      this.faqs = [];

      for (const faq of rc.content) {
        if (!params.has('open') || faq.index.indexOf(params.get('open')) > -1) {
          faq.visible = params.has('open');

            for (let i = 0; i < 5; i++){
              faq.title = faq.title.replace('{{appname}}', environment.appname);
              faq.content = faq.content.replace('{{appname}}', environment.appname);
            }


          this.faqs.push(faq);
        }
      }
    });
  }

  open_faq($event: any,faq:any) {
    if($event)this._location.replaceState("faqs","open="+faq.index)
  }
}
