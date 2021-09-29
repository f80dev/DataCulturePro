import { DomSanitizer } from '@angular/platform-browser';
import { QuillService } from './quill.service';
import { Component, Inject, Input, ViewEncapsulation } from '@angular/core';
export class QuillViewHTMLComponent {
    constructor(sanitizer, service) {
        this.sanitizer = sanitizer;
        this.service = service;
        this.innerHTML = '';
        this.themeClass = 'ql-snow';
        this.content = '';
    }
    ngOnChanges(changes) {
        if (changes.theme) {
            const theme = changes.theme.currentValue || (this.service.config.theme ? this.service.config.theme : 'snow');
            this.themeClass = `ql-${theme} ngx-quill-view-html`;
        }
        else if (!this.theme) {
            const theme = this.service.config.theme ? this.service.config.theme : 'snow';
            this.themeClass = `ql-${theme} ngx-quill-view-html`;
        }
        if (changes.content) {
            this.innerHTML = this.sanitizer.bypassSecurityTrustHtml(changes.content.currentValue);
        }
    }
}
QuillViewHTMLComponent.decorators = [
    { type: Component, args: [{
                encapsulation: ViewEncapsulation.None,
                selector: 'quill-view-html',
                template: `
  <div class="ql-container" [ngClass]="themeClass">
    <div class="ql-editor" [innerHTML]="innerHTML">
    </div>
  </div>
`,
                styles: [`
.ql-container.ngx-quill-view-html {
  border: 0;
}
`]
            },] }
];
QuillViewHTMLComponent.ctorParameters = () => [
    { type: DomSanitizer, decorators: [{ type: Inject, args: [DomSanitizer,] }] },
    { type: QuillService }
];
QuillViewHTMLComponent.propDecorators = {
    content: [{ type: Input }],
    theme: [{ type: Input }]
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVpbGwtdmlldy1odG1sLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Byb2plY3RzL25neC1xdWlsbC9zcmMvbGliL3F1aWxsLXZpZXctaHRtbC5jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFlBQVksRUFBWSxNQUFNLDJCQUEyQixDQUFBO0FBQ2xFLE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQTtBQUU5QyxPQUFPLEVBQ0wsU0FBUyxFQUNULE1BQU0sRUFDTixLQUFLLEVBR0wsaUJBQWlCLEVBQ2xCLE1BQU0sZUFBZSxDQUFBO0FBaUJ0QixNQUFNLE9BQU8sc0JBQXNCO0lBT2pDLFlBQ2dDLFNBQXVCLEVBQzNDLE9BQXFCO1FBREQsY0FBUyxHQUFULFNBQVMsQ0FBYztRQUMzQyxZQUFPLEdBQVAsT0FBTyxDQUFjO1FBUmpDLGNBQVMsR0FBYSxFQUFFLENBQUE7UUFDeEIsZUFBVSxHQUFHLFNBQVMsQ0FBQTtRQUViLFlBQU8sR0FBRyxFQUFFLENBQUE7SUFNbEIsQ0FBQztJQUVKLFdBQVcsQ0FBQyxPQUFzQjtRQUNoQyxJQUFJLE9BQU8sQ0FBQyxLQUFLLEVBQUU7WUFDakIsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxZQUFZLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUE7WUFDNUcsSUFBSSxDQUFDLFVBQVUsR0FBRyxNQUFNLEtBQUssc0JBQXNCLENBQUE7U0FDcEQ7YUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRTtZQUN0QixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFBO1lBQzVFLElBQUksQ0FBQyxVQUFVLEdBQUcsTUFBTSxLQUFLLHNCQUFzQixDQUFBO1NBQ3BEO1FBQ0QsSUFBSSxPQUFPLENBQUMsT0FBTyxFQUFFO1lBQ25CLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyx1QkFBdUIsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFBO1NBQ3RGO0lBQ0gsQ0FBQzs7O1lBdENGLFNBQVMsU0FBQztnQkFDVCxhQUFhLEVBQUUsaUJBQWlCLENBQUMsSUFBSTtnQkFDckMsUUFBUSxFQUFFLGlCQUFpQjtnQkFNM0IsUUFBUSxFQUFFOzs7OztDQUtYO3lCQVZVOzs7O0NBSVY7YUFPQTs7O1lBMUJRLFlBQVksdUJBbUNoQixNQUFNLFNBQUMsWUFBWTtZQWxDZixZQUFZOzs7c0JBOEJsQixLQUFLO29CQUNMLEtBQUsiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBEb21TYW5pdGl6ZXIsIFNhZmVIdG1sIH0gZnJvbSAnQGFuZ3VsYXIvcGxhdGZvcm0tYnJvd3NlcidcbmltcG9ydCB7IFF1aWxsU2VydmljZSB9IGZyb20gJy4vcXVpbGwuc2VydmljZSdcblxuaW1wb3J0IHtcbiAgQ29tcG9uZW50LFxuICBJbmplY3QsXG4gIElucHV0LFxuICBPbkNoYW5nZXMsXG4gIFNpbXBsZUNoYW5nZXMsXG4gIFZpZXdFbmNhcHN1bGF0aW9uXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnXG5cbkBDb21wb25lbnQoe1xuICBlbmNhcHN1bGF0aW9uOiBWaWV3RW5jYXBzdWxhdGlvbi5Ob25lLFxuICBzZWxlY3RvcjogJ3F1aWxsLXZpZXctaHRtbCcsXG4gIHN0eWxlczogW2Bcbi5xbC1jb250YWluZXIubmd4LXF1aWxsLXZpZXctaHRtbCB7XG4gIGJvcmRlcjogMDtcbn1cbmBdLFxuICB0ZW1wbGF0ZTogYFxuICA8ZGl2IGNsYXNzPVwicWwtY29udGFpbmVyXCIgW25nQ2xhc3NdPVwidGhlbWVDbGFzc1wiPlxuICAgIDxkaXYgY2xhc3M9XCJxbC1lZGl0b3JcIiBbaW5uZXJIVE1MXT1cImlubmVySFRNTFwiPlxuICAgIDwvZGl2PlxuICA8L2Rpdj5cbmBcbn0pXG5leHBvcnQgY2xhc3MgUXVpbGxWaWV3SFRNTENvbXBvbmVudCBpbXBsZW1lbnRzIE9uQ2hhbmdlcyB7XG4gIGlubmVySFRNTDogU2FmZUh0bWwgPSAnJ1xuICB0aGVtZUNsYXNzID0gJ3FsLXNub3cnXG5cbiAgQElucHV0KCkgY29udGVudCA9ICcnXG4gIEBJbnB1dCgpIHRoZW1lPzogc3RyaW5nXG5cbiAgY29uc3RydWN0b3IoXG4gICAgQEluamVjdChEb21TYW5pdGl6ZXIpIHByaXZhdGUgc2FuaXRpemVyOiBEb21TYW5pdGl6ZXIsXG4gICAgcHJvdGVjdGVkIHNlcnZpY2U6IFF1aWxsU2VydmljZVxuICApIHt9XG5cbiAgbmdPbkNoYW5nZXMoY2hhbmdlczogU2ltcGxlQ2hhbmdlcykge1xuICAgIGlmIChjaGFuZ2VzLnRoZW1lKSB7XG4gICAgICBjb25zdCB0aGVtZSA9IGNoYW5nZXMudGhlbWUuY3VycmVudFZhbHVlIHx8ICh0aGlzLnNlcnZpY2UuY29uZmlnLnRoZW1lID8gdGhpcy5zZXJ2aWNlLmNvbmZpZy50aGVtZSA6ICdzbm93JylcbiAgICAgIHRoaXMudGhlbWVDbGFzcyA9IGBxbC0ke3RoZW1lfSBuZ3gtcXVpbGwtdmlldy1odG1sYFxuICAgIH0gZWxzZSBpZiAoIXRoaXMudGhlbWUpIHtcbiAgICAgIGNvbnN0IHRoZW1lID0gdGhpcy5zZXJ2aWNlLmNvbmZpZy50aGVtZSA/IHRoaXMuc2VydmljZS5jb25maWcudGhlbWUgOiAnc25vdydcbiAgICAgIHRoaXMudGhlbWVDbGFzcyA9IGBxbC0ke3RoZW1lfSBuZ3gtcXVpbGwtdmlldy1odG1sYFxuICAgIH1cbiAgICBpZiAoY2hhbmdlcy5jb250ZW50KSB7XG4gICAgICB0aGlzLmlubmVySFRNTCA9IHRoaXMuc2FuaXRpemVyLmJ5cGFzc1NlY3VyaXR5VHJ1c3RIdG1sKGNoYW5nZXMuY29udGVudC5jdXJyZW50VmFsdWUpXG4gICAgfVxuICB9XG59XG4iXX0=