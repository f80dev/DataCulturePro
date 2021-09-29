import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { QuillService } from './quill.service';
import { OnChanges, SimpleChanges } from '@angular/core';
export declare class QuillViewHTMLComponent implements OnChanges {
    private sanitizer;
    protected service: QuillService;
    innerHTML: SafeHtml;
    themeClass: string;
    content: string;
    theme?: string;
    constructor(sanitizer: DomSanitizer, service: QuillService);
    ngOnChanges(changes: SimpleChanges): void;
}
