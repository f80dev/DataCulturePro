import { __awaiter } from "tslib";
import { DOCUMENT, isPlatformServer } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import { Component, Directive, ElementRef, EventEmitter, forwardRef, Inject, Input, NgZone, Output, PLATFORM_ID, Renderer2, SecurityContext, ViewEncapsulation } from '@angular/core';
import { NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import { defaultModules } from './quill-defaults';
import { getFormat } from './helpers';
import { QuillService } from './quill.service';
// tslint:disable-next-line:directive-class-suffix
export class QuillEditorBase {
    constructor(elementRef, domSanitizer, doc, platformId, renderer, zone, service) {
        this.elementRef = elementRef;
        this.domSanitizer = domSanitizer;
        this.doc = doc;
        this.platformId = platformId;
        this.renderer = renderer;
        this.zone = zone;
        this.service = service;
        this.required = false;
        this.customToolbarPosition = 'top';
        this.sanitize = false;
        this.styles = null;
        this.strict = true;
        this.customOptions = [];
        this.customModules = [];
        this.preserveWhitespace = false;
        this.trimOnValidation = false;
        this.onEditorCreated = new EventEmitter();
        this.onEditorChanged = new EventEmitter();
        this.onContentChanged = new EventEmitter();
        this.onSelectionChanged = new EventEmitter();
        this.onFocus = new EventEmitter();
        this.onBlur = new EventEmitter();
        this.disabled = false; // used to store initial value before ViewInit
        this.valueGetter = (quillEditor, editorElement) => {
            let html = editorElement.querySelector('.ql-editor').innerHTML;
            if (html === '<p><br></p>' || html === '<div><br></div>') {
                html = null;
            }
            let modelValue = html;
            const format = getFormat(this.format, this.service.config.format);
            if (format === 'text') {
                modelValue = quillEditor.getText();
            }
            else if (format === 'object') {
                modelValue = quillEditor.getContents();
            }
            else if (format === 'json') {
                try {
                    modelValue = JSON.stringify(quillEditor.getContents());
                }
                catch (e) {
                    modelValue = quillEditor.getText();
                }
            }
            return modelValue;
        };
        this.valueSetter = (quillEditor, value) => {
            const format = getFormat(this.format, this.service.config.format);
            if (format === 'html') {
                if (this.sanitize) {
                    value = this.domSanitizer.sanitize(SecurityContext.HTML, value);
                }
                return quillEditor.clipboard.convert(value);
            }
            else if (format === 'json') {
                try {
                    return JSON.parse(value);
                }
                catch (e) {
                    return [{ insert: value }];
                }
            }
            return value;
        };
        this.selectionChangeHandler = (range, oldRange, source) => {
            const shouldTriggerOnModelTouched = !range && !!this.onModelTouched;
            // only emit changes when there's any listener
            if (!this.onBlur.observers.length &&
                !this.onFocus.observers.length &&
                !this.onSelectionChanged.observers.length &&
                !shouldTriggerOnModelTouched) {
                return;
            }
            this.zone.run(() => {
                if (range === null) {
                    this.onBlur.emit({
                        editor: this.quillEditor,
                        source
                    });
                }
                else if (oldRange === null) {
                    this.onFocus.emit({
                        editor: this.quillEditor,
                        source
                    });
                }
                this.onSelectionChanged.emit({
                    editor: this.quillEditor,
                    oldRange,
                    range,
                    source
                });
                if (shouldTriggerOnModelTouched) {
                    this.onModelTouched();
                }
            });
        };
        this.textChangeHandler = (delta, oldDelta, source) => {
            // only emit changes emitted by user interactions
            const text = this.quillEditor.getText();
            const content = this.quillEditor.getContents();
            let html = this.editorElem.querySelector('.ql-editor').innerHTML;
            if (html === '<p><br></p>' || html === '<div><br></div>') {
                html = null;
            }
            const trackChanges = this.trackChanges || this.service.config.trackChanges;
            const shouldTriggerOnModelChange = (source === 'user' || trackChanges && trackChanges === 'all') && !!this.onModelChange;
            // only emit changes when there's any listener
            if (!this.onContentChanged.observers.length && !shouldTriggerOnModelChange) {
                return;
            }
            this.zone.run(() => {
                if (shouldTriggerOnModelChange) {
                    this.onModelChange(this.valueGetter(this.quillEditor, this.editorElem));
                }
                this.onContentChanged.emit({
                    content,
                    delta,
                    editor: this.quillEditor,
                    html,
                    oldDelta,
                    source,
                    text
                });
            });
        };
        // tslint:disable-next-line:max-line-length
        this.editorChangeHandler = (event, current, old, source) => {
            // only emit changes when there's any listener
            if (!this.onEditorChanged.observers.length) {
                return;
            }
            // only emit changes emitted by user interactions
            if (event === 'text-change') {
                const text = this.quillEditor.getText();
                const content = this.quillEditor.getContents();
                let html = this.editorElem.querySelector('.ql-editor').innerHTML;
                if (html === '<p><br></p>' || html === '<div><br></div>') {
                    html = null;
                }
                this.zone.run(() => {
                    this.onEditorChanged.emit({
                        content,
                        delta: current,
                        editor: this.quillEditor,
                        event,
                        html,
                        oldDelta: old,
                        source,
                        text
                    });
                });
            }
            else {
                this.onEditorChanged.emit({
                    editor: this.quillEditor,
                    event,
                    oldRange: old,
                    range: current,
                    source
                });
            }
        };
    }
    static normalizeClassNames(classes) {
        const classList = classes.trim().split(' ');
        return classList.reduce((prev, cur) => {
            const trimmed = cur.trim();
            if (trimmed) {
                prev.push(trimmed);
            }
            return prev;
        }, []);
    }
    ngAfterViewInit() {
        return __awaiter(this, void 0, void 0, function* () {
            if (isPlatformServer(this.platformId)) {
                return;
            }
            const Quill = yield this.service.getQuill();
            this.elementRef.nativeElement.insertAdjacentHTML(this.customToolbarPosition === 'top' ? 'beforeend' : 'afterbegin', this.preserveWhitespace ? '<pre quill-editor-element></pre>' : '<div quill-editor-element></div>');
            this.editorElem = this.elementRef.nativeElement.querySelector('[quill-editor-element]');
            const toolbarElem = this.elementRef.nativeElement.querySelector('[quill-editor-toolbar]');
            const modules = Object.assign({}, this.modules || this.service.config.modules);
            if (toolbarElem) {
                modules.toolbar = toolbarElem;
            }
            else if (modules.toolbar === undefined) {
                modules.toolbar = defaultModules.toolbar;
            }
            let placeholder = this.placeholder !== undefined ? this.placeholder : this.service.config.placeholder;
            if (placeholder === undefined) {
                placeholder = 'Insert text here ...';
            }
            if (this.styles) {
                Object.keys(this.styles).forEach((key) => {
                    this.renderer.setStyle(this.editorElem, key, this.styles[key]);
                });
            }
            if (this.classes) {
                this.addClasses(this.classes);
            }
            this.customOptions.forEach((customOption) => {
                const newCustomOption = Quill.import(customOption.import);
                newCustomOption.whitelist = customOption.whitelist;
                Quill.register(newCustomOption, true);
            });
            this.customModules.forEach(({ implementation, path }) => {
                Quill.register(path, implementation);
            });
            let bounds = this.bounds && this.bounds === 'self' ? this.editorElem : this.bounds;
            if (!bounds) {
                bounds = this.service.config.bounds ? this.service.config.bounds : this.doc.body;
            }
            let debug = this.debug;
            if (!debug && debug !== false && this.service.config.debug) {
                debug = this.service.config.debug;
            }
            let readOnly = this.readOnly;
            if (!readOnly && this.readOnly !== false) {
                readOnly = this.service.config.readOnly !== undefined ? this.service.config.readOnly : false;
            }
            let scrollingContainer = this.scrollingContainer;
            if (!scrollingContainer && this.scrollingContainer !== null) {
                scrollingContainer =
                    this.service.config.scrollingContainer === null
                        || this.service.config.scrollingContainer ? this.service.config.scrollingContainer : null;
            }
            let formats = this.formats;
            if (!formats && formats === undefined) {
                formats = this.service.config.formats ? [...this.service.config.formats] : (this.service.config.formats === null ? null : undefined);
            }
            this.zone.runOutsideAngular(() => {
                this.quillEditor = new Quill(this.editorElem, {
                    bounds,
                    debug: debug,
                    formats: formats,
                    modules,
                    placeholder,
                    readOnly,
                    scrollingContainer: scrollingContainer,
                    strict: this.strict,
                    theme: this.theme || (this.service.config.theme ? this.service.config.theme : 'snow')
                });
            });
            if (this.content) {
                const format = getFormat(this.format, this.service.config.format);
                if (format === 'object') {
                    this.quillEditor.setContents(this.content, 'silent');
                }
                else if (format === 'text') {
                    this.quillEditor.setText(this.content, 'silent');
                }
                else if (format === 'json') {
                    try {
                        this.quillEditor.setContents(JSON.parse(this.content), 'silent');
                    }
                    catch (e) {
                        this.quillEditor.setText(this.content, 'silent');
                    }
                }
                else {
                    if (this.sanitize) {
                        this.content = this.domSanitizer.sanitize(SecurityContext.HTML, this.content);
                    }
                    const contents = this.quillEditor.clipboard.convert(this.content);
                    this.quillEditor.setContents(contents, 'silent');
                }
                this.quillEditor.getModule('history').clear();
            }
            // initialize disabled status based on this.disabled as default value
            this.setDisabledState();
            // triggered if selection or text changed
            this.quillEditor.on('editor-change', this.editorChangeHandler);
            // mark model as touched if editor lost focus
            this.quillEditor.on('selection-change', this.selectionChangeHandler);
            // update model if text changes
            this.quillEditor.on('text-change', this.textChangeHandler);
            // trigger created in a timeout to avoid changed models after checked
            // if you are using the editor api in created output to change the editor content
            setTimeout(() => {
                if (this.onValidatorChanged) {
                    this.onValidatorChanged();
                }
                this.onEditorCreated.emit(this.quillEditor);
            });
        });
    }
    ngOnDestroy() {
        if (this.quillEditor) {
            this.quillEditor.off('selection-change', this.selectionChangeHandler);
            this.quillEditor.off('text-change', this.textChangeHandler);
            this.quillEditor.off('editor-change', this.editorChangeHandler);
        }
    }
    ngOnChanges(changes) {
        if (!this.quillEditor) {
            return;
        }
        // tslint:disable:no-string-literal
        if (changes['readOnly']) {
            this.quillEditor.enable(!changes['readOnly'].currentValue);
        }
        if (changes['placeholder']) {
            this.quillEditor.root.dataset.placeholder =
                changes['placeholder'].currentValue;
        }
        if (changes['styles']) {
            const currentStyling = changes['styles'].currentValue;
            const previousStyling = changes['styles'].previousValue;
            if (previousStyling) {
                Object.keys(previousStyling).forEach((key) => {
                    this.renderer.removeStyle(this.editorElem, key);
                });
            }
            if (currentStyling) {
                Object.keys(currentStyling).forEach((key) => {
                    this.renderer.setStyle(this.editorElem, key, this.styles[key]);
                });
            }
        }
        if (changes['classes']) {
            const currentClasses = changes['classes'].currentValue;
            const previousClasses = changes['classes'].previousValue;
            if (previousClasses) {
                this.removeClasses(previousClasses);
            }
            if (currentClasses) {
                this.addClasses(currentClasses);
            }
        }
        // tslint:enable:no-string-literal
    }
    addClasses(classList) {
        QuillEditorBase.normalizeClassNames(classList).forEach((c) => {
            this.renderer.addClass(this.editorElem, c);
        });
    }
    removeClasses(classList) {
        QuillEditorBase.normalizeClassNames(classList).forEach((c) => {
            this.renderer.removeClass(this.editorElem, c);
        });
    }
    writeValue(currentValue) {
        this.content = currentValue;
        const format = getFormat(this.format, this.service.config.format);
        if (this.quillEditor) {
            if (currentValue) {
                if (format === 'text') {
                    this.quillEditor.setText(currentValue);
                }
                else {
                    this.quillEditor.setContents(this.valueSetter(this.quillEditor, this.content));
                }
                return;
            }
            this.quillEditor.setText('');
        }
    }
    setDisabledState(isDisabled = this.disabled) {
        // store initial value to set appropriate disabled status after ViewInit
        this.disabled = isDisabled;
        if (this.quillEditor) {
            if (isDisabled) {
                this.quillEditor.disable();
                this.renderer.setAttribute(this.elementRef.nativeElement, 'disabled', 'disabled');
            }
            else {
                if (!this.readOnly) {
                    this.quillEditor.enable();
                }
                this.renderer.removeAttribute(this.elementRef.nativeElement, 'disabled');
            }
        }
    }
    registerOnChange(fn) {
        this.onModelChange = fn;
    }
    registerOnTouched(fn) {
        this.onModelTouched = fn;
    }
    registerOnValidatorChange(fn) {
        this.onValidatorChanged = fn;
    }
    validate() {
        if (!this.quillEditor) {
            return null;
        }
        const err = {};
        let valid = true;
        const text = this.quillEditor.getText();
        // trim text if wanted + handle special case that an empty editor contains a new line
        const textLength = this.trimOnValidation ? text.trim().length : (text.length === 1 && text.trim().length === 0 ? 0 : text.length - 1);
        if (this.minLength && textLength && textLength < this.minLength) {
            err.minLengthError = {
                given: textLength,
                minLength: this.minLength
            };
            valid = false;
        }
        if (this.maxLength && textLength > this.maxLength) {
            err.maxLengthError = {
                given: textLength,
                maxLength: this.maxLength
            };
            valid = false;
        }
        if (this.required && !textLength) {
            err.requiredError = {
                empty: true
            };
            valid = false;
        }
        return valid ? null : err;
    }
}
QuillEditorBase.decorators = [
    { type: Directive }
];
QuillEditorBase.ctorParameters = () => [
    { type: ElementRef },
    { type: DomSanitizer },
    { type: undefined, decorators: [{ type: Inject, args: [DOCUMENT,] }] },
    { type: undefined, decorators: [{ type: Inject, args: [PLATFORM_ID,] }] },
    { type: Renderer2 },
    { type: NgZone },
    { type: QuillService }
];
QuillEditorBase.propDecorators = {
    format: [{ type: Input }],
    theme: [{ type: Input }],
    modules: [{ type: Input }],
    debug: [{ type: Input }],
    readOnly: [{ type: Input }],
    placeholder: [{ type: Input }],
    maxLength: [{ type: Input }],
    minLength: [{ type: Input }],
    required: [{ type: Input }],
    formats: [{ type: Input }],
    customToolbarPosition: [{ type: Input }],
    sanitize: [{ type: Input }],
    styles: [{ type: Input }],
    strict: [{ type: Input }],
    scrollingContainer: [{ type: Input }],
    bounds: [{ type: Input }],
    customOptions: [{ type: Input }],
    customModules: [{ type: Input }],
    trackChanges: [{ type: Input }],
    preserveWhitespace: [{ type: Input }],
    classes: [{ type: Input }],
    trimOnValidation: [{ type: Input }],
    onEditorCreated: [{ type: Output }],
    onEditorChanged: [{ type: Output }],
    onContentChanged: [{ type: Output }],
    onSelectionChanged: [{ type: Output }],
    onFocus: [{ type: Output }],
    onBlur: [{ type: Output }],
    valueGetter: [{ type: Input }],
    valueSetter: [{ type: Input }]
};
export class QuillEditorComponent extends QuillEditorBase {
    constructor(elementRef, domSanitizer, doc, platformId, renderer, zone, service) {
        super(elementRef, domSanitizer, doc, platformId, renderer, zone, service);
    }
}
QuillEditorComponent.decorators = [
    { type: Component, args: [{
                encapsulation: ViewEncapsulation.None,
                providers: [
                    {
                        multi: true,
                        provide: NG_VALUE_ACCESSOR,
                        // eslint-disable-next-line @typescript-eslint/no-use-before-define
                        useExisting: forwardRef(() => QuillEditorComponent)
                    },
                    {
                        multi: true,
                        provide: NG_VALIDATORS,
                        // eslint-disable-next-line @typescript-eslint/no-use-before-define
                        useExisting: forwardRef(() => QuillEditorComponent)
                    }
                ],
                selector: 'quill-editor',
                template: `
  <ng-content select="[quill-editor-toolbar]"></ng-content>
`
            },] }
];
QuillEditorComponent.ctorParameters = () => [
    { type: ElementRef, decorators: [{ type: Inject, args: [ElementRef,] }] },
    { type: DomSanitizer, decorators: [{ type: Inject, args: [DomSanitizer,] }] },
    { type: undefined, decorators: [{ type: Inject, args: [DOCUMENT,] }] },
    { type: undefined, decorators: [{ type: Inject, args: [PLATFORM_ID,] }] },
    { type: Renderer2, decorators: [{ type: Inject, args: [Renderer2,] }] },
    { type: NgZone, decorators: [{ type: Inject, args: [NgZone,] }] },
    { type: QuillService, decorators: [{ type: Inject, args: [QuillService,] }] }
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVpbGwtZWRpdG9yLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Byb2plY3RzL25neC1xdWlsbC9zcmMvbGliL3F1aWxsLWVkaXRvci5jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sRUFBQyxRQUFRLEVBQUUsZ0JBQWdCLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQTtBQUMxRCxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sMkJBQTJCLENBQUE7QUFNdEQsT0FBTyxFQUVMLFNBQVMsRUFDVCxTQUFTLEVBQ1QsVUFBVSxFQUNWLFlBQVksRUFDWixVQUFVLEVBQ1YsTUFBTSxFQUNOLEtBQUssRUFDTCxNQUFNLEVBR04sTUFBTSxFQUNOLFdBQVcsRUFDWCxTQUFTLEVBQ1QsZUFBZSxFQUVmLGlCQUFpQixFQUNsQixNQUFNLGVBQWUsQ0FBQTtBQUV0QixPQUFPLEVBQXVCLGFBQWEsRUFBRSxpQkFBaUIsRUFBWSxNQUFNLGdCQUFnQixDQUFBO0FBQ2hHLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQTtBQUUvQyxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sV0FBVyxDQUFBO0FBQ25DLE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQTtBQXNDOUMsa0RBQWtEO0FBQ2xELE1BQU0sT0FBZ0IsZUFBZTtJQTBDbkMsWUFDUyxVQUFzQixFQUNuQixZQUEwQixFQUNSLEdBQVEsRUFDTCxVQUFlLEVBQ3BDLFFBQW1CLEVBQ25CLElBQVksRUFDWixPQUFxQjtRQU54QixlQUFVLEdBQVYsVUFBVSxDQUFZO1FBQ25CLGlCQUFZLEdBQVosWUFBWSxDQUFjO1FBQ1IsUUFBRyxHQUFILEdBQUcsQ0FBSztRQUNMLGVBQVUsR0FBVixVQUFVLENBQUs7UUFDcEMsYUFBUSxHQUFSLFFBQVEsQ0FBVztRQUNuQixTQUFJLEdBQUosSUFBSSxDQUFRO1FBQ1osWUFBTyxHQUFQLE9BQU8sQ0FBYztRQW5DeEIsYUFBUSxHQUFHLEtBQUssQ0FBQTtRQUVoQiwwQkFBcUIsR0FBcUIsS0FBSyxDQUFBO1FBQy9DLGFBQVEsR0FBRyxLQUFLLENBQUE7UUFDaEIsV0FBTSxHQUFRLElBQUksQ0FBQTtRQUNsQixXQUFNLEdBQUcsSUFBSSxDQUFBO1FBR2Isa0JBQWEsR0FBbUIsRUFBRSxDQUFBO1FBQ2xDLGtCQUFhLEdBQW1CLEVBQUUsQ0FBQTtRQUVsQyx1QkFBa0IsR0FBRyxLQUFLLENBQUE7UUFFMUIscUJBQWdCLEdBQUcsS0FBSyxDQUFBO1FBRXZCLG9CQUFlLEdBQXNCLElBQUksWUFBWSxFQUFFLENBQUE7UUFDdkQsb0JBQWUsR0FBOEQsSUFBSSxZQUFZLEVBQUUsQ0FBQTtRQUMvRixxQkFBZ0IsR0FBZ0MsSUFBSSxZQUFZLEVBQUUsQ0FBQTtRQUNsRSx1QkFBa0IsR0FBa0MsSUFBSSxZQUFZLEVBQUUsQ0FBQTtRQUN0RSxZQUFPLEdBQXdCLElBQUksWUFBWSxFQUFFLENBQUE7UUFDakQsV0FBTSxHQUF1QixJQUFJLFlBQVksRUFBRSxDQUFBO1FBRXpELGFBQVEsR0FBRyxLQUFLLENBQUEsQ0FBQyw4Q0FBOEM7UUE2Qi9ELGdCQUFXLEdBQUcsQ0FBQyxXQUFzQixFQUFFLGFBQTBCLEVBQWlCLEVBQUU7WUFDbEYsSUFBSSxJQUFJLEdBQWtCLGFBQWEsQ0FBQyxhQUFhLENBQUMsWUFBWSxDQUFFLENBQUMsU0FBUyxDQUFBO1lBQzlFLElBQUksSUFBSSxLQUFLLGFBQWEsSUFBSSxJQUFJLEtBQUssaUJBQWlCLEVBQUU7Z0JBQ3hELElBQUksR0FBRyxJQUFJLENBQUE7YUFDWjtZQUNELElBQUksVUFBVSxHQUEwQixJQUFJLENBQUE7WUFDNUMsTUFBTSxNQUFNLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUE7WUFFakUsSUFBSSxNQUFNLEtBQUssTUFBTSxFQUFFO2dCQUNyQixVQUFVLEdBQUcsV0FBVyxDQUFDLE9BQU8sRUFBRSxDQUFBO2FBQ25DO2lCQUFNLElBQUksTUFBTSxLQUFLLFFBQVEsRUFBRTtnQkFDOUIsVUFBVSxHQUFHLFdBQVcsQ0FBQyxXQUFXLEVBQUUsQ0FBQTthQUN2QztpQkFBTSxJQUFJLE1BQU0sS0FBSyxNQUFNLEVBQUU7Z0JBQzVCLElBQUk7b0JBQ0YsVUFBVSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUE7aUJBQ3ZEO2dCQUFDLE9BQU8sQ0FBQyxFQUFFO29CQUNWLFVBQVUsR0FBRyxXQUFXLENBQUMsT0FBTyxFQUFFLENBQUE7aUJBQ25DO2FBQ0Y7WUFFRCxPQUFPLFVBQVUsQ0FBQTtRQUNuQixDQUFDLENBQUE7UUFHRCxnQkFBVyxHQUFHLENBQUMsV0FBc0IsRUFBRSxLQUFVLEVBQU8sRUFBRTtZQUN4RCxNQUFNLE1BQU0sR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQTtZQUNqRSxJQUFJLE1BQU0sS0FBSyxNQUFNLEVBQUU7Z0JBQ3JCLElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRTtvQkFDakIsS0FBSyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUE7aUJBQ2hFO2dCQUNELE9BQU8sV0FBVyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUE7YUFDNUM7aUJBQU0sSUFBSSxNQUFNLEtBQUssTUFBTSxFQUFFO2dCQUM1QixJQUFJO29CQUNGLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQTtpQkFDekI7Z0JBQUMsT0FBTyxDQUFDLEVBQUU7b0JBQ1YsT0FBTyxDQUFDLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUE7aUJBQzNCO2FBQ0Y7WUFFRCxPQUFPLEtBQUssQ0FBQTtRQUNkLENBQUMsQ0FBQTtRQXFKRCwyQkFBc0IsR0FBRyxDQUFDLEtBQW1CLEVBQUUsUUFBc0IsRUFBRSxNQUFjLEVBQUUsRUFBRTtZQUN2RixNQUFNLDJCQUEyQixHQUFHLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFBO1lBRW5FLDhDQUE4QztZQUM5QyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTTtnQkFDN0IsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxNQUFNO2dCQUM5QixDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxTQUFTLENBQUMsTUFBTTtnQkFDekMsQ0FBQywyQkFBMkIsRUFBRTtnQkFDaEMsT0FBTTthQUNQO1lBRUQsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFO2dCQUNqQixJQUFJLEtBQUssS0FBSyxJQUFJLEVBQUU7b0JBQ2xCLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDO3dCQUNmLE1BQU0sRUFBRSxJQUFJLENBQUMsV0FBVzt3QkFDeEIsTUFBTTtxQkFDUCxDQUFDLENBQUE7aUJBQ0g7cUJBQU0sSUFBSSxRQUFRLEtBQUssSUFBSSxFQUFFO29CQUM1QixJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQzt3QkFDaEIsTUFBTSxFQUFFLElBQUksQ0FBQyxXQUFXO3dCQUN4QixNQUFNO3FCQUNQLENBQUMsQ0FBQTtpQkFDSDtnQkFFRCxJQUFJLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDO29CQUMzQixNQUFNLEVBQUUsSUFBSSxDQUFDLFdBQVc7b0JBQ3hCLFFBQVE7b0JBQ1IsS0FBSztvQkFDTCxNQUFNO2lCQUNQLENBQUMsQ0FBQTtnQkFFRixJQUFJLDJCQUEyQixFQUFFO29CQUMvQixJQUFJLENBQUMsY0FBYyxFQUFFLENBQUE7aUJBQ3RCO1lBQ0gsQ0FBQyxDQUFDLENBQUE7UUFDSixDQUFDLENBQUE7UUFFRCxzQkFBaUIsR0FBRyxDQUFDLEtBQVksRUFBRSxRQUFlLEVBQUUsTUFBYyxFQUFRLEVBQUU7WUFDMUUsaURBQWlEO1lBQ2pELE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLENBQUE7WUFDdkMsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtZQUU5QyxJQUFJLElBQUksR0FBa0IsSUFBSSxDQUFDLFVBQVcsQ0FBQyxhQUFhLENBQUMsWUFBWSxDQUFFLENBQUMsU0FBUyxDQUFBO1lBQ2pGLElBQUksSUFBSSxLQUFLLGFBQWEsSUFBSSxJQUFJLEtBQUssaUJBQWlCLEVBQUU7Z0JBQ3hELElBQUksR0FBRyxJQUFJLENBQUE7YUFDWjtZQUVELE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxZQUFZLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFBO1lBQzFFLE1BQU0sMEJBQTBCLEdBQUcsQ0FBQyxNQUFNLEtBQUssTUFBTSxJQUFJLFlBQVksSUFBSSxZQUFZLEtBQUssS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUE7WUFFeEgsOENBQThDO1lBQzlDLElBQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxDQUFDLE1BQU0sSUFBSSxDQUFDLDBCQUEwQixFQUFFO2dCQUMxRSxPQUFNO2FBQ1A7WUFFRCxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUU7Z0JBQ2pCLElBQUksMEJBQTBCLEVBQUU7b0JBQzlCLElBQUksQ0FBQyxhQUFhLENBQ2hCLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsVUFBVyxDQUFDLENBQ3JELENBQUE7aUJBQ0Y7Z0JBRUQsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQztvQkFDekIsT0FBTztvQkFDUCxLQUFLO29CQUNMLE1BQU0sRUFBRSxJQUFJLENBQUMsV0FBVztvQkFDeEIsSUFBSTtvQkFDSixRQUFRO29CQUNSLE1BQU07b0JBQ04sSUFBSTtpQkFDTCxDQUFDLENBQUE7WUFDSixDQUFDLENBQUMsQ0FBQTtRQUNKLENBQUMsQ0FBQTtRQUVELDJDQUEyQztRQUMzQyx3QkFBbUIsR0FBRyxDQUFDLEtBQXlDLEVBQUUsT0FBMkIsRUFBRSxHQUF1QixFQUFFLE1BQWMsRUFBUSxFQUFFO1lBQzlJLDhDQUE4QztZQUM5QyxJQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFO2dCQUMxQyxPQUFNO2FBQ1A7WUFFRCxpREFBaUQ7WUFDakQsSUFBSSxLQUFLLEtBQUssYUFBYSxFQUFFO2dCQUMzQixNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRSxDQUFBO2dCQUN2QyxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLFdBQVcsRUFBRSxDQUFBO2dCQUU5QyxJQUFJLElBQUksR0FBa0IsSUFBSSxDQUFDLFVBQVcsQ0FBQyxhQUFhLENBQUMsWUFBWSxDQUFFLENBQUMsU0FBUyxDQUFBO2dCQUNqRixJQUFJLElBQUksS0FBSyxhQUFhLElBQUksSUFBSSxLQUFLLGlCQUFpQixFQUFFO29CQUN4RCxJQUFJLEdBQUcsSUFBSSxDQUFBO2lCQUNaO2dCQUVELElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRTtvQkFDakIsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUM7d0JBQ3hCLE9BQU87d0JBQ1AsS0FBSyxFQUFFLE9BQU87d0JBQ2QsTUFBTSxFQUFFLElBQUksQ0FBQyxXQUFXO3dCQUN4QixLQUFLO3dCQUNMLElBQUk7d0JBQ0osUUFBUSxFQUFFLEdBQUc7d0JBQ2IsTUFBTTt3QkFDTixJQUFJO3FCQUNMLENBQUMsQ0FBQTtnQkFDSixDQUFDLENBQUMsQ0FBQTthQUNIO2lCQUFNO2dCQUNMLElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDO29CQUN4QixNQUFNLEVBQUUsSUFBSSxDQUFDLFdBQVc7b0JBQ3hCLEtBQUs7b0JBQ0wsUUFBUSxFQUFFLEdBQUc7b0JBQ2IsS0FBSyxFQUFFLE9BQU87b0JBQ2QsTUFBTTtpQkFDUCxDQUFDLENBQUE7YUFDSDtRQUNILENBQUMsQ0FBQTtJQTVURSxDQUFDO0lBRUosTUFBTSxDQUFDLG1CQUFtQixDQUFDLE9BQWU7UUFDeEMsTUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQTtRQUMzQyxPQUFPLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFjLEVBQUUsR0FBVyxFQUFFLEVBQUU7WUFDdEQsTUFBTSxPQUFPLEdBQUcsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFBO1lBQzFCLElBQUksT0FBTyxFQUFFO2dCQUNYLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUE7YUFDbkI7WUFFRCxPQUFPLElBQUksQ0FBQTtRQUNiLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQTtJQUNSLENBQUM7SUE2Q0ssZUFBZTs7WUFDbkIsSUFBSSxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEVBQUU7Z0JBQ3JDLE9BQU07YUFDUDtZQUVELE1BQU0sS0FBSyxHQUFHLE1BQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQTtZQUUzQyxJQUFJLENBQUMsVUFBVSxDQUFDLGFBQWEsQ0FBQyxrQkFBa0IsQ0FDOUMsSUFBSSxDQUFDLHFCQUFxQixLQUFLLEtBQUssQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxZQUFZLEVBQ2pFLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsa0NBQWtDLENBQUMsQ0FBQyxDQUFDLGtDQUFrQyxDQUNsRyxDQUFBO1lBRUQsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLGFBQWEsQ0FBQyxhQUFhLENBQzNELHdCQUF3QixDQUN6QixDQUFBO1lBRUQsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxhQUFhLENBQUMsYUFBYSxDQUM3RCx3QkFBd0IsQ0FDekIsQ0FBQTtZQUNELE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxPQUFPLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUE7WUFFOUUsSUFBSSxXQUFXLEVBQUU7Z0JBQ2YsT0FBTyxDQUFDLE9BQU8sR0FBRyxXQUFXLENBQUE7YUFDOUI7aUJBQU0sSUFBSSxPQUFPLENBQUMsT0FBTyxLQUFLLFNBQVMsRUFBRTtnQkFDeEMsT0FBTyxDQUFDLE9BQU8sR0FBRyxjQUFjLENBQUMsT0FBTyxDQUFBO2FBQ3pDO1lBRUQsSUFBSSxXQUFXLEdBQUcsSUFBSSxDQUFDLFdBQVcsS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQTtZQUNyRyxJQUFJLFdBQVcsS0FBSyxTQUFTLEVBQUU7Z0JBQzdCLFdBQVcsR0FBRyxzQkFBc0IsQ0FBQTthQUNyQztZQUVELElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRTtnQkFDZixNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxHQUFXLEVBQUUsRUFBRTtvQkFDL0MsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFBO2dCQUNoRSxDQUFDLENBQUMsQ0FBQTthQUNIO1lBRUQsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFO2dCQUNoQixJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQTthQUM5QjtZQUVELElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUMsWUFBWSxFQUFFLEVBQUU7Z0JBQzFDLE1BQU0sZUFBZSxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFBO2dCQUN6RCxlQUFlLENBQUMsU0FBUyxHQUFHLFlBQVksQ0FBQyxTQUFTLENBQUE7Z0JBQ2xELEtBQUssQ0FBQyxRQUFRLENBQUMsZUFBZSxFQUFFLElBQUksQ0FBQyxDQUFBO1lBQ3ZDLENBQUMsQ0FBQyxDQUFBO1lBRUYsSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFDLGNBQWMsRUFBRSxJQUFJLEVBQUMsRUFBRSxFQUFFO2dCQUNwRCxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxjQUFjLENBQUMsQ0FBQTtZQUN0QyxDQUFDLENBQUMsQ0FBQTtZQUVGLElBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLE1BQU0sS0FBSyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUE7WUFDbEYsSUFBSSxDQUFDLE1BQU0sRUFBRTtnQkFDWCxNQUFNLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFBO2FBQ2pGO1lBRUQsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQTtZQUN0QixJQUFJLENBQUMsS0FBSyxJQUFJLEtBQUssS0FBSyxLQUFLLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFO2dCQUMxRCxLQUFLLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFBO2FBQ2xDO1lBRUQsSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQTtZQUM1QixJQUFJLENBQUMsUUFBUSxJQUFJLElBQUksQ0FBQyxRQUFRLEtBQUssS0FBSyxFQUFFO2dCQUN4QyxRQUFRLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsUUFBUSxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUE7YUFDN0Y7WUFFRCxJQUFJLGtCQUFrQixHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQTtZQUNoRCxJQUFJLENBQUMsa0JBQWtCLElBQUksSUFBSSxDQUFDLGtCQUFrQixLQUFLLElBQUksRUFBRTtnQkFDM0Qsa0JBQWtCO29CQUNoQixJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxrQkFBa0IsS0FBSyxJQUFJOzJCQUMxQyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQTthQUM5RjtZQUVELElBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUE7WUFDMUIsSUFBSSxDQUFDLE9BQU8sSUFBSSxPQUFPLEtBQUssU0FBUyxFQUFFO2dCQUNyQyxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsT0FBTyxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQTthQUNySTtZQUVELElBQUksQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsR0FBRyxFQUFFO2dCQUMvQixJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUU7b0JBQzVDLE1BQU07b0JBQ04sS0FBSyxFQUFFLEtBQVk7b0JBQ25CLE9BQU8sRUFBRSxPQUFjO29CQUN2QixPQUFPO29CQUNQLFdBQVc7b0JBQ1gsUUFBUTtvQkFDUixrQkFBa0IsRUFBRSxrQkFBeUI7b0JBQzdDLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTTtvQkFDbkIsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDO2lCQUN0RixDQUFDLENBQUE7WUFDSixDQUFDLENBQUMsQ0FBQTtZQUVGLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRTtnQkFDaEIsTUFBTSxNQUFNLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUE7Z0JBQ2pFLElBQUksTUFBTSxLQUFLLFFBQVEsRUFBRTtvQkFDdkIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQTtpQkFDckQ7cUJBQU0sSUFBSSxNQUFNLEtBQUssTUFBTSxFQUFFO29CQUM1QixJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFBO2lCQUNqRDtxQkFBTSxJQUFJLE1BQU0sS0FBSyxNQUFNLEVBQUU7b0JBQzVCLElBQUk7d0JBQ0YsSUFBSSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUE7cUJBQ2pFO29CQUFDLE9BQU8sQ0FBQyxFQUFFO3dCQUNWLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUE7cUJBQ2pEO2lCQUNGO3FCQUFNO29CQUNMLElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRTt3QkFDakIsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQTtxQkFDOUU7b0JBQ0QsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQTtvQkFDakUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFBO2lCQUNqRDtnQkFFRCxJQUFJLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQTthQUM5QztZQUVELHFFQUFxRTtZQUNyRSxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQTtZQUV2Qix5Q0FBeUM7WUFDekMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQ2pCLGVBQWUsRUFDZixJQUFJLENBQUMsbUJBQW1CLENBQ3pCLENBQUE7WUFFRCw2Q0FBNkM7WUFDN0MsSUFBSSxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQ2pCLGtCQUFrQixFQUNsQixJQUFJLENBQUMsc0JBQXNCLENBQzVCLENBQUE7WUFFRCwrQkFBK0I7WUFDL0IsSUFBSSxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQ2pCLGFBQWEsRUFDYixJQUFJLENBQUMsaUJBQWlCLENBQ3ZCLENBQUE7WUFFRCxxRUFBcUU7WUFDckUsaUZBQWlGO1lBQ2pGLFVBQVUsQ0FBQyxHQUFHLEVBQUU7Z0JBQ2QsSUFBSSxJQUFJLENBQUMsa0JBQWtCLEVBQUU7b0JBQzNCLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFBO2lCQUMxQjtnQkFDRCxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUE7WUFDN0MsQ0FBQyxDQUFDLENBQUE7UUFDSixDQUFDO0tBQUE7SUFvSEQsV0FBVztRQUNULElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRTtZQUNwQixJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsRUFBRSxJQUFJLENBQUMsc0JBQXNCLENBQUMsQ0FBQTtZQUNyRSxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUE7WUFDM0QsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsZUFBZSxFQUFFLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxDQUFBO1NBQ2hFO0lBQ0gsQ0FBQztJQUVELFdBQVcsQ0FBQyxPQUFzQjtRQUNoQyxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRTtZQUNyQixPQUFNO1NBQ1A7UUFDRCxtQ0FBbUM7UUFDbkMsSUFBSSxPQUFPLENBQUMsVUFBVSxDQUFDLEVBQUU7WUFDdkIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUE7U0FDM0Q7UUFDRCxJQUFJLE9BQU8sQ0FBQyxhQUFhLENBQUMsRUFBRTtZQUMxQixJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVztnQkFDdkMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxDQUFDLFlBQVksQ0FBQTtTQUN0QztRQUNELElBQUksT0FBTyxDQUFDLFFBQVEsQ0FBQyxFQUFFO1lBQ3JCLE1BQU0sY0FBYyxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxZQUFZLENBQUE7WUFDckQsTUFBTSxlQUFlLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLGFBQWEsQ0FBQTtZQUV2RCxJQUFJLGVBQWUsRUFBRTtnQkFDbkIsTUFBTSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxHQUFXLEVBQUUsRUFBRTtvQkFDbkQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxHQUFHLENBQUMsQ0FBQTtnQkFDakQsQ0FBQyxDQUFDLENBQUE7YUFDSDtZQUNELElBQUksY0FBYyxFQUFFO2dCQUNsQixNQUFNLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQVcsRUFBRSxFQUFFO29CQUNsRCxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUE7Z0JBQ2hFLENBQUMsQ0FBQyxDQUFBO2FBQ0g7U0FDRjtRQUNELElBQUksT0FBTyxDQUFDLFNBQVMsQ0FBQyxFQUFFO1lBQ3RCLE1BQU0sY0FBYyxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxZQUFZLENBQUE7WUFDdEQsTUFBTSxlQUFlLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLGFBQWEsQ0FBQTtZQUV4RCxJQUFJLGVBQWUsRUFBRTtnQkFDbkIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxlQUFlLENBQUMsQ0FBQTthQUNwQztZQUVELElBQUksY0FBYyxFQUFFO2dCQUNsQixJQUFJLENBQUMsVUFBVSxDQUFDLGNBQWMsQ0FBQyxDQUFBO2FBQ2hDO1NBQ0Y7UUFDRCxrQ0FBa0M7SUFDcEMsQ0FBQztJQUVELFVBQVUsQ0FBQyxTQUFpQjtRQUMxQixlQUFlLENBQUMsbUJBQW1CLENBQUMsU0FBUyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBUyxFQUFFLEVBQUU7WUFDbkUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBQTtRQUM1QyxDQUFDLENBQUMsQ0FBQTtJQUNKLENBQUM7SUFFRCxhQUFhLENBQUMsU0FBaUI7UUFDN0IsZUFBZSxDQUFDLG1CQUFtQixDQUFDLFNBQVMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQVMsRUFBRSxFQUFFO1lBQ25FLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUE7UUFDL0MsQ0FBQyxDQUFDLENBQUE7SUFDSixDQUFDO0lBRUQsVUFBVSxDQUFDLFlBQWlCO1FBQzFCLElBQUksQ0FBQyxPQUFPLEdBQUcsWUFBWSxDQUFBO1FBQzNCLE1BQU0sTUFBTSxHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFBO1FBRWpFLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRTtZQUNwQixJQUFJLFlBQVksRUFBRTtnQkFDaEIsSUFBSSxNQUFNLEtBQUssTUFBTSxFQUFFO29CQUNyQixJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQTtpQkFDdkM7cUJBQU07b0JBQ0wsSUFBSSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQzFCLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQ2pELENBQUE7aUJBQ0Y7Z0JBQ0QsT0FBTTthQUNQO1lBQ0QsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUE7U0FDN0I7SUFDSCxDQUFDO0lBRUQsZ0JBQWdCLENBQUMsYUFBc0IsSUFBSSxDQUFDLFFBQVE7UUFDbEQsd0VBQXdFO1FBQ3hFLElBQUksQ0FBQyxRQUFRLEdBQUcsVUFBVSxDQUFBO1FBQzFCLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRTtZQUNwQixJQUFJLFVBQVUsRUFBRTtnQkFDZCxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRSxDQUFBO2dCQUMxQixJQUFJLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLGFBQWEsRUFBRSxVQUFVLEVBQUUsVUFBVSxDQUFDLENBQUE7YUFDbEY7aUJBQU07Z0JBQ0wsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUU7b0JBQ2xCLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLENBQUE7aUJBQzFCO2dCQUNELElBQUksQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsYUFBYSxFQUFFLFVBQVUsQ0FBQyxDQUFBO2FBQ3pFO1NBQ0Y7SUFDSCxDQUFDO0lBRUQsZ0JBQWdCLENBQUMsRUFBNkI7UUFDNUMsSUFBSSxDQUFDLGFBQWEsR0FBRyxFQUFFLENBQUE7SUFDekIsQ0FBQztJQUVELGlCQUFpQixDQUFDLEVBQWM7UUFDOUIsSUFBSSxDQUFDLGNBQWMsR0FBRyxFQUFFLENBQUE7SUFDMUIsQ0FBQztJQUVELHlCQUF5QixDQUFDLEVBQWM7UUFDdEMsSUFBSSxDQUFDLGtCQUFrQixHQUFHLEVBQUUsQ0FBQTtJQUM5QixDQUFDO0lBRUQsUUFBUTtRQUNOLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFO1lBQ3JCLE9BQU8sSUFBSSxDQUFBO1NBQ1o7UUFFRCxNQUFNLEdBQUcsR0FVTCxFQUFFLENBQUE7UUFDTixJQUFJLEtBQUssR0FBRyxJQUFJLENBQUE7UUFFaEIsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQTtRQUN2QyxxRkFBcUY7UUFDckYsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxJQUFJLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUE7UUFFckksSUFBSSxJQUFJLENBQUMsU0FBUyxJQUFJLFVBQVUsSUFBSSxVQUFVLEdBQUcsSUFBSSxDQUFDLFNBQVMsRUFBRTtZQUMvRCxHQUFHLENBQUMsY0FBYyxHQUFHO2dCQUNuQixLQUFLLEVBQUUsVUFBVTtnQkFDakIsU0FBUyxFQUFFLElBQUksQ0FBQyxTQUFTO2FBQzFCLENBQUE7WUFFRCxLQUFLLEdBQUcsS0FBSyxDQUFBO1NBQ2Q7UUFFRCxJQUFJLElBQUksQ0FBQyxTQUFTLElBQUksVUFBVSxHQUFHLElBQUksQ0FBQyxTQUFTLEVBQUU7WUFDakQsR0FBRyxDQUFDLGNBQWMsR0FBRztnQkFDbkIsS0FBSyxFQUFFLFVBQVU7Z0JBQ2pCLFNBQVMsRUFBRSxJQUFJLENBQUMsU0FBUzthQUMxQixDQUFBO1lBRUQsS0FBSyxHQUFHLEtBQUssQ0FBQTtTQUNkO1FBRUQsSUFBSSxJQUFJLENBQUMsUUFBUSxJQUFJLENBQUMsVUFBVSxFQUFFO1lBQ2hDLEdBQUcsQ0FBQyxhQUFhLEdBQUc7Z0JBQ2xCLEtBQUssRUFBRSxJQUFJO2FBQ1osQ0FBQTtZQUVELEtBQUssR0FBRyxLQUFLLENBQUE7U0FDZDtRQUVELE9BQU8sS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQTtJQUMzQixDQUFDOzs7WUFoaEJGLFNBQVM7OztZQXpEUixVQUFVO1lBVkosWUFBWTs0Q0FrSGYsTUFBTSxTQUFDLFFBQVE7NENBQ2YsTUFBTSxTQUFDLFdBQVc7WUEvRnJCLFNBQVM7WUFMVCxNQUFNO1lBZUMsWUFBWTs7O3FCQTZDbEIsS0FBSztvQkFDTCxLQUFLO3NCQUNMLEtBQUs7b0JBQ0wsS0FBSzt1QkFDTCxLQUFLOzBCQUNMLEtBQUs7d0JBQ0wsS0FBSzt3QkFDTCxLQUFLO3VCQUNMLEtBQUs7c0JBQ0wsS0FBSztvQ0FDTCxLQUFLO3VCQUNMLEtBQUs7cUJBQ0wsS0FBSztxQkFDTCxLQUFLO2lDQUNMLEtBQUs7cUJBQ0wsS0FBSzs0QkFDTCxLQUFLOzRCQUNMLEtBQUs7MkJBQ0wsS0FBSztpQ0FDTCxLQUFLO3NCQUNMLEtBQUs7K0JBQ0wsS0FBSzs4QkFFTCxNQUFNOzhCQUNOLE1BQU07K0JBQ04sTUFBTTtpQ0FDTixNQUFNO3NCQUNOLE1BQU07cUJBQ04sTUFBTTswQkE4Qk4sS0FBSzswQkF3QkwsS0FBSzs7QUE4Y1IsTUFBTSxPQUFPLG9CQUFxQixTQUFRLGVBQWU7SUFFdkQsWUFDc0IsVUFBc0IsRUFDcEIsWUFBMEIsRUFDOUIsR0FBUSxFQUNMLFVBQWUsRUFDakIsUUFBbUIsRUFDdEIsSUFBWSxFQUNOLE9BQXFCO1FBRTNDLEtBQUssQ0FDSCxVQUFVLEVBQ1YsWUFBWSxFQUNaLEdBQUcsRUFDSCxVQUFVLEVBQ1YsUUFBUSxFQUNSLElBQUksRUFDSixPQUFPLENBQ1IsQ0FBQTtJQUNILENBQUM7OztZQXpDRixTQUFTLFNBQUM7Z0JBQ1QsYUFBYSxFQUFFLGlCQUFpQixDQUFDLElBQUk7Z0JBQ3JDLFNBQVMsRUFBRTtvQkFDVDt3QkFDRSxLQUFLLEVBQUUsSUFBSTt3QkFDWCxPQUFPLEVBQUUsaUJBQWlCO3dCQUMxQixtRUFBbUU7d0JBQ25FLFdBQVcsRUFBRSxVQUFVLENBQUMsR0FBRyxFQUFFLENBQUMsb0JBQW9CLENBQUM7cUJBQ3BEO29CQUNEO3dCQUNFLEtBQUssRUFBRSxJQUFJO3dCQUNYLE9BQU8sRUFBRSxhQUFhO3dCQUN0QixtRUFBbUU7d0JBQ25FLFdBQVcsRUFBRSxVQUFVLENBQUMsR0FBRyxFQUFFLENBQUMsb0JBQW9CLENBQUM7cUJBQ3BEO2lCQUNGO2dCQUNELFFBQVEsRUFBRSxjQUFjO2dCQUN4QixRQUFRLEVBQUU7O0NBRVg7YUFDQTs7O1lBaG1CQyxVQUFVLHVCQW9tQlAsTUFBTSxTQUFDLFVBQVU7WUE5bUJkLFlBQVksdUJBK21CZixNQUFNLFNBQUMsWUFBWTs0Q0FDbkIsTUFBTSxTQUFDLFFBQVE7NENBQ2YsTUFBTSxTQUFDLFdBQVc7WUE3bEJyQixTQUFTLHVCQThsQk4sTUFBTSxTQUFDLFNBQVM7WUFubUJuQixNQUFNLHVCQW9tQkgsTUFBTSxTQUFDLE1BQU07WUFybEJULFlBQVksdUJBc2xCaEIsTUFBTSxTQUFDLFlBQVkiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge0RPQ1VNRU5ULCBpc1BsYXRmb3JtU2VydmVyfSBmcm9tICdAYW5ndWxhci9jb21tb24nXG5pbXBvcnQge0RvbVNhbml0aXplcn0gZnJvbSAnQGFuZ3VsYXIvcGxhdGZvcm0tYnJvd3NlcidcblxuaW1wb3J0IHsgUXVpbGxNb2R1bGVzLCBDdXN0b21PcHRpb24sIEN1c3RvbU1vZHVsZX0gZnJvbSAnLi9xdWlsbC1lZGl0b3IuaW50ZXJmYWNlcydcblxuaW1wb3J0IFF1aWxsVHlwZSwgeyBEZWx0YSB9IGZyb20gJ3F1aWxsJ1xuXG5pbXBvcnQge1xuICBBZnRlclZpZXdJbml0LFxuICBDb21wb25lbnQsXG4gIERpcmVjdGl2ZSxcbiAgRWxlbWVudFJlZixcbiAgRXZlbnRFbWl0dGVyLFxuICBmb3J3YXJkUmVmLFxuICBJbmplY3QsXG4gIElucHV0LFxuICBOZ1pvbmUsXG4gIE9uQ2hhbmdlcyxcbiAgT25EZXN0cm95LFxuICBPdXRwdXQsXG4gIFBMQVRGT1JNX0lELFxuICBSZW5kZXJlcjIsXG4gIFNlY3VyaXR5Q29udGV4dCxcbiAgU2ltcGxlQ2hhbmdlcyxcbiAgVmlld0VuY2Fwc3VsYXRpb25cbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSdcblxuaW1wb3J0IHtDb250cm9sVmFsdWVBY2Nlc3NvciwgTkdfVkFMSURBVE9SUywgTkdfVkFMVUVfQUNDRVNTT1IsIFZhbGlkYXRvcn0gZnJvbSAnQGFuZ3VsYXIvZm9ybXMnXG5pbXBvcnQge2RlZmF1bHRNb2R1bGVzfSBmcm9tICcuL3F1aWxsLWRlZmF1bHRzJ1xuXG5pbXBvcnQge2dldEZvcm1hdH0gZnJvbSAnLi9oZWxwZXJzJ1xuaW1wb3J0IHsgUXVpbGxTZXJ2aWNlIH0gZnJvbSAnLi9xdWlsbC5zZXJ2aWNlJ1xuXG5leHBvcnQgaW50ZXJmYWNlIFJhbmdlIHtcbiAgaW5kZXg6IG51bWJlclxuICBsZW5ndGg6IG51bWJlclxufVxuXG5leHBvcnQgaW50ZXJmYWNlIENvbnRlbnRDaGFuZ2Uge1xuICBjb250ZW50OiBhbnlcbiAgZGVsdGE6IERlbHRhXG4gIGVkaXRvcjogUXVpbGxUeXBlXG4gIGh0bWw6IHN0cmluZyB8IG51bGxcbiAgb2xkRGVsdGE6IERlbHRhXG4gIHNvdXJjZTogc3RyaW5nXG4gIHRleHQ6IHN0cmluZ1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFNlbGVjdGlvbkNoYW5nZSB7XG4gIGVkaXRvcjogUXVpbGxUeXBlXG4gIG9sZFJhbmdlOiBSYW5nZSB8IG51bGxcbiAgcmFuZ2U6IFJhbmdlIHzCoG51bGxcbiAgc291cmNlOiBzdHJpbmdcbn1cblxuZXhwb3J0IGludGVyZmFjZSBCbHVyIHtcbiAgZWRpdG9yOiBRdWlsbFR5cGVcbiAgc291cmNlOiBzdHJpbmdcbn1cblxuZXhwb3J0IGludGVyZmFjZSBGb2N1cyB7XG4gIGVkaXRvcjogUXVpbGxUeXBlXG4gIHNvdXJjZTogc3RyaW5nXG59XG5cbmV4cG9ydCB0eXBlIEVkaXRvckNoYW5nZUNvbnRlbnQgPSBDb250ZW50Q2hhbmdlICYge2V2ZW50OiAndGV4dC1jaGFuZ2UnfVxuZXhwb3J0IHR5cGUgRWRpdG9yQ2hhbmdlU2VsZWN0aW9uID0gU2VsZWN0aW9uQ2hhbmdlICYge2V2ZW50OiAnc2VsZWN0aW9uLWNoYW5nZSd9XG5cbkBEaXJlY3RpdmUoKVxuLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOmRpcmVjdGl2ZS1jbGFzcy1zdWZmaXhcbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBRdWlsbEVkaXRvckJhc2UgaW1wbGVtZW50cyBBZnRlclZpZXdJbml0LCBDb250cm9sVmFsdWVBY2Nlc3NvciwgT25DaGFuZ2VzLCBPbkRlc3Ryb3ksIFZhbGlkYXRvciB7XG5cbiAgcXVpbGxFZGl0b3IhOiBRdWlsbFR5cGVcbiAgZWRpdG9yRWxlbSE6IEhUTUxFbGVtZW50XG4gIGNvbnRlbnQ6IGFueVxuXG4gIEBJbnB1dCgpIGZvcm1hdD86ICdvYmplY3QnIHwgJ2h0bWwnIHwgJ3RleHQnIHwgJ2pzb24nXG4gIEBJbnB1dCgpIHRoZW1lPzogc3RyaW5nXG4gIEBJbnB1dCgpIG1vZHVsZXM/OiBRdWlsbE1vZHVsZXNcbiAgQElucHV0KCkgZGVidWc/OiAnd2FybicgfMKgJ2xvZycgfMKgJ2Vycm9yJyB8wqBmYWxzZVxuICBASW5wdXQoKSByZWFkT25seT86IGJvb2xlYW5cbiAgQElucHV0KCkgcGxhY2Vob2xkZXI/OiBzdHJpbmdcbiAgQElucHV0KCkgbWF4TGVuZ3RoPzogbnVtYmVyXG4gIEBJbnB1dCgpIG1pbkxlbmd0aD86IG51bWJlclxuICBASW5wdXQoKSByZXF1aXJlZCA9IGZhbHNlXG4gIEBJbnB1dCgpIGZvcm1hdHM/OiBzdHJpbmdbXSB8wqBudWxsXG4gIEBJbnB1dCgpIGN1c3RvbVRvb2xiYXJQb3NpdGlvbjogJ3RvcCcgfMKgJ2JvdHRvbScgPSAndG9wJ1xuICBASW5wdXQoKSBzYW5pdGl6ZSA9IGZhbHNlXG4gIEBJbnB1dCgpIHN0eWxlczogYW55ID0gbnVsbFxuICBASW5wdXQoKSBzdHJpY3QgPSB0cnVlXG4gIEBJbnB1dCgpIHNjcm9sbGluZ0NvbnRhaW5lcj86IEhUTUxFbGVtZW50IHwgc3RyaW5nIHwgbnVsbFxuICBASW5wdXQoKSBib3VuZHM/OiBIVE1MRWxlbWVudCB8IHN0cmluZ1xuICBASW5wdXQoKSBjdXN0b21PcHRpb25zOiBDdXN0b21PcHRpb25bXSA9IFtdXG4gIEBJbnB1dCgpIGN1c3RvbU1vZHVsZXM6IEN1c3RvbU1vZHVsZVtdID0gW11cbiAgQElucHV0KCkgdHJhY2tDaGFuZ2VzPzogJ3VzZXInIHzCoCdhbGwnXG4gIEBJbnB1dCgpIHByZXNlcnZlV2hpdGVzcGFjZSA9IGZhbHNlXG4gIEBJbnB1dCgpIGNsYXNzZXM/OiBzdHJpbmdcbiAgQElucHV0KCkgdHJpbU9uVmFsaWRhdGlvbiA9IGZhbHNlXG5cbiAgQE91dHB1dCgpIG9uRWRpdG9yQ3JlYXRlZDogRXZlbnRFbWl0dGVyPGFueT4gPSBuZXcgRXZlbnRFbWl0dGVyKClcbiAgQE91dHB1dCgpIG9uRWRpdG9yQ2hhbmdlZDogRXZlbnRFbWl0dGVyPEVkaXRvckNoYW5nZUNvbnRlbnQgfMKgRWRpdG9yQ2hhbmdlU2VsZWN0aW9uPiA9IG5ldyBFdmVudEVtaXR0ZXIoKVxuICBAT3V0cHV0KCkgb25Db250ZW50Q2hhbmdlZDogRXZlbnRFbWl0dGVyPENvbnRlbnRDaGFuZ2U+ID0gbmV3IEV2ZW50RW1pdHRlcigpXG4gIEBPdXRwdXQoKSBvblNlbGVjdGlvbkNoYW5nZWQ6IEV2ZW50RW1pdHRlcjxTZWxlY3Rpb25DaGFuZ2U+ID0gbmV3IEV2ZW50RW1pdHRlcigpXG4gIEBPdXRwdXQoKSBvbkZvY3VzOiBFdmVudEVtaXR0ZXI8Rm9jdXM+ID0gbmV3IEV2ZW50RW1pdHRlcigpXG4gIEBPdXRwdXQoKSBvbkJsdXI6IEV2ZW50RW1pdHRlcjxCbHVyPiA9IG5ldyBFdmVudEVtaXR0ZXIoKVxuXG4gIGRpc2FibGVkID0gZmFsc2UgLy8gdXNlZCB0byBzdG9yZSBpbml0aWFsIHZhbHVlIGJlZm9yZSBWaWV3SW5pdFxuXG4gIG9uTW9kZWxDaGFuZ2U6IChtb2RlbFZhbHVlPzogYW55KSA9PiB2b2lkXG4gIG9uTW9kZWxUb3VjaGVkOiAoKSA9PiB2b2lkXG4gIG9uVmFsaWRhdG9yQ2hhbmdlZDogKCkgPT4gdm9pZFxuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHB1YmxpYyBlbGVtZW50UmVmOiBFbGVtZW50UmVmLFxuICAgIHByb3RlY3RlZCBkb21TYW5pdGl6ZXI6IERvbVNhbml0aXplcixcbiAgICBASW5qZWN0KERPQ1VNRU5UKSBwcm90ZWN0ZWQgZG9jOiBhbnksXG4gICAgQEluamVjdChQTEFURk9STV9JRCkgcHJvdGVjdGVkIHBsYXRmb3JtSWQ6IGFueSxcbiAgICBwcm90ZWN0ZWQgcmVuZGVyZXI6IFJlbmRlcmVyMixcbiAgICBwcm90ZWN0ZWQgem9uZTogTmdab25lLFxuICAgIHByb3RlY3RlZCBzZXJ2aWNlOiBRdWlsbFNlcnZpY2VcbiAgKSB7fVxuXG4gIHN0YXRpYyBub3JtYWxpemVDbGFzc05hbWVzKGNsYXNzZXM6IHN0cmluZyk6IHN0cmluZ1tdIHtcbiAgICBjb25zdCBjbGFzc0xpc3QgPSBjbGFzc2VzLnRyaW0oKS5zcGxpdCgnICcpXG4gICAgcmV0dXJuIGNsYXNzTGlzdC5yZWR1Y2UoKHByZXY6IHN0cmluZ1tdLCBjdXI6IHN0cmluZykgPT4ge1xuICAgICAgY29uc3QgdHJpbW1lZCA9IGN1ci50cmltKClcbiAgICAgIGlmICh0cmltbWVkKSB7XG4gICAgICAgIHByZXYucHVzaCh0cmltbWVkKVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gcHJldlxuICAgIH0sIFtdKVxuICB9XG5cbiAgQElucHV0KClcbiAgdmFsdWVHZXR0ZXIgPSAocXVpbGxFZGl0b3I6IFF1aWxsVHlwZSwgZWRpdG9yRWxlbWVudDogSFRNTEVsZW1lbnQpOiBzdHJpbmcgfCBhbnnCoCA9PiB7XG4gICAgbGV0IGh0bWw6IHN0cmluZyB8IG51bGwgPSBlZGl0b3JFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5xbC1lZGl0b3InKSEuaW5uZXJIVE1MXG4gICAgaWYgKGh0bWwgPT09ICc8cD48YnI+PC9wPicgfHwgaHRtbCA9PT0gJzxkaXY+PGJyPjwvZGl2PicpIHtcbiAgICAgIGh0bWwgPSBudWxsXG4gICAgfVxuICAgIGxldCBtb2RlbFZhbHVlOiBzdHJpbmcgfCBEZWx0YSB8wqBudWxsID0gaHRtbFxuICAgIGNvbnN0IGZvcm1hdCA9IGdldEZvcm1hdCh0aGlzLmZvcm1hdCwgdGhpcy5zZXJ2aWNlLmNvbmZpZy5mb3JtYXQpXG5cbiAgICBpZiAoZm9ybWF0ID09PSAndGV4dCcpIHtcbiAgICAgIG1vZGVsVmFsdWUgPSBxdWlsbEVkaXRvci5nZXRUZXh0KClcbiAgICB9IGVsc2UgaWYgKGZvcm1hdCA9PT0gJ29iamVjdCcpIHtcbiAgICAgIG1vZGVsVmFsdWUgPSBxdWlsbEVkaXRvci5nZXRDb250ZW50cygpXG4gICAgfSBlbHNlIGlmIChmb3JtYXQgPT09ICdqc29uJykge1xuICAgICAgdHJ5IHtcbiAgICAgICAgbW9kZWxWYWx1ZSA9IEpTT04uc3RyaW5naWZ5KHF1aWxsRWRpdG9yLmdldENvbnRlbnRzKCkpXG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIG1vZGVsVmFsdWUgPSBxdWlsbEVkaXRvci5nZXRUZXh0KClcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbW9kZWxWYWx1ZVxuICB9XG5cbiAgQElucHV0KClcbiAgdmFsdWVTZXR0ZXIgPSAocXVpbGxFZGl0b3I6IFF1aWxsVHlwZSwgdmFsdWU6IGFueSk6IGFueSA9PiB7XG4gICAgY29uc3QgZm9ybWF0ID0gZ2V0Rm9ybWF0KHRoaXMuZm9ybWF0LCB0aGlzLnNlcnZpY2UuY29uZmlnLmZvcm1hdClcbiAgICBpZiAoZm9ybWF0ID09PSAnaHRtbCcpIHtcbiAgICAgIGlmICh0aGlzLnNhbml0aXplKSB7XG4gICAgICAgIHZhbHVlID0gdGhpcy5kb21TYW5pdGl6ZXIuc2FuaXRpemUoU2VjdXJpdHlDb250ZXh0LkhUTUwsIHZhbHVlKVxuICAgICAgfVxuICAgICAgcmV0dXJuIHF1aWxsRWRpdG9yLmNsaXBib2FyZC5jb252ZXJ0KHZhbHVlKVxuICAgIH0gZWxzZSBpZiAoZm9ybWF0ID09PSAnanNvbicpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBKU09OLnBhcnNlKHZhbHVlKVxuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICByZXR1cm4gW3sgaW5zZXJ0OiB2YWx1ZSB9XVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB2YWx1ZVxuICB9XG5cbiAgYXN5bmMgbmdBZnRlclZpZXdJbml0KCkge1xuICAgIGlmIChpc1BsYXRmb3JtU2VydmVyKHRoaXMucGxhdGZvcm1JZCkpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNvbnN0IFF1aWxsID0gYXdhaXQgdGhpcy5zZXJ2aWNlLmdldFF1aWxsKClcblxuICAgIHRoaXMuZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50Lmluc2VydEFkamFjZW50SFRNTChcbiAgICAgIHRoaXMuY3VzdG9tVG9vbGJhclBvc2l0aW9uID09PSAndG9wJyA/ICdiZWZvcmVlbmQnIDogJ2FmdGVyYmVnaW4nLFxuICAgICAgdGhpcy5wcmVzZXJ2ZVdoaXRlc3BhY2UgPyAnPHByZSBxdWlsbC1lZGl0b3ItZWxlbWVudD48L3ByZT4nIDogJzxkaXYgcXVpbGwtZWRpdG9yLWVsZW1lbnQ+PC9kaXY+J1xuICAgIClcblxuICAgIHRoaXMuZWRpdG9yRWxlbSA9IHRoaXMuZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoXG4gICAgICAnW3F1aWxsLWVkaXRvci1lbGVtZW50XSdcbiAgICApXG5cbiAgICBjb25zdCB0b29sYmFyRWxlbSA9IHRoaXMuZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoXG4gICAgICAnW3F1aWxsLWVkaXRvci10b29sYmFyXSdcbiAgICApXG4gICAgY29uc3QgbW9kdWxlcyA9IE9iamVjdC5hc3NpZ24oe30sIHRoaXMubW9kdWxlcyB8fCB0aGlzLnNlcnZpY2UuY29uZmlnLm1vZHVsZXMpXG5cbiAgICBpZiAodG9vbGJhckVsZW0pIHtcbiAgICAgIG1vZHVsZXMudG9vbGJhciA9IHRvb2xiYXJFbGVtXG4gICAgfSBlbHNlIGlmIChtb2R1bGVzLnRvb2xiYXIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgbW9kdWxlcy50b29sYmFyID0gZGVmYXVsdE1vZHVsZXMudG9vbGJhclxuICAgIH1cblxuICAgIGxldCBwbGFjZWhvbGRlciA9IHRoaXMucGxhY2Vob2xkZXIgIT09IHVuZGVmaW5lZCA/IHRoaXMucGxhY2Vob2xkZXIgOiB0aGlzLnNlcnZpY2UuY29uZmlnLnBsYWNlaG9sZGVyXG4gICAgaWYgKHBsYWNlaG9sZGVyID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHBsYWNlaG9sZGVyID0gJ0luc2VydCB0ZXh0IGhlcmUgLi4uJ1xuICAgIH1cblxuICAgIGlmICh0aGlzLnN0eWxlcykge1xuICAgICAgT2JqZWN0LmtleXModGhpcy5zdHlsZXMpLmZvckVhY2goKGtleTogc3RyaW5nKSA9PiB7XG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0U3R5bGUodGhpcy5lZGl0b3JFbGVtLCBrZXksIHRoaXMuc3R5bGVzW2tleV0pXG4gICAgICB9KVxuICAgIH1cblxuICAgIGlmICh0aGlzLmNsYXNzZXMpIHtcbiAgICAgIHRoaXMuYWRkQ2xhc3Nlcyh0aGlzLmNsYXNzZXMpXG4gICAgfVxuXG4gICAgdGhpcy5jdXN0b21PcHRpb25zLmZvckVhY2goKGN1c3RvbU9wdGlvbikgPT4ge1xuICAgICAgY29uc3QgbmV3Q3VzdG9tT3B0aW9uID0gUXVpbGwuaW1wb3J0KGN1c3RvbU9wdGlvbi5pbXBvcnQpXG4gICAgICBuZXdDdXN0b21PcHRpb24ud2hpdGVsaXN0ID0gY3VzdG9tT3B0aW9uLndoaXRlbGlzdFxuICAgICAgUXVpbGwucmVnaXN0ZXIobmV3Q3VzdG9tT3B0aW9uLCB0cnVlKVxuICAgIH0pXG5cbiAgICB0aGlzLmN1c3RvbU1vZHVsZXMuZm9yRWFjaCgoe2ltcGxlbWVudGF0aW9uLCBwYXRofSkgPT4ge1xuICAgICAgUXVpbGwucmVnaXN0ZXIocGF0aCwgaW1wbGVtZW50YXRpb24pXG4gICAgfSlcblxuICAgIGxldCBib3VuZHMgPSB0aGlzLmJvdW5kcyAmJiB0aGlzLmJvdW5kcyA9PT0gJ3NlbGYnID8gdGhpcy5lZGl0b3JFbGVtIDogdGhpcy5ib3VuZHNcbiAgICBpZiAoIWJvdW5kcykge1xuICAgICAgYm91bmRzID0gdGhpcy5zZXJ2aWNlLmNvbmZpZy5ib3VuZHMgPyB0aGlzLnNlcnZpY2UuY29uZmlnLmJvdW5kcyA6IHRoaXMuZG9jLmJvZHlcbiAgICB9XG5cbiAgICBsZXQgZGVidWcgPSB0aGlzLmRlYnVnXG4gICAgaWYgKCFkZWJ1ZyAmJiBkZWJ1ZyAhPT0gZmFsc2UgJiYgdGhpcy5zZXJ2aWNlLmNvbmZpZy5kZWJ1Zykge1xuICAgICAgZGVidWcgPSB0aGlzLnNlcnZpY2UuY29uZmlnLmRlYnVnXG4gICAgfVxuXG4gICAgbGV0IHJlYWRPbmx5ID0gdGhpcy5yZWFkT25seVxuICAgIGlmICghcmVhZE9ubHkgJiYgdGhpcy5yZWFkT25seSAhPT0gZmFsc2UpIHtcbiAgICAgIHJlYWRPbmx5ID0gdGhpcy5zZXJ2aWNlLmNvbmZpZy5yZWFkT25seSAhPT0gdW5kZWZpbmVkID8gdGhpcy5zZXJ2aWNlLmNvbmZpZy5yZWFkT25seSA6IGZhbHNlXG4gICAgfVxuXG4gICAgbGV0IHNjcm9sbGluZ0NvbnRhaW5lciA9IHRoaXMuc2Nyb2xsaW5nQ29udGFpbmVyXG4gICAgaWYgKCFzY3JvbGxpbmdDb250YWluZXIgJiYgdGhpcy5zY3JvbGxpbmdDb250YWluZXIgIT09IG51bGwpIHtcbiAgICAgIHNjcm9sbGluZ0NvbnRhaW5lciA9XG4gICAgICAgIHRoaXMuc2VydmljZS5jb25maWcuc2Nyb2xsaW5nQ29udGFpbmVyID09PSBudWxsXG4gICAgICAgICAgfHzCoHRoaXMuc2VydmljZS5jb25maWcuc2Nyb2xsaW5nQ29udGFpbmVyID8gdGhpcy5zZXJ2aWNlLmNvbmZpZy5zY3JvbGxpbmdDb250YWluZXIgOiBudWxsXG4gICAgfVxuXG4gICAgbGV0IGZvcm1hdHMgPSB0aGlzLmZvcm1hdHNcbiAgICBpZiAoIWZvcm1hdHMgJiYgZm9ybWF0cyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBmb3JtYXRzID0gdGhpcy5zZXJ2aWNlLmNvbmZpZy5mb3JtYXRzID8gWy4uLnRoaXMuc2VydmljZS5jb25maWcuZm9ybWF0c10gOsKgKHRoaXMuc2VydmljZS5jb25maWcuZm9ybWF0cyA9PT0gbnVsbCA/IG51bGwgOiB1bmRlZmluZWQpXG4gICAgfVxuXG4gICAgdGhpcy56b25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgIHRoaXMucXVpbGxFZGl0b3IgPSBuZXcgUXVpbGwodGhpcy5lZGl0b3JFbGVtLCB7XG4gICAgICAgIGJvdW5kcyxcbiAgICAgICAgZGVidWc6IGRlYnVnIGFzIGFueSxcbiAgICAgICAgZm9ybWF0czogZm9ybWF0cyBhcyBhbnksXG4gICAgICAgIG1vZHVsZXMsXG4gICAgICAgIHBsYWNlaG9sZGVyLFxuICAgICAgICByZWFkT25seSxcbiAgICAgICAgc2Nyb2xsaW5nQ29udGFpbmVyOiBzY3JvbGxpbmdDb250YWluZXIgYXMgYW55LFxuICAgICAgICBzdHJpY3Q6IHRoaXMuc3RyaWN0LFxuICAgICAgICB0aGVtZTogdGhpcy50aGVtZSB8fCAodGhpcy5zZXJ2aWNlLmNvbmZpZy50aGVtZSA/IHRoaXMuc2VydmljZS5jb25maWcudGhlbWUgOiAnc25vdycpXG4gICAgICB9KVxuICAgIH0pXG5cbiAgICBpZiAodGhpcy5jb250ZW50KSB7XG4gICAgICBjb25zdCBmb3JtYXQgPSBnZXRGb3JtYXQodGhpcy5mb3JtYXQsIHRoaXMuc2VydmljZS5jb25maWcuZm9ybWF0KVxuICAgICAgaWYgKGZvcm1hdCA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgdGhpcy5xdWlsbEVkaXRvci5zZXRDb250ZW50cyh0aGlzLmNvbnRlbnQsICdzaWxlbnQnKVxuICAgICAgfSBlbHNlIGlmIChmb3JtYXQgPT09ICd0ZXh0Jykge1xuICAgICAgICB0aGlzLnF1aWxsRWRpdG9yLnNldFRleHQodGhpcy5jb250ZW50LCAnc2lsZW50JylcbiAgICAgIH0gZWxzZSBpZiAoZm9ybWF0ID09PSAnanNvbicpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICB0aGlzLnF1aWxsRWRpdG9yLnNldENvbnRlbnRzKEpTT04ucGFyc2UodGhpcy5jb250ZW50KSwgJ3NpbGVudCcpXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICB0aGlzLnF1aWxsRWRpdG9yLnNldFRleHQodGhpcy5jb250ZW50LCAnc2lsZW50JylcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHRoaXMuc2FuaXRpemUpIHtcbiAgICAgICAgICB0aGlzLmNvbnRlbnQgPSB0aGlzLmRvbVNhbml0aXplci5zYW5pdGl6ZShTZWN1cml0eUNvbnRleHQuSFRNTCwgdGhpcy5jb250ZW50KVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGNvbnRlbnRzID0gdGhpcy5xdWlsbEVkaXRvci5jbGlwYm9hcmQuY29udmVydCh0aGlzLmNvbnRlbnQpXG4gICAgICAgIHRoaXMucXVpbGxFZGl0b3Iuc2V0Q29udGVudHMoY29udGVudHMsICdzaWxlbnQnKVxuICAgICAgfVxuXG4gICAgICB0aGlzLnF1aWxsRWRpdG9yLmdldE1vZHVsZSgnaGlzdG9yeScpLmNsZWFyKClcbiAgICB9XG5cbiAgICAvLyBpbml0aWFsaXplIGRpc2FibGVkIHN0YXR1cyBiYXNlZCBvbiB0aGlzLmRpc2FibGVkIGFzIGRlZmF1bHQgdmFsdWVcbiAgICB0aGlzLnNldERpc2FibGVkU3RhdGUoKVxuXG4gICAgLy8gdHJpZ2dlcmVkIGlmIHNlbGVjdGlvbiBvciB0ZXh0IGNoYW5nZWRcbiAgICB0aGlzLnF1aWxsRWRpdG9yLm9uKFxuICAgICAgJ2VkaXRvci1jaGFuZ2UnLFxuICAgICAgdGhpcy5lZGl0b3JDaGFuZ2VIYW5kbGVyXG4gICAgKVxuXG4gICAgLy8gbWFyayBtb2RlbCBhcyB0b3VjaGVkIGlmIGVkaXRvciBsb3N0IGZvY3VzXG4gICAgdGhpcy5xdWlsbEVkaXRvci5vbihcbiAgICAgICdzZWxlY3Rpb24tY2hhbmdlJyxcbiAgICAgIHRoaXMuc2VsZWN0aW9uQ2hhbmdlSGFuZGxlclxuICAgIClcblxuICAgIC8vIHVwZGF0ZSBtb2RlbCBpZiB0ZXh0IGNoYW5nZXNcbiAgICB0aGlzLnF1aWxsRWRpdG9yLm9uKFxuICAgICAgJ3RleHQtY2hhbmdlJyxcbiAgICAgIHRoaXMudGV4dENoYW5nZUhhbmRsZXJcbiAgICApXG5cbiAgICAvLyB0cmlnZ2VyIGNyZWF0ZWQgaW4gYSB0aW1lb3V0IHRvIGF2b2lkIGNoYW5nZWQgbW9kZWxzIGFmdGVyIGNoZWNrZWRcbiAgICAvLyBpZiB5b3UgYXJlIHVzaW5nIHRoZSBlZGl0b3IgYXBpIGluIGNyZWF0ZWQgb3V0cHV0IHRvIGNoYW5nZSB0aGUgZWRpdG9yIGNvbnRlbnRcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGlmICh0aGlzLm9uVmFsaWRhdG9yQ2hhbmdlZCkge1xuICAgICAgICB0aGlzLm9uVmFsaWRhdG9yQ2hhbmdlZCgpXG4gICAgICB9XG4gICAgICB0aGlzLm9uRWRpdG9yQ3JlYXRlZC5lbWl0KHRoaXMucXVpbGxFZGl0b3IpXG4gICAgfSlcbiAgfVxuXG4gIHNlbGVjdGlvbkNoYW5nZUhhbmRsZXIgPSAocmFuZ2U6IFJhbmdlIHzCoG51bGwsIG9sZFJhbmdlOiBSYW5nZSB8IG51bGwsIHNvdXJjZTogc3RyaW5nKSA9PiB7XG4gICAgY29uc3Qgc2hvdWxkVHJpZ2dlck9uTW9kZWxUb3VjaGVkID0gIXJhbmdlICYmICEhdGhpcy5vbk1vZGVsVG91Y2hlZFxuXG4gICAgLy8gb25seSBlbWl0IGNoYW5nZXMgd2hlbiB0aGVyZSdzIGFueSBsaXN0ZW5lclxuICAgIGlmICghdGhpcy5vbkJsdXIub2JzZXJ2ZXJzLmxlbmd0aCAmJlxuICAgICAgICAhdGhpcy5vbkZvY3VzLm9ic2VydmVycy5sZW5ndGggJiZcbiAgICAgICAgIXRoaXMub25TZWxlY3Rpb25DaGFuZ2VkLm9ic2VydmVycy5sZW5ndGggJiZcbiAgICAgICAgIXNob3VsZFRyaWdnZXJPbk1vZGVsVG91Y2hlZCkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgdGhpcy56b25lLnJ1bigoKSA9PiB7XG4gICAgICBpZiAocmFuZ2UgPT09IG51bGwpIHtcbiAgICAgICAgdGhpcy5vbkJsdXIuZW1pdCh7XG4gICAgICAgICAgZWRpdG9yOiB0aGlzLnF1aWxsRWRpdG9yLFxuICAgICAgICAgIHNvdXJjZVxuICAgICAgICB9KVxuICAgICAgfSBlbHNlIGlmIChvbGRSYW5nZSA9PT0gbnVsbCkge1xuICAgICAgICB0aGlzLm9uRm9jdXMuZW1pdCh7XG4gICAgICAgICAgZWRpdG9yOiB0aGlzLnF1aWxsRWRpdG9yLFxuICAgICAgICAgIHNvdXJjZVxuICAgICAgICB9KVxuICAgICAgfVxuXG4gICAgICB0aGlzLm9uU2VsZWN0aW9uQ2hhbmdlZC5lbWl0KHtcbiAgICAgICAgZWRpdG9yOiB0aGlzLnF1aWxsRWRpdG9yLFxuICAgICAgICBvbGRSYW5nZSxcbiAgICAgICAgcmFuZ2UsXG4gICAgICAgIHNvdXJjZVxuICAgICAgfSlcblxuICAgICAgaWYgKHNob3VsZFRyaWdnZXJPbk1vZGVsVG91Y2hlZCkge1xuICAgICAgICB0aGlzLm9uTW9kZWxUb3VjaGVkKClcbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgdGV4dENoYW5nZUhhbmRsZXIgPSAoZGVsdGE6IERlbHRhLCBvbGREZWx0YTogRGVsdGEsIHNvdXJjZTogc3RyaW5nKTogdm9pZCA9PiB7XG4gICAgLy8gb25seSBlbWl0IGNoYW5nZXMgZW1pdHRlZCBieSB1c2VyIGludGVyYWN0aW9uc1xuICAgIGNvbnN0IHRleHQgPSB0aGlzLnF1aWxsRWRpdG9yLmdldFRleHQoKVxuICAgIGNvbnN0IGNvbnRlbnQgPSB0aGlzLnF1aWxsRWRpdG9yLmdldENvbnRlbnRzKClcblxuICAgIGxldCBodG1sOiBzdHJpbmcgfCBudWxsID0gdGhpcy5lZGl0b3JFbGVtIS5xdWVyeVNlbGVjdG9yKCcucWwtZWRpdG9yJykhLmlubmVySFRNTFxuICAgIGlmIChodG1sID09PSAnPHA+PGJyPjwvcD4nIHx8IGh0bWwgPT09ICc8ZGl2Pjxicj48L2Rpdj4nKSB7XG4gICAgICBodG1sID0gbnVsbFxuICAgIH1cblxuICAgIGNvbnN0IHRyYWNrQ2hhbmdlcyA9IHRoaXMudHJhY2tDaGFuZ2VzIHx8wqB0aGlzLnNlcnZpY2UuY29uZmlnLnRyYWNrQ2hhbmdlc1xuICAgIGNvbnN0IHNob3VsZFRyaWdnZXJPbk1vZGVsQ2hhbmdlID0gKHNvdXJjZSA9PT0gJ3VzZXInIHx8IHRyYWNrQ2hhbmdlcyAmJiB0cmFja0NoYW5nZXMgPT09ICdhbGwnKSAmJiAhIXRoaXMub25Nb2RlbENoYW5nZVxuXG4gICAgLy8gb25seSBlbWl0IGNoYW5nZXMgd2hlbiB0aGVyZSdzIGFueSBsaXN0ZW5lclxuICAgIGlmICghdGhpcy5vbkNvbnRlbnRDaGFuZ2VkLm9ic2VydmVycy5sZW5ndGggJiYgIXNob3VsZFRyaWdnZXJPbk1vZGVsQ2hhbmdlKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICB0aGlzLnpvbmUucnVuKCgpID0+IHtcbiAgICAgIGlmIChzaG91bGRUcmlnZ2VyT25Nb2RlbENoYW5nZSkge1xuICAgICAgICB0aGlzLm9uTW9kZWxDaGFuZ2UoXG4gICAgICAgICAgdGhpcy52YWx1ZUdldHRlcih0aGlzLnF1aWxsRWRpdG9yLCB0aGlzLmVkaXRvckVsZW0hKVxuICAgICAgICApXG4gICAgICB9XG5cbiAgICAgIHRoaXMub25Db250ZW50Q2hhbmdlZC5lbWl0KHtcbiAgICAgICAgY29udGVudCxcbiAgICAgICAgZGVsdGEsXG4gICAgICAgIGVkaXRvcjogdGhpcy5xdWlsbEVkaXRvcixcbiAgICAgICAgaHRtbCxcbiAgICAgICAgb2xkRGVsdGEsXG4gICAgICAgIHNvdXJjZSxcbiAgICAgICAgdGV4dFxuICAgICAgfSlcbiAgICB9KVxuICB9XG5cbiAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm1heC1saW5lLWxlbmd0aFxuICBlZGl0b3JDaGFuZ2VIYW5kbGVyID0gKGV2ZW50OiAndGV4dC1jaGFuZ2UnIHzCoCdzZWxlY3Rpb24tY2hhbmdlJywgY3VycmVudDogYW55IHzCoFJhbmdlIHzCoG51bGwsIG9sZDogYW55IHzCoFJhbmdlIHwgbnVsbCwgc291cmNlOiBzdHJpbmcpOiB2b2lkID0+IHtcbiAgICAvLyBvbmx5IGVtaXQgY2hhbmdlcyB3aGVuIHRoZXJlJ3MgYW55IGxpc3RlbmVyXG4gICAgaWYgKCF0aGlzLm9uRWRpdG9yQ2hhbmdlZC5vYnNlcnZlcnMubGVuZ3RoKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICAvLyBvbmx5IGVtaXQgY2hhbmdlcyBlbWl0dGVkIGJ5IHVzZXIgaW50ZXJhY3Rpb25zXG4gICAgaWYgKGV2ZW50ID09PSAndGV4dC1jaGFuZ2UnKSB7XG4gICAgICBjb25zdCB0ZXh0ID0gdGhpcy5xdWlsbEVkaXRvci5nZXRUZXh0KClcbiAgICAgIGNvbnN0IGNvbnRlbnQgPSB0aGlzLnF1aWxsRWRpdG9yLmdldENvbnRlbnRzKClcblxuICAgICAgbGV0IGh0bWw6IHN0cmluZyB8IG51bGwgPSB0aGlzLmVkaXRvckVsZW0hLnF1ZXJ5U2VsZWN0b3IoJy5xbC1lZGl0b3InKSEuaW5uZXJIVE1MXG4gICAgICBpZiAoaHRtbCA9PT0gJzxwPjxicj48L3A+JyB8fCBodG1sID09PSAnPGRpdj48YnI+PC9kaXY+Jykge1xuICAgICAgICBodG1sID0gbnVsbFxuICAgICAgfVxuXG4gICAgICB0aGlzLnpvbmUucnVuKCgpID0+IHtcbiAgICAgICAgdGhpcy5vbkVkaXRvckNoYW5nZWQuZW1pdCh7XG4gICAgICAgICAgY29udGVudCxcbiAgICAgICAgICBkZWx0YTogY3VycmVudCxcbiAgICAgICAgICBlZGl0b3I6IHRoaXMucXVpbGxFZGl0b3IsXG4gICAgICAgICAgZXZlbnQsXG4gICAgICAgICAgaHRtbCxcbiAgICAgICAgICBvbGREZWx0YTogb2xkLFxuICAgICAgICAgIHNvdXJjZSxcbiAgICAgICAgICB0ZXh0XG4gICAgICAgIH0pXG4gICAgICB9KVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLm9uRWRpdG9yQ2hhbmdlZC5lbWl0KHtcbiAgICAgICAgZWRpdG9yOiB0aGlzLnF1aWxsRWRpdG9yLFxuICAgICAgICBldmVudCxcbiAgICAgICAgb2xkUmFuZ2U6IG9sZCxcbiAgICAgICAgcmFuZ2U6IGN1cnJlbnQsXG4gICAgICAgIHNvdXJjZVxuICAgICAgfSlcbiAgICB9XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICBpZiAodGhpcy5xdWlsbEVkaXRvcikge1xuICAgICAgdGhpcy5xdWlsbEVkaXRvci5vZmYoJ3NlbGVjdGlvbi1jaGFuZ2UnLCB0aGlzLnNlbGVjdGlvbkNoYW5nZUhhbmRsZXIpXG4gICAgICB0aGlzLnF1aWxsRWRpdG9yLm9mZigndGV4dC1jaGFuZ2UnLCB0aGlzLnRleHRDaGFuZ2VIYW5kbGVyKVxuICAgICAgdGhpcy5xdWlsbEVkaXRvci5vZmYoJ2VkaXRvci1jaGFuZ2UnLCB0aGlzLmVkaXRvckNoYW5nZUhhbmRsZXIpXG4gICAgfVxuICB9XG5cbiAgbmdPbkNoYW5nZXMoY2hhbmdlczogU2ltcGxlQ2hhbmdlcyk6IHZvaWQge1xuICAgIGlmICghdGhpcy5xdWlsbEVkaXRvcikge1xuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIC8vIHRzbGludDpkaXNhYmxlOm5vLXN0cmluZy1saXRlcmFsXG4gICAgaWYgKGNoYW5nZXNbJ3JlYWRPbmx5J10pIHtcbiAgICAgIHRoaXMucXVpbGxFZGl0b3IuZW5hYmxlKCFjaGFuZ2VzWydyZWFkT25seSddLmN1cnJlbnRWYWx1ZSlcbiAgICB9XG4gICAgaWYgKGNoYW5nZXNbJ3BsYWNlaG9sZGVyJ10pIHtcbiAgICAgIHRoaXMucXVpbGxFZGl0b3Iucm9vdC5kYXRhc2V0LnBsYWNlaG9sZGVyID1cbiAgICAgICAgY2hhbmdlc1sncGxhY2Vob2xkZXInXS5jdXJyZW50VmFsdWVcbiAgICB9XG4gICAgaWYgKGNoYW5nZXNbJ3N0eWxlcyddKSB7XG4gICAgICBjb25zdCBjdXJyZW50U3R5bGluZyA9IGNoYW5nZXNbJ3N0eWxlcyddLmN1cnJlbnRWYWx1ZVxuICAgICAgY29uc3QgcHJldmlvdXNTdHlsaW5nID0gY2hhbmdlc1snc3R5bGVzJ10ucHJldmlvdXNWYWx1ZVxuXG4gICAgICBpZiAocHJldmlvdXNTdHlsaW5nKSB7XG4gICAgICAgIE9iamVjdC5rZXlzKHByZXZpb3VzU3R5bGluZykuZm9yRWFjaCgoa2V5OiBzdHJpbmcpID0+IHtcbiAgICAgICAgICB0aGlzLnJlbmRlcmVyLnJlbW92ZVN0eWxlKHRoaXMuZWRpdG9yRWxlbSwga2V5KVxuICAgICAgICB9KVxuICAgICAgfVxuICAgICAgaWYgKGN1cnJlbnRTdHlsaW5nKSB7XG4gICAgICAgIE9iamVjdC5rZXlzKGN1cnJlbnRTdHlsaW5nKS5mb3JFYWNoKChrZXk6IHN0cmluZykgPT4ge1xuICAgICAgICAgIHRoaXMucmVuZGVyZXIuc2V0U3R5bGUodGhpcy5lZGl0b3JFbGVtLCBrZXksIHRoaXMuc3R5bGVzW2tleV0pXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfVxuICAgIGlmIChjaGFuZ2VzWydjbGFzc2VzJ10pIHtcbiAgICAgIGNvbnN0IGN1cnJlbnRDbGFzc2VzID0gY2hhbmdlc1snY2xhc3NlcyddLmN1cnJlbnRWYWx1ZVxuICAgICAgY29uc3QgcHJldmlvdXNDbGFzc2VzID0gY2hhbmdlc1snY2xhc3NlcyddLnByZXZpb3VzVmFsdWVcblxuICAgICAgaWYgKHByZXZpb3VzQ2xhc3Nlcykge1xuICAgICAgICB0aGlzLnJlbW92ZUNsYXNzZXMocHJldmlvdXNDbGFzc2VzKVxuICAgICAgfVxuXG4gICAgICBpZiAoY3VycmVudENsYXNzZXMpIHtcbiAgICAgICAgdGhpcy5hZGRDbGFzc2VzKGN1cnJlbnRDbGFzc2VzKVxuICAgICAgfVxuICAgIH1cbiAgICAvLyB0c2xpbnQ6ZW5hYmxlOm5vLXN0cmluZy1saXRlcmFsXG4gIH1cblxuICBhZGRDbGFzc2VzKGNsYXNzTGlzdDogc3RyaW5nKTogdm9pZCB7XG4gICAgUXVpbGxFZGl0b3JCYXNlLm5vcm1hbGl6ZUNsYXNzTmFtZXMoY2xhc3NMaXN0KS5mb3JFYWNoKChjOiBzdHJpbmcpID0+IHtcbiAgICAgIHRoaXMucmVuZGVyZXIuYWRkQ2xhc3ModGhpcy5lZGl0b3JFbGVtLCBjKVxuICAgIH0pXG4gIH1cblxuICByZW1vdmVDbGFzc2VzKGNsYXNzTGlzdDogc3RyaW5nKTogdm9pZCB7XG4gICAgUXVpbGxFZGl0b3JCYXNlLm5vcm1hbGl6ZUNsYXNzTmFtZXMoY2xhc3NMaXN0KS5mb3JFYWNoKChjOiBzdHJpbmcpID0+IHtcbiAgICAgIHRoaXMucmVuZGVyZXIucmVtb3ZlQ2xhc3ModGhpcy5lZGl0b3JFbGVtLCBjKVxuICAgIH0pXG4gIH1cblxuICB3cml0ZVZhbHVlKGN1cnJlbnRWYWx1ZTogYW55KSB7XG4gICAgdGhpcy5jb250ZW50ID0gY3VycmVudFZhbHVlXG4gICAgY29uc3QgZm9ybWF0ID0gZ2V0Rm9ybWF0KHRoaXMuZm9ybWF0LCB0aGlzLnNlcnZpY2UuY29uZmlnLmZvcm1hdClcblxuICAgIGlmICh0aGlzLnF1aWxsRWRpdG9yKSB7XG4gICAgICBpZiAoY3VycmVudFZhbHVlKSB7XG4gICAgICAgIGlmIChmb3JtYXQgPT09ICd0ZXh0Jykge1xuICAgICAgICAgIHRoaXMucXVpbGxFZGl0b3Iuc2V0VGV4dChjdXJyZW50VmFsdWUpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5xdWlsbEVkaXRvci5zZXRDb250ZW50cyhcbiAgICAgICAgICAgIHRoaXMudmFsdWVTZXR0ZXIodGhpcy5xdWlsbEVkaXRvciwgdGhpcy5jb250ZW50KVxuICAgICAgICAgIClcbiAgICAgICAgfVxuICAgICAgICByZXR1cm5cbiAgICAgIH1cbiAgICAgIHRoaXMucXVpbGxFZGl0b3Iuc2V0VGV4dCgnJylcbiAgICB9XG4gIH1cblxuICBzZXREaXNhYmxlZFN0YXRlKGlzRGlzYWJsZWQ6IGJvb2xlYW4gPSB0aGlzLmRpc2FibGVkKTogdm9pZCB7XG4gICAgLy8gc3RvcmUgaW5pdGlhbCB2YWx1ZSB0byBzZXQgYXBwcm9wcmlhdGUgZGlzYWJsZWQgc3RhdHVzIGFmdGVyIFZpZXdJbml0XG4gICAgdGhpcy5kaXNhYmxlZCA9IGlzRGlzYWJsZWRcbiAgICBpZiAodGhpcy5xdWlsbEVkaXRvcikge1xuICAgICAgaWYgKGlzRGlzYWJsZWQpIHtcbiAgICAgICAgdGhpcy5xdWlsbEVkaXRvci5kaXNhYmxlKClcbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRBdHRyaWJ1dGUodGhpcy5lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQsICdkaXNhYmxlZCcsICdkaXNhYmxlZCcpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoIXRoaXMucmVhZE9ubHkpIHtcbiAgICAgICAgICB0aGlzLnF1aWxsRWRpdG9yLmVuYWJsZSgpXG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5yZW5kZXJlci5yZW1vdmVBdHRyaWJ1dGUodGhpcy5lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQsICdkaXNhYmxlZCcpXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmVnaXN0ZXJPbkNoYW5nZShmbjogKG1vZGVsVmFsdWU6IGFueSkgPT4gdm9pZCk6IHZvaWQge1xuICAgIHRoaXMub25Nb2RlbENoYW5nZSA9IGZuXG4gIH1cblxuICByZWdpc3Rlck9uVG91Y2hlZChmbjogKCkgPT4gdm9pZCk6IHZvaWQge1xuICAgIHRoaXMub25Nb2RlbFRvdWNoZWQgPSBmblxuICB9XG5cbiAgcmVnaXN0ZXJPblZhbGlkYXRvckNoYW5nZShmbjogKCkgPT4gdm9pZCkge1xuICAgIHRoaXMub25WYWxpZGF0b3JDaGFuZ2VkID0gZm5cbiAgfVxuXG4gIHZhbGlkYXRlKCkge1xuICAgIGlmICghdGhpcy5xdWlsbEVkaXRvcikge1xuICAgICAgcmV0dXJuIG51bGxcbiAgICB9XG5cbiAgICBjb25zdCBlcnI6IHtcbiAgICAgIG1pbkxlbmd0aEVycm9yPzoge1xuICAgICAgICBnaXZlbjogbnVtYmVyXG4gICAgICAgIG1pbkxlbmd0aDogbnVtYmVyXG4gICAgICB9XG4gICAgICBtYXhMZW5ndGhFcnJvcj86IHtcbiAgICAgICAgZ2l2ZW46IG51bWJlclxuICAgICAgICBtYXhMZW5ndGg6IG51bWJlclxuICAgICAgfVxuICAgICAgcmVxdWlyZWRFcnJvcj86IHsgZW1wdHk6IGJvb2xlYW4gfVxuICAgIH0gPSB7fVxuICAgIGxldCB2YWxpZCA9IHRydWVcblxuICAgIGNvbnN0IHRleHQgPSB0aGlzLnF1aWxsRWRpdG9yLmdldFRleHQoKVxuICAgIC8vIHRyaW0gdGV4dCBpZiB3YW50ZWQgKyBoYW5kbGUgc3BlY2lhbCBjYXNlIHRoYXQgYW4gZW1wdHkgZWRpdG9yIGNvbnRhaW5zIGEgbmV3IGxpbmVcbiAgICBjb25zdCB0ZXh0TGVuZ3RoID0gdGhpcy50cmltT25WYWxpZGF0aW9uID8gdGV4dC50cmltKCkubGVuZ3RoIDogKHRleHQubGVuZ3RoID09PSAxICYmIHRleHQudHJpbSgpLmxlbmd0aCA9PT0gMCA/IDAgOiB0ZXh0Lmxlbmd0aCAtIDEpXG5cbiAgICBpZiAodGhpcy5taW5MZW5ndGggJiYgdGV4dExlbmd0aCAmJiB0ZXh0TGVuZ3RoIDwgdGhpcy5taW5MZW5ndGgpIHtcbiAgICAgIGVyci5taW5MZW5ndGhFcnJvciA9IHtcbiAgICAgICAgZ2l2ZW46IHRleHRMZW5ndGgsXG4gICAgICAgIG1pbkxlbmd0aDogdGhpcy5taW5MZW5ndGhcbiAgICAgIH1cblxuICAgICAgdmFsaWQgPSBmYWxzZVxuICAgIH1cblxuICAgIGlmICh0aGlzLm1heExlbmd0aCAmJiB0ZXh0TGVuZ3RoID4gdGhpcy5tYXhMZW5ndGgpIHtcbiAgICAgIGVyci5tYXhMZW5ndGhFcnJvciA9IHtcbiAgICAgICAgZ2l2ZW46IHRleHRMZW5ndGgsXG4gICAgICAgIG1heExlbmd0aDogdGhpcy5tYXhMZW5ndGhcbiAgICAgIH1cblxuICAgICAgdmFsaWQgPSBmYWxzZVxuICAgIH1cblxuICAgIGlmICh0aGlzLnJlcXVpcmVkICYmICF0ZXh0TGVuZ3RoKSB7XG4gICAgICBlcnIucmVxdWlyZWRFcnJvciA9IHtcbiAgICAgICAgZW1wdHk6IHRydWVcbiAgICAgIH1cblxuICAgICAgdmFsaWQgPSBmYWxzZVxuICAgIH1cblxuICAgIHJldHVybiB2YWxpZCA/IG51bGwgOiBlcnJcbiAgfVxufVxuXG5AQ29tcG9uZW50KHtcbiAgZW5jYXBzdWxhdGlvbjogVmlld0VuY2Fwc3VsYXRpb24uTm9uZSxcbiAgcHJvdmlkZXJzOiBbXG4gICAge1xuICAgICAgbXVsdGk6IHRydWUsXG4gICAgICBwcm92aWRlOiBOR19WQUxVRV9BQ0NFU1NPUixcbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tdXNlLWJlZm9yZS1kZWZpbmVcbiAgICAgIHVzZUV4aXN0aW5nOiBmb3J3YXJkUmVmKCgpID0+IFF1aWxsRWRpdG9yQ29tcG9uZW50KVxuICAgIH0sXG4gICAge1xuICAgICAgbXVsdGk6IHRydWUsXG4gICAgICBwcm92aWRlOiBOR19WQUxJREFUT1JTLFxuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby11c2UtYmVmb3JlLWRlZmluZVxuICAgICAgdXNlRXhpc3Rpbmc6IGZvcndhcmRSZWYoKCkgPT4gUXVpbGxFZGl0b3JDb21wb25lbnQpXG4gICAgfVxuICBdLFxuICBzZWxlY3RvcjogJ3F1aWxsLWVkaXRvcicsXG4gIHRlbXBsYXRlOiBgXG4gIDxuZy1jb250ZW50IHNlbGVjdD1cIltxdWlsbC1lZGl0b3ItdG9vbGJhcl1cIj48L25nLWNvbnRlbnQ+XG5gXG59KVxuZXhwb3J0IGNsYXNzIFF1aWxsRWRpdG9yQ29tcG9uZW50IGV4dGVuZHMgUXVpbGxFZGl0b3JCYXNlIHtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBASW5qZWN0KEVsZW1lbnRSZWYpIGVsZW1lbnRSZWY6IEVsZW1lbnRSZWYsXG4gICAgQEluamVjdChEb21TYW5pdGl6ZXIpIGRvbVNhbml0aXplcjogRG9tU2FuaXRpemVyLFxuICAgIEBJbmplY3QoRE9DVU1FTlQpIGRvYzogYW55LFxuICAgIEBJbmplY3QoUExBVEZPUk1fSUQpIHBsYXRmb3JtSWQ6IGFueSxcbiAgICBASW5qZWN0KFJlbmRlcmVyMikgcmVuZGVyZXI6IFJlbmRlcmVyMixcbiAgICBASW5qZWN0KE5nWm9uZSkgem9uZTogTmdab25lLFxuICAgIEBJbmplY3QoUXVpbGxTZXJ2aWNlKSBzZXJ2aWNlOiBRdWlsbFNlcnZpY2VcbiAgKSB7XG4gICAgc3VwZXIoXG4gICAgICBlbGVtZW50UmVmLFxuICAgICAgZG9tU2FuaXRpemVyLFxuICAgICAgZG9jLFxuICAgICAgcGxhdGZvcm1JZCxcbiAgICAgIHJlbmRlcmVyLFxuICAgICAgem9uZSxcbiAgICAgIHNlcnZpY2VcbiAgICApXG4gIH1cblxufVxuIl19