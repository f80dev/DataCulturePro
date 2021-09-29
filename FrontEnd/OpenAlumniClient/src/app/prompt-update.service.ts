import { Injectable } from '@angular/core';
import {SwUpdate} from "@angular/service-worker";

@Injectable({
  providedIn: 'root'
})
export class PromptUpdateService {

 constructor(updates: SwUpdate) {
    updates.available.subscribe(event => {
        debugger
        updates.activateUpdate().then(() => document.location.reload());
    });
  }
}
