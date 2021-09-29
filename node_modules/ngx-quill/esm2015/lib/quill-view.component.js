import { __awaiter } from "tslib";
import { isPlatformServer } from '@angular/common';
import { Component, ElementRef, Inject, Input, PLATFORM_ID, Renderer2, ViewEncapsulation, NgZone, SecurityContext } from '@angular/core';
import { getFormat } from './helpers';
import { QuillService } from './quill.service';
import { DomSanitizer } from '@angular/platform-browser';
export class QuillViewComponent {
    constructor(elementRef, renderer, zone, service, domSanitizer, platformId) {
        this.elementRef = elementRef;
        this.renderer = renderer;
        this.zone = zone;
        this.service = service;
        this.domSanitizer = domSanitizer;
        this.platformId = platformId;
        this.sanitize = false;
        this.strict = true;
        this.customModules = [];
        this.customOptions = [];
        this.preserveWhitespace = false;
        this.valueSetter = (quillEditor, value) => {
            const format = getFormat(this.format, this.service.config.format);
            let content = value;
            if (format === 'text') {
                quillEditor.setText(content);
            }
            else {
                if (format === 'html') {
                    if (this.sanitize) {
                        value = this.domSanitizer.sanitize(SecurityContext.HTML, value);
                    }
                    content = quillEditor.clipboard.convert(value);
                }
                else if (format === 'json') {
                    try {
                        content = JSON.parse(value);
                    }
                    catch (e) {
                        content = [{ insert: value }];
                    }
                }
                quillEditor.setContents(content);
            }
        };
    }
    ngOnChanges(changes) {
        if (!this.quillEditor) {
            return;
        }
        if (changes.content) {
            this.valueSetter(this.quillEditor, changes.content.currentValue);
        }
    }
    ngAfterViewInit() {
        return __awaiter(this, void 0, void 0, function* () {
            if (isPlatformServer(this.platformId)) {
                return;
            }
            const Quill = yield this.service.getQuill();
            const modules = Object.assign({}, this.modules || this.service.config.modules);
            modules.toolbar = false;
            this.customOptions.forEach((customOption) => {
                const newCustomOption = Quill.import(customOption.import);
                newCustomOption.whitelist = customOption.whitelist;
                Quill.register(newCustomOption, true);
            });
            this.customModules.forEach(({ implementation, path }) => {
                Quill.register(path, implementation);
            });
            let debug = this.debug;
            if (!debug && debug !== false && this.service.config.debug) {
                debug = this.service.config.debug;
            }
            let formats = this.formats;
            if (!formats && formats === undefined) {
                formats = this.service.config.formats ?
                    Object.assign({}, this.service.config.formats) : (this.service.config.formats === null ? null : undefined);
            }
            const theme = this.theme || (this.service.config.theme ? this.service.config.theme : 'snow');
            this.elementRef.nativeElement.insertAdjacentHTML('afterbegin', this.preserveWhitespace ? '<pre quill-view-element></pre>' : '<div quill-view-element></div>');
            this.editorElem = this.elementRef.nativeElement.querySelector('[quill-view-element]');
            this.zone.runOutsideAngular(() => {
                this.quillEditor = new Quill(this.editorElem, {
                    debug: debug,
                    formats: formats,
                    modules,
                    readOnly: true,
                    strict: this.strict,
                    theme
                });
            });
            this.renderer.addClass(this.editorElem, 'ngx-quill-view');
            if (this.content) {
                this.valueSetter(this.quillEditor, this.content);
            }
        });
    }
}
QuillViewComponent.decorators = [
    { type: Component, args: [{
                encapsulation: ViewEncapsulation.None,
                selector: 'quill-view',
                template: `
`,
                styles: [`
.ql-container.ngx-quill-view {
  border: 0;
}
`]
            },] }
];
QuillViewComponent.ctorParameters = () => [
    { type: ElementRef },
    { type: Renderer2 },
    { type: NgZone },
    { type: QuillService },
    { type: DomSanitizer },
    { type: undefined, decorators: [{ type: Inject, args: [PLATFORM_ID,] }] }
];
QuillViewComponent.propDecorators = {
    format: [{ type: Input }],
    theme: [{ type: Input }],
    modules: [{ type: Input }],
    debug: [{ type: Input }],
    formats: [{ type: Input }],
    sanitize: [{ type: Input }],
    strict: [{ type: Input }],
    content: [{ type: Input }],
    customModules: [{ type: Input }],
    customOptions: [{ type: Input }],
    preserveWhitespace: [{ type: Input }]
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVpbGwtdmlldy5jb21wb25lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9wcm9qZWN0cy9uZ3gtcXVpbGwvc3JjL2xpYi9xdWlsbC12aWV3LmNvbXBvbmVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxFQUFFLGdCQUFnQixFQUFFLE1BQU0saUJBQWlCLENBQUE7QUFJbEQsT0FBTyxFQUVMLFNBQVMsRUFDVCxVQUFVLEVBQ1YsTUFBTSxFQUNOLEtBQUssRUFFTCxXQUFXLEVBQ1gsU0FBUyxFQUVULGlCQUFpQixFQUNqQixNQUFNLEVBQ04sZUFBZSxFQUNoQixNQUFNLGVBQWUsQ0FBQTtBQUd0QixPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sV0FBVyxDQUFBO0FBQ25DLE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQTtBQUM5QyxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0sMkJBQTJCLENBQUE7QUFheEQsTUFBTSxPQUFPLGtCQUFrQjtJQWdCN0IsWUFDUyxVQUFzQixFQUNuQixRQUFtQixFQUNuQixJQUFZLEVBQ1osT0FBcUIsRUFDckIsWUFBMEIsRUFDTCxVQUFlO1FBTHZDLGVBQVUsR0FBVixVQUFVLENBQVk7UUFDbkIsYUFBUSxHQUFSLFFBQVEsQ0FBVztRQUNuQixTQUFJLEdBQUosSUFBSSxDQUFRO1FBQ1osWUFBTyxHQUFQLE9BQU8sQ0FBYztRQUNyQixpQkFBWSxHQUFaLFlBQVksQ0FBYztRQUNMLGVBQVUsR0FBVixVQUFVLENBQUs7UUFidkMsYUFBUSxHQUFHLEtBQUssQ0FBQTtRQUNoQixXQUFNLEdBQUcsSUFBSSxDQUFBO1FBRWIsa0JBQWEsR0FBbUIsRUFBRSxDQUFBO1FBQ2xDLGtCQUFhLEdBQW1CLEVBQUUsQ0FBQTtRQUNsQyx1QkFBa0IsR0FBRyxLQUFLLENBQUE7UUFXbkMsZ0JBQVcsR0FBRyxDQUFDLFdBQXNCLEVBQUUsS0FBVSxFQUFPLEVBQUU7WUFDeEQs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Q25CLEtBQUs7aUJBQ04sQ0FBQyxDQUFBO1lBQ0osQ0FBQyxDQUFDLENBQUE7WUFFRixJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLGdCQUFnQixDQUFDLENBQUE7WUFFekQsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFO2dCQUNoQixJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFBO2FBQ2pEO1FBQ0gsQ0FBQztLQUFBOzs7WUE1SEYsU0FBUyxTQUFDO2dCQUNULGFBQWEsRUFBRSxpQkFBaUIsQ0FBQyxJQUFJO2dCQUNyQyxRQUFRLEVBQUUsWUFBWTtnQkFNdEIsUUFBUSxFQUFFO0NBQ1g7eUJBTlU7Ozs7Q0FJVjthQUdBOzs7WUEzQkMsVUFBVTtZQUtWLFNBQVM7WUFHVCxNQUFNO1lBTUMsWUFBWTtZQUNaLFlBQVk7NENBbUNoQixNQUFNLFNBQUMsV0FBVzs7O3FCQWxCcEIsS0FBSztvQkFDTCxLQUFLO3NCQUNMLEtBQUs7b0JBQ0wsS0FBSztzQkFDTCxLQUFLO3VCQUNMLEtBQUs7cUJBQ0wsS0FBSztzQkFDTCxLQUFLOzRCQUNMLEtBQUs7NEJBQ0wsS0FBSztpQ0FDTCxLQUFLIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgaXNQbGF0Zm9ybVNlcnZlciB9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbidcbmltcG9ydCBRdWlsbFR5cGUgZnJvbSAncXVpbGwnXG5pbXBvcnQgeyBRdWlsbE1vZHVsZXMgfSBmcm9tICcuL3F1aWxsLWVkaXRvci5pbnRlcmZhY2VzJ1xuXG5pbXBvcnQge1xuICBBZnRlclZpZXdJbml0LFxuICBDb21wb25lbnQsXG4gIEVsZW1lbnRSZWYsXG4gIEluamVjdCxcbiAgSW5wdXQsXG4gIE9uQ2hhbmdlcyxcbiAgUExBVEZPUk1fSUQsXG4gIFJlbmRlcmVyMixcbiAgU2ltcGxlQ2hhbmdlcyxcbiAgVmlld0VuY2Fwc3VsYXRpb24sXG4gIE5nWm9uZSxcbiAgU2VjdXJpdHlDb250ZXh0XG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnXG5cbmltcG9ydCB7IEN1c3RvbU9wdGlvbiwgQ3VzdG9tTW9kdWxlIH0gZnJvbSAnLi9xdWlsbC1lZGl0b3IuaW50ZXJmYWNlcydcbmltcG9ydCB7Z2V0Rm9ybWF0fSBmcm9tICcuL2hlbHBlcnMnXG5pbXBvcnQgeyBRdWlsbFNlcnZpY2UgfSBmcm9tICcuL3F1aWxsLnNlcnZpY2UnXG5pbXBvcnQgeyBEb21TYW5pdGl6ZXIgfSBmcm9tICdAYW5ndWxhci9wbGF0Zm9ybS1icm93c2VyJ1xuXG5AQ29tcG9uZW50KHtcbiAgZW5jYXBzdWxhdGlvbjogVmlld0VuY2Fwc3VsYXRpb24uTm9uZSxcbiAgc2VsZWN0b3I6ICdxdWlsbC12aWV3JyxcbiAgc3R5bGVzOiBbYFxuLnFsLWNvbnRhaW5lci5uZ3gtcXVpbGwtdmlldyB7XG4gIGJvcmRlcjogMDtcbn1cbmBdLFxuICB0ZW1wbGF0ZTogYFxuYFxufSlcbmV4cG9ydCBjbGFzcyBRdWlsbFZpZXdDb21wb25lbnQgaW1wbGVtZW50cyBBZnRlclZpZXdJbml0LCBPbkNoYW5nZXMge1xuICBxdWlsbEVkaXRvciE6IFF1aWxsVHlwZVxuICBlZGl0b3JFbGVtITogSFRNTEVsZW1lbnRcblxuICBASW5wdXQoKSBmb3JtYXQ/OiAnb2JqZWN0JyB8ICdodG1sJyB8ICd0ZXh0JyB8ICdqc29uJ1xuICBASW5wdXQoKSB0aGVtZT86IHN0cmluZ1xuICBASW5wdXQoKSBtb2R1bGVzPzogUXVpbGxNb2R1bGVzXG4gIEBJbnB1dCgpIGRlYnVnPzogJ3dhcm4nIHzCoCdsb2cnIHzCoCdlcnJvcicgfMKgZmFsc2VcbiAgQElucHV0KCkgZm9ybWF0cz86IHN0cmluZ1tdIHzCoG51bGxcbiAgQElucHV0KCkgc2FuaXRpemUgPSBmYWxzZVxuICBASW5wdXQoKSBzdHJpY3QgPSB0cnVlXG4gIEBJbnB1dCgpIGNvbnRlbnQ6IGFueVxuICBASW5wdXQoKSBjdXN0b21Nb2R1bGVzOiBDdXN0b21Nb2R1bGVbXSA9IFtdXG4gIEBJbnB1dCgpIGN1c3RvbU9wdGlvbnM6IEN1c3RvbU9wdGlvbltdID0gW11cbiAgQElucHV0KCkgcHJlc2VydmVXaGl0ZXNwYWNlID0gZmFsc2VcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwdWJsaWMgZWxlbWVudFJlZjogRWxlbWVudFJlZixcbiAgICBwcm90ZWN0ZWQgcmVuZGVyZXI6IFJlbmRlcmVyMixcbiAgICBwcm90ZWN0ZWQgem9uZTogTmdab25lLFxuICAgIHByb3RlY3RlZCBzZXJ2aWNlOiBRdWlsbFNlcnZpY2UsXG4gICAgcHJvdGVjdGVkIGRvbVNhbml0aXplcjogRG9tU2FuaXRpemVyLFxuICAgIEBJbmplY3QoUExBVEZPUk1fSUQpIHByb3RlY3RlZCBwbGF0Zm9ybUlkOiBhbnksXG4gICkge31cblxuICB2YWx1ZVNldHRlciA9IChxdWlsbEVkaXRvcjogUXVpbGxUeXBlLCB2YWx1ZTogYW55KTogYW55ID0+IHtcbiAgICBjb25zdCBmb3JtYXQgPSBnZXRGb3JtYXQodGhpcy5mb3JtYXQsIHRoaXMuc2VydmljZS5jb25maWcuZm9ybWF0KVxuICAgIGxldCBjb250ZW50ID0gdmFsdWVcbiAgICBpZiAoZm9ybWF0ID09PSAndGV4dCcpIHtcbiAgICAgIHF1aWxsRWRpdG9yLnNldFRleHQoY29udGVudClcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGZvcm1hdCA9PT0gJ2h0bWwnKSB7XG4gICAgICAgIGlmICh0aGlzLnNhbml0aXplKSB7XG4gICAgICAgICAgdmFsdWUgPSB0aGlzLmRvbVNhbml0aXplci5zYW5pdGl6ZShTZWN1cml0eUNvbnRleHQuSFRNTCwgdmFsdWUpXG4gICAgICAgIH1cbiAgICAgICAgY29udGVudCA9IHF1aWxsRWRpdG9yLmNsaXBib2FyZC5jb252ZXJ0KHZhbHVlKVxuICAgICAgfcKgZWxzZSBpZiAoZm9ybWF0ID09PSAnanNvbicpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb250ZW50ID0gSlNPTi5wYXJzZSh2YWx1ZSlcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIGNvbnRlbnQgPSBbeyBpbnNlcnQ6IHZhbHVlIH1dXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHF1aWxsRWRpdG9yLnNldENvbnRlbnRzKGNvbnRlbnQpXG4gICAgfVxuICB9XG5cbiAgbmdPbkNoYW5nZXMoY2hhbmdlczogU2ltcGxlQ2hhbmdlcykge1xuICAgIGlmICghdGhpcy5xdWlsbEVkaXRvcikge1xuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGlmIChjaGFuZ2VzLmNvbnRlbnQpIHtcbiAgICAgIHRoaXMudmFsdWVTZXR0ZXIodGhpcy5xdWlsbEVkaXRvciwgY2hhbmdlcy5jb250ZW50LmN1cnJlbnRWYWx1ZSlcbiAgICB9XG4gIH1cblxuICBhc3luYyBuZ0FmdGVyVmlld0luaXQoKSB7XG4gICAgaWYgKGlzUGxhdGZvcm1TZXJ2ZXIodGhpcy5wbGF0Zm9ybUlkKSkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgY29uc3QgUXVpbGwgPSBhd2FpdCB0aGlzLnNlcnZpY2UuZ2V0UXVpbGwoKVxuXG4gICAgY29uc3QgbW9kdWxlcyA9IE9iamVjdC5hc3NpZ24oe30sIHRoaXMubW9kdWxlcyB8fCB0aGlzLnNlcnZpY2UuY29uZmlnLm1vZHVsZXMpXG4gICAgbW9kdWxlcy50b29sYmFyID0gZmFsc2VcblxuICAgIHRoaXMuY3VzdG9tT3B0aW9ucy5mb3JFYWNoKChjdXN0b21PcHRpb24pID0+IHtcbiAgICAgIGNvbnN0IG5ld0N1c3RvbU9wdGlvbiA9IFF1aWxsLmltcG9ydChjdXN0b21PcHRpb24uaW1wb3J0KVxuICAgICAgbmV3Q3VzdG9tT3B0aW9uLndoaXRlbGlzdCA9IGN1c3RvbU9wdGlvbi53aGl0ZWxpc3RcbiAgICAgIFF1aWxsLnJlZ2lzdGVyKG5ld0N1c3RvbU9wdGlvbiwgdHJ1ZSlcbiAgICB9KVxuXG4gICAgdGhpcy5jdXN0b21Nb2R1bGVzLmZvckVhY2goKHtpbXBsZW1lbnRhdGlvbiwgcGF0aH0pID0+IHtcbiAgICAgIFF1aWxsLnJlZ2lzdGVyKHBhdGgsIGltcGxlbWVudGF0aW9uKVxuICAgIH0pXG5cbiAgICBsZXQgZGVidWcgPSB0aGlzLmRlYnVnXG4gICAgaWYgKCFkZWJ1ZyAmJiBkZWJ1ZyAhPT0gZmFsc2UgJiYgdGhpcy5zZXJ2aWNlLmNvbmZpZy5kZWJ1Zykge1xuICAgICAgZGVidWcgPSB0aGlzLnNlcnZpY2UuY29uZmlnLmRlYnVnXG4gICAgfVxuXG4gICAgbGV0IGZvcm1hdHMgPSB0aGlzLmZvcm1hdHNcbiAgICBpZiAoIWZvcm1hdHMgJiYgZm9ybWF0cyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBmb3JtYXRzID0gdGhpcy5zZXJ2aWNlLmNvbmZpZy5mb3JtYXRzID9cbiAgICAgICAgT2JqZWN0LmFzc2lnbih7fSwgdGhpcy5zZXJ2aWNlLmNvbmZpZy5mb3JtYXRzKSA6wqAodGhpcy5zZXJ2aWNlLmNvbmZpZy5mb3JtYXRzID09PSBudWxsID8gbnVsbCA6IHVuZGVmaW5lZClcbiAgICB9XG4gICAgY29uc3QgdGhlbWUgPSB0aGlzLnRoZW1lIHx8ICh0aGlzLnNlcnZpY2UuY29uZmlnLnRoZW1lID8gdGhpcy5zZXJ2aWNlLmNvbmZpZy50aGVtZSA6ICdzbm93JylcblxuICAgIHRoaXMuZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50Lmluc2VydEFkamFjZW50SFRNTChcbiAgICAgICdhZnRlcmJlZ2luJyxcbiAgICAgIHRoaXMucHJlc2VydmVXaGl0ZXNwYWNlID8gJzxwcmUgcXVpbGwtdmlldy1lbGVtZW50PjwvcHJlPicgOiAnPGRpdiBxdWlsbC12aWV3LWVsZW1lbnQ+PC9kaXY+J1xuICAgIClcblxuICAgIHRoaXMuZWRpdG9yRWxlbSA9IHRoaXMuZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoXG4gICAgICAnW3F1aWxsLXZpZXctZWxlbWVudF0nXG4gICAgKSBhcyBIVE1MRWxlbWVudFxuXG4gICAgdGhpcy56b25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgIHRoaXMucXVpbGxFZGl0b3IgPSBuZXcgUXVpbGwodGhpcy5lZGl0b3JFbGVtLCB7XG4gICAgICAgIGRlYnVnOiBkZWJ1ZyBhcyBhbnksXG4gICAgICAgIGZvcm1hdHM6IGZvcm1hdHMgYXMgYW55LFxuICAgICAgICBtb2R1bGVzLFxuICAgICAgICByZWFkT25seTogdHJ1ZSxcbiAgICAgICAgc3RyaWN0OiB0aGlzLnN0cmljdCxcbiAgICAgICAgdGhlbWVcbiAgICAgIH0pXG4gICAgfSlcblxuICAgIHRoaXMucmVuZGVyZXIuYWRkQ2xhc3ModGhpcy5lZGl0b3JFbGVtLCAnbmd4LXF1aWxsLXZpZXcnKVxuXG4gICAgaWYgKHRoaXMuY29udGVudCkge1xuICAgICAgdGhpcy52YWx1ZVNldHRlcih0aGlzLnF1aWxsRWRpdG9yLCB0aGlzLmNvbnRlbnQpXG4gICAgfVxuICB9XG59XG4iXX0=