import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { QuillEditorComponent } from './quill-editor.component';
import { QUILL_CONFIG_TOKEN } from './quill-editor.interfaces';
import { QuillViewHTMLComponent } from './quill-view-html.component';
import { QuillViewComponent } from './quill-view.component';
import { QuillService } from './quill.service';
export class QuillModule {
    static forRoot(config) {
        return {
            ngModule: QuillModule,
            providers: [
                {
                    provide: QUILL_CONFIG_TOKEN,
                    useValue: config
                }
            ]
        };
    }
}
QuillModule.decorators = [
    { type: NgModule, args: [{
                declarations: [
                    QuillEditorComponent,
                    QuillViewComponent,
                    QuillViewHTMLComponent
                ],
                exports: [QuillEditorComponent, QuillViewComponent, QuillViewHTMLComponent],
                imports: [CommonModule],
                providers: [QuillService]
            },] }
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVpbGwubW9kdWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vcHJvamVjdHMvbmd4LXF1aWxsL3NyYy9saWIvcXVpbGwubW9kdWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQTtBQUM5QyxPQUFPLEVBQXVCLFFBQVEsRUFBRSxNQUFNLGVBQWUsQ0FBQTtBQUU3RCxPQUFPLEVBQUUsb0JBQW9CLEVBQUUsTUFBTSwwQkFBMEIsQ0FBQTtBQUMvRCxPQUFPLEVBQUUsa0JBQWtCLEVBQWUsTUFBTSwyQkFBMkIsQ0FBQTtBQUMzRSxPQUFPLEVBQUUsc0JBQXNCLEVBQUUsTUFBTSw2QkFBNkIsQ0FBQTtBQUNwRSxPQUFPLEVBQUUsa0JBQWtCLEVBQUUsTUFBTSx3QkFBd0IsQ0FBQTtBQUMzRCxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0saUJBQWlCLENBQUE7QUFZOUMsTUFBTSxPQUFPLFdBQVc7SUFDdEIsTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFvQjtRQUNqQyxPQUFPO1lBQ0wsUUFBUSxFQUFFLFdBQVc7WUFDckIsU0FBUyxFQUFFO2dCQUNUO29CQUNFLE9BQU8sRUFBRSxrQkFBa0I7b0JBQzNCLFFBQVEsRUFBRSxNQUFNO2lCQUNqQjthQUNGO1NBQ0YsQ0FBQTtJQUNILENBQUM7OztZQXJCRixRQUFRLFNBQUM7Z0JBQ1IsWUFBWSxFQUFFO29CQUNaLG9CQUFvQjtvQkFDcEIsa0JBQWtCO29CQUNsQixzQkFBc0I7aUJBQ3ZCO2dCQUNELE9BQU8sRUFBRSxDQUFDLG9CQUFvQixFQUFFLGtCQUFrQixFQUFFLHNCQUFzQixDQUFDO2dCQUMzRSxPQUFPLEVBQUUsQ0FBQyxZQUFZLENBQUM7Z0JBQ3ZCLFNBQVMsRUFBRSxDQUFDLFlBQVksQ0FBQzthQUMxQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbW1vbk1vZHVsZSB9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbidcbmltcG9ydCB7IE1vZHVsZVdpdGhQcm92aWRlcnMsIE5nTW9kdWxlIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSdcblxuaW1wb3J0IHsgUXVpbGxFZGl0b3JDb21wb25lbnQgfSBmcm9tICcuL3F1aWxsLWVkaXRvci5jb21wb25lbnQnXG5pbXBvcnQgeyBRVUlMTF9DT05GSUdfVE9LRU4sIFF1aWxsQ29uZmlnIH0gZnJvbSAnLi9xdWlsbC1lZGl0b3IuaW50ZXJmYWNlcydcbmltcG9ydCB7IFF1aWxsVmlld0hUTUxDb21wb25lbnQgfSBmcm9tICcuL3F1aWxsLXZpZXctaHRtbC5jb21wb25lbnQnXG5pbXBvcnQgeyBRdWlsbFZpZXdDb21wb25lbnQgfSBmcm9tICcuL3F1aWxsLXZpZXcuY29tcG9uZW50J1xuaW1wb3J0IHsgUXVpbGxTZXJ2aWNlIH0gZnJvbSAnLi9xdWlsbC5zZXJ2aWNlJ1xuXG5ATmdNb2R1bGUoe1xuICBkZWNsYXJhdGlvbnM6IFtcbiAgICBRdWlsbEVkaXRvckNvbXBvbmVudCxcbiAgICBRdWlsbFZpZXdDb21wb25lbnQsXG4gICAgUXVpbGxWaWV3SFRNTENvbXBvbmVudFxuICBdLFxuICBleHBvcnRzOiBbUXVpbGxFZGl0b3JDb21wb25lbnQsIFF1aWxsVmlld0NvbXBvbmVudCwgUXVpbGxWaWV3SFRNTENvbXBvbmVudF0sXG4gIGltcG9ydHM6IFtDb21tb25Nb2R1bGVdLFxuICBwcm92aWRlcnM6IFtRdWlsbFNlcnZpY2VdXG59KVxuZXhwb3J0IGNsYXNzIFF1aWxsTW9kdWxlIHtcbiAgc3RhdGljIGZvclJvb3QoY29uZmlnPzogUXVpbGxDb25maWcpOiBNb2R1bGVXaXRoUHJvdmlkZXJzPFF1aWxsTW9kdWxlPiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG5nTW9kdWxlOiBRdWlsbE1vZHVsZSxcbiAgICAgIHByb3ZpZGVyczogW1xuICAgICAgICB7XG4gICAgICAgICAgcHJvdmlkZTogUVVJTExfQ09ORklHX1RPS0VOLFxuICAgICAgICAgIHVzZVZhbHVlOiBjb25maWdcbiAgICAgICAgfVxuICAgICAgXVxuICAgIH1cbiAgfVxufVxuIl19