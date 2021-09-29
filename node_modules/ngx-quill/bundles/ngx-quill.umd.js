(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@angular/common'), require('@angular/core'), require('@angular/platform-browser'), require('@angular/forms')) :
    typeof define === 'function' && define.amd ? define('ngx-quill', ['exports', '@angular/common', '@angular/core', '@angular/platform-browser', '@angular/forms'], factory) :
    (global = global || self, factory(global['ngx-quill'] = {}, global.ng.common, global.ng.core, global.ng.platformBrowser, global.ng.forms));
}(this, (function (exports, common, i0, platformBrowser, forms) { 'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    /* global Reflect, Promise */
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b)
                if (b.hasOwnProperty(p))
                    d[p] = b[p]; };
        return extendStatics(d, b);
    };
    function __extends(d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }
    var __assign = function () {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s)
                    if (Object.prototype.hasOwnProperty.call(s, p))
                        t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };
    function __rest(s, e) {
        var t = {};
        for (var p in s)
            if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
                t[p] = s[p];
        if (s != null && typeof Object.getOwnPropertySymbols === "function")
            for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
                if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                    t[p[i]] = s[p[i]];
            }
        return t;
    }
    function __decorate(decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
            r = Reflect.decorate(decorators, target, key, desc);
        else
            for (var i = decorators.length - 1; i >= 0; i--)
                if (d = decorators[i])
                    r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    function __param(paramIndex, decorator) {
        return function (target, key) { decorator(target, key, paramIndex); };
    }
    function __metadata(metadataKey, metadataValue) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function")
            return Reflect.metadata(metadataKey, metadataValue);
    }
    function __awaiter(thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try {
                step(generator.next(value));
            }
            catch (e) {
                reject(e);
            } }
            function rejected(value) { try {
                step(generator["throw"](value));
            }
            catch (e) {
                reject(e);
            } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }
    function __generator(thisArg, body) {
        var _ = { label: 0, sent: function () { if (t[0] & 1)
                throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function () { return this; }), g;
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f)
                throw new TypeError("Generator is already executing.");
            while (_)
                try {
                    if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done)
                        return t;
                    if (y = 0, t)
                        op = [op[0] & 2, t.value];
                    switch (op[0]) {
                        case 0:
                        case 1:
                            t = op;
                            break;
                        case 4:
                            _.label++;
                            return { value: op[1], done: false };
                        case 5:
                            _.label++;
                            y = op[1];
                            op = [0];
                            continue;
                        case 7:
                            op = _.ops.pop();
                            _.trys.pop();
                            continue;
                        default:
                            if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                                _ = 0;
                                continue;
                            }
                            if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                                _.label = op[1];
                                break;
                            }
                            if (op[0] === 6 && _.label < t[1]) {
                                _.label = t[1];
                                t = op;
                                break;
                            }
                            if (t && _.label < t[2]) {
                                _.label = t[2];
                                _.ops.push(op);
                                break;
                            }
                            if (t[2])
                                _.ops.pop();
                            _.trys.pop();
                            continue;
                    }
                    op = body.call(thisArg, _);
                }
                catch (e) {
                    op = [6, e];
                    y = 0;
                }
                finally {
                    f = t = 0;
                }
            if (op[0] & 5)
                throw op[1];
            return { value: op[0] ? op[1] : void 0, done: true };
        }
    }
    var __createBinding = Object.create ? (function (o, m, k, k2) {
        if (k2 === undefined)
            k2 = k;
        Object.defineProperty(o, k2, { enumerable: true, get: function () { return m[k]; } });
    }) : (function (o, m, k, k2) {
        if (k2 === undefined)
            k2 = k;
        o[k2] = m[k];
    });
    function __exportStar(m, exports) {
        for (var p in m)
            if (p !== "default" && !exports.hasOwnProperty(p))
                __createBinding(exports, m, p);
    }
    function __values(o) {
        var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
        if (m)
            return m.call(o);
        if (o && typeof o.length === "number")
            return {
                next: function () {
                    if (o && i >= o.length)
                        o = void 0;
                    return { value: o && o[i++], done: !o };
                }
            };
        throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
    }
    function __read(o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m)
            return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done)
                ar.push(r.value);
        }
        catch (error) {
            e = { error: error };
        }
        finally {
            try {
                if (r && !r.done && (m = i["return"]))
                    m.call(i);
            }
            finally {
                if (e)
                    throw e.error;
            }
        }
        return ar;
    }
    function __spread() {
        for (var ar = [], i = 0; i < arguments.length; i++)
            ar = ar.concat(__read(arguments[i]));
        return ar;
    }
    function __spreadArrays() {
        for (var s = 0, i = 0, il = arguments.length; i < il; i++)
            s += arguments[i].length;
        for (var r = Array(s), k = 0, i = 0; i < il; i++)
            for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
                r[k] = a[j];
        return r;
    }
    ;
    function __await(v) {
        return this instanceof __await ? (this.v = v, this) : new __await(v);
    }
    function __asyncGenerator(thisArg, _arguments, generator) {
        if (!Symbol.asyncIterator)
            throw new TypeError("Symbol.asyncIterator is not defined.");
        var g = generator.apply(thisArg, _arguments || []), i, q = [];
        return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
        function verb(n) { if (g[n])
            i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
        function resume(n, v) { try {
            step(g[n](v));
        }
        catch (e) {
            settle(q[0][3], e);
        } }
        function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
        function fulfill(value) { resume("next", value); }
        function reject(value) { resume("throw", value); }
        function settle(f, v) { if (f(v), q.shift(), q.length)
            resume(q[0][0], q[0][1]); }
    }
    function __asyncDelegator(o) {
        var i, p;
        return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
        function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: n === "return" } : f ? f(v) : v; } : f; }
    }
    function __asyncValues(o) {
        if (!Symbol.asyncIterator)
            throw new TypeError("Symbol.asyncIterator is not defined.");
        var m = o[Symbol.asyncIterator], i;
        return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
        function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
        function settle(resolve, reject, d, v) { Promise.resolve(v).then(function (v) { resolve({ value: v, done: d }); }, reject); }
    }
    function __makeTemplateObject(cooked, raw) {
        if (Object.defineProperty) {
            Object.defineProperty(cooked, "raw", { value: raw });
        }
        else {
            cooked.raw = raw;
        }
        return cooked;
    }
    ;
    var __setModuleDefault = Object.create ? (function (o, v) {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function (o, v) {
        o["default"] = v;
    };
    function __importStar(mod) {
        if (mod && mod.__esModule)
            return mod;
        var result = {};
        if (mod != null)
            for (var k in mod)
                if (Object.hasOwnProperty.call(mod, k))
                    __createBinding(result, mod, k);
        __setModuleDefault(result, mod);
        return result;
    }
    function __importDefault(mod) {
        return (mod && mod.__esModule) ? mod : { default: mod };
    }
    function __classPrivateFieldGet(receiver, privateMap) {
        if (!privateMap.has(receiver)) {
            throw new TypeError("attempted to get private field on non-instance");
        }
        return privateMap.get(receiver);
    }
    function __classPrivateFieldSet(receiver, privateMap, value) {
        if (!privateMap.has(receiver)) {
            throw new TypeError("attempted to set private field on non-instance");
        }
        privateMap.set(receiver, value);
        return value;
    }

    var defaultModules = {
        toolbar: [
            ['bold', 'italic', 'underline', 'strike'],
            ['blockquote', 'code-block'],
            [{ header: 1 }, { header: 2 }],
            [{ list: 'ordered' }, { list: 'bullet' }],
            [{ script: 'sub' }, { script: 'super' }],
            [{ indent: '-1' }, { indent: '+1' }],
            [{ direction: 'rtl' }],
            [{ size: ['small', false, 'large', 'huge'] }],
            [{ header: [1, 2, 3, 4, 5, 6, false] }],
            [
                { color: [] },
                { background: [] }
            ],
            [{ font: [] }],
            [{ align: [] }],
            ['clean'],
            ['link', 'image', 'video'] // link and image, video
        ]
    };

    var getFormat = function (format, configFormat) {
        var passedFormat = format || configFormat;
        return passedFormat || 'html';
    };

    var QUILL_CONFIG_TOKEN = new i0.InjectionToken('config');

    var QuillService = /** @class */ (function () {
        function QuillService(config) {
            this.config = config;
            this.count = 0;
            if (!this.config) {
                this.config = { modules: defaultModules };
            }
        }
        QuillService.prototype.getQuill = function () {
            var _this = this;
            this.count++;
            if (!this.Quill && this.count === 1) {
                this.$importPromise = new Promise(function (resolve) { return __awaiter(_this, void 0, void 0, function () {
                    var _a, _b, quillImport;
                    var _this = this;
                    return __generator(this, function (_c) {
                        switch (_c.label) {
                            case 0: return [4 /*yield*/, import('quill')];
                            case 1:
                                quillImport = _c.sent();
                                this.Quill = (quillImport.default ? quillImport.default : quillImport);
                                // Only register custom options and modules once
                                (_a = this.config.customOptions) === null || _a === void 0 ? void 0 : _a.forEach(function (customOption) {
                                    var newCustomOption = _this.Quill.import(customOption.import);
                                    newCustomOption.whitelist = customOption.whitelist;
                                    _this.Quill.register(newCustomOption, true, _this.config.suppressGlobalRegisterWarning);
                                });
                                (_b = this.config.customModules) === null || _b === void 0 ? void 0 : _b.forEach(function (_c) {
                                    var implementation = _c.implementation, path = _c.path;
                                    _this.Quill.register(path, implementation, _this.config.suppressGlobalRegisterWarning);
                                });
                                resolve(this.Quill);
                                return [2 /*return*/];
                        }
                    });
                }); });
            }
            return this.$importPromise;
        };
        return QuillService;
    }());
    QuillService.ɵprov = i0.ɵɵdefineInjectable({ factory: function QuillService_Factory() { return new QuillService(i0.ɵɵinject(QUILL_CONFIG_TOKEN)); }, token: QuillService, providedIn: "root" });
    QuillService.decorators = [
        { type: i0.Injectable, args: [{
                    providedIn: 'root'
                },] }
    ];
    QuillService.ctorParameters = function () { return [
        { type: undefined, decorators: [{ type: i0.Inject, args: [QUILL_CONFIG_TOKEN,] }] }
    ]; };

    // tslint:disable-next-line:directive-class-suffix
    var QuillEditorBase = /** @class */ (function () {
        function QuillEditorBase(elementRef, domSanitizer, doc, platformId, renderer, zone, service) {
            var _this = this;
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
            this.onEditorCreated = new i0.EventEmitter();
            this.onEditorChanged = new i0.EventEmitter();
            this.onContentChanged = new i0.EventEmitter();
            this.onSelectionChanged = new i0.EventEmitter();
            this.onFocus = new i0.EventEmitter();
            this.onBlur = new i0.EventEmitter();
            this.disabled = false; // used to store initial value before ViewInit
            this.valueGetter = function (quillEditor, editorElement) {
                var html = editorElement.querySelector('.ql-editor').innerHTML;
                if (html === '<p><br></p>' || html === '<div><br></div>') {
                    html = null;
                }
                var modelValue = html;
                var format = getFormat(_this.format, _this.service.config.format);
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
            this.valueSetter = function (quillEditor, value) {
                var format = getFormat(_this.format, _this.service.config.format);
                if (format === 'html') {
                    if (_this.sanitize) {
                        value = _this.domSanitizer.sanitize(i0.SecurityContext.HTML, value);
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
            this.selectionChangeHandler = function (range, oldRange, source) {
                var shouldTriggerOnModelTouched = !range && !!_this.onModelTouched;
                // only emit changes when there's any listener
                if (!_this.onBlur.observers.length &&
                    !_this.onFocus.observers.length &&
                    !_this.onSelectionChanged.observers.length &&
                    !shouldTriggerOnModelTouched) {
                    return;
                }
                _this.zone.run(function () {
                    if (range === null) {
                        _this.onBlur.emit({
                            editor: _this.quillEditor,
                            source: source
                        });
                    }
                    else if (oldRange === null) {
                        _this.onFocus.emit({
                            editor: _this.quillEditor,
                            source: source
                        });
                    }
                    _this.onSelectionChanged.emit({
                        editor: _this.quillEditor,
                        oldRange: oldRange,
                        range: range,
                        source: source
                    });
                    if (shouldTriggerOnModelTouched) {
                        _this.onModelTouched();
                    }
                });
            };
            this.textChangeHandler = function (delta, oldDelta, source) {
                // only emit changes emitted by user interactions
                var text = _this.quillEditor.getText();
                var content = _this.quillEditor.getContents();
                var html = _this.editorElem.querySelector('.ql-editor').innerHTML;
                if (html === '<p><br></p>' || html === '<div><br></div>') {
                    html = null;
                }
                var trackChanges = _this.trackChanges || _this.service.config.trackChanges;
                var shouldTriggerOnModelChange = (source === 'user' || trackChanges && trackChanges === 'all') && !!_this.onModelChange;
                // only emit changes when there's any listener
                if (!_this.onContentChanged.observers.length && !shouldTriggerOnModelChange) {
                    return;
                }
                _this.zone.run(function () {
                    if (shouldTriggerOnModelChange) {
                        _this.onModelChange(_this.valueGetter(_this.quillEditor, _this.editorElem));
                    }
                    _this.onContentChanged.emit({
                        content: content,
                        delta: delta,
                        editor: _this.quillEditor,
                        html: html,
                        oldDelta: oldDelta,
                        source: source,
                        text: text
                    });
                });
            };
            // tslint:disable-next-line:max-line-length
            this.editorChangeHandler = function (event, current, old, source) {
                // only emit changes when there's any listener
                if (!_this.onEditorChanged.observers.length) {
                    return;
                }
                // only emit changes emitted by user interactions
                if (event === 'text-change') {
                    var text_1 = _this.quillEditor.getText();
                    var content_1 = _this.quillEditor.getContents();
                    var html_1 = _this.editorElem.querySelector('.ql-editor').innerHTML;
                    if (html_1 === '<p><br></p>' || html_1 === '<div><br></div>') {
                        html_1 = null;
                    }
                    _this.zone.run(function () {
                        _this.onEditorChanged.emit({
                            content: content_1,
                            delta: current,
                            editor: _this.quillEditor,
                            event: event,
                            html: html_1,
                            oldDelta: old,
                            source: source,
                            text: text_1
                        });
                    });
                }
                else {
                    _this.onEditorChanged.emit({
                        editor: _this.quillEditor,
                        event: event,
                        oldRange: old,
                        range: current,
                        source: source
                    });
                }
            };
        }
        QuillEditorBase.normalizeClassNames = function (classes) {
            var classList = classes.trim().split(' ');
            return classList.reduce(function (prev, cur) {
                var trimmed = cur.trim();
                if (trimmed) {
                    prev.push(trimmed);
                }
                return prev;
            }, []);
        };
        QuillEditorBase.prototype.ngAfterViewInit = function () {
            return __awaiter(this, void 0, void 0, function () {
                var Quill, toolbarElem, modules, placeholder, bounds, debug, readOnly, scrollingContainer, formats, format, contents;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (common.isPlatformServer(this.platformId)) {
                                return [2 /*return*/];
                            }
                            return [4 /*yield*/, this.service.getQuill()];
                        case 1:
                            Quill = _a.sent();
                            this.elementRef.nativeElement.insertAdjacentHTML(this.customToolbarPosition === 'top' ? 'beforeend' : 'afterbegin', this.preserveWhitespace ? '<pre quill-editor-element></pre>' : '<div quill-editor-element></div>');
                            this.editorElem = this.elementRef.nativeElement.querySelector('[quill-editor-element]');
                            toolbarElem = this.elementRef.nativeElement.querySelector('[quill-editor-toolbar]');
                            modules = Object.assign({}, this.modules || this.service.config.modules);
                            if (toolbarElem) {
                                modules.toolbar = toolbarElem;
                            }
                            else if (modules.toolbar === undefined) {
                                modules.toolbar = defaultModules.toolbar;
                            }
                            placeholder = this.placeholder !== undefined ? this.placeholder : this.service.config.placeholder;
                            if (placeholder === undefined) {
                                placeholder = 'Insert text here ...';
                            }
                            if (this.styles) {
                                Object.keys(this.styles).forEach(function (key) {
                                    _this.renderer.setStyle(_this.editorElem, key, _this.styles[key]);
                                });
                            }
                            if (this.classes) {
                                this.addClasses(this.classes);
                            }
                            this.customOptions.forEach(function (customOption) {
                                var newCustomOption = Quill.import(customOption.import);
                                newCustomOption.whitelist = customOption.whitelist;
                                Quill.register(newCustomOption, true);
                            });
                            this.customModules.forEach(function (_a) {
                                var implementation = _a.implementation, path = _a.path;
                                Quill.register(path, implementation);
                            });
                            bounds = this.bounds && this.bounds === 'self' ? this.editorElem : this.bounds;
                            if (!bounds) {
                                bounds = this.service.config.bounds ? this.service.config.bounds : this.doc.body;
                            }
                            debug = this.debug;
                            if (!debug && debug !== false && this.service.config.debug) {
                                debug = this.service.config.debug;
                            }
                            readOnly = this.readOnly;
                            if (!readOnly && this.readOnly !== false) {
                                readOnly = this.service.config.readOnly !== undefined ? this.service.config.readOnly : false;
                            }
                            scrollingContainer = this.scrollingContainer;
                            if (!scrollingContainer && this.scrollingContainer !== null) {
                                scrollingContainer =
                                    this.service.config.scrollingContainer === null
                                        || this.service.config.scrollingContainer ? this.service.config.scrollingContainer : null;
                            }
                            formats = this.formats;
                            if (!formats && formats === undefined) {
                                formats = this.service.config.formats ? __spread(this.service.config.formats) : (this.service.config.formats === null ? null : undefined);
                            }
                            this.zone.runOutsideAngular(function () {
                                _this.quillEditor = new Quill(_this.editorElem, {
                                    bounds: bounds,
                                    debug: debug,
                                    formats: formats,
                                    modules: modules,
                                    placeholder: placeholder,
                                    readOnly: readOnly,
                                    scrollingContainer: scrollingContainer,
                                    strict: _this.strict,
                                    theme: _this.theme || (_this.service.config.theme ? _this.service.config.theme : 'snow')
                                });
                            });
                            if (this.content) {
                                format = getFormat(this.format, this.service.config.format);
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
                                        this.content = this.domSanitizer.sanitize(i0.SecurityContext.HTML, this.content);
                                    }
                                    contents = this.quillEditor.clipboard.convert(this.content);
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
                            setTimeout(function () {
                                if (_this.onValidatorChanged) {
                                    _this.onValidatorChanged();
                                }
                                _this.onEditorCreated.emit(_this.quillEditor);
                            });
                            return [2 /*return*/];
                    }
                });
            });
        };
        QuillEditorBase.prototype.ngOnDestroy = function () {
            if (this.quillEditor) {
                this.quillEditor.off('selection-change', this.selectionChangeHandler);
                this.quillEditor.off('text-change', this.textChangeHandler);
                this.quillEditor.off('editor-change', this.editorChangeHandler);
            }
        };
        QuillEditorBase.prototype.ngOnChanges = function (changes) {
            var _this = this;
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
                var currentStyling = changes['styles'].currentValue;
                var previousStyling = changes['styles'].previousValue;
                if (previousStyling) {
                    Object.keys(previousStyling).forEach(function (key) {
                        _this.renderer.removeStyle(_this.editorElem, key);
                    });
                }
                if (currentStyling) {
                    Object.keys(currentStyling).forEach(function (key) {
                        _this.renderer.setStyle(_this.editorElem, key, _this.styles[key]);
                    });
                }
            }
            if (changes['classes']) {
                var currentClasses = changes['classes'].currentValue;
                var previousClasses = changes['classes'].previousValue;
                if (previousClasses) {
                    this.removeClasses(previousClasses);
                }
                if (currentClasses) {
                    this.addClasses(currentClasses);
                }
            }
            // tslint:enable:no-string-literal
        };
        QuillEditorBase.prototype.addClasses = function (classList) {
            var _this = this;
            QuillEditorBase.normalizeClassNames(classList).forEach(function (c) {
                _this.renderer.addClass(_this.editorElem, c);
            });
        };
        QuillEditorBase.prototype.removeClasses = function (classList) {
            var _this = this;
            QuillEditorBase.normalizeClassNames(classList).forEach(function (c) {
                _this.renderer.removeClass(_this.editorElem, c);
            });
        };
        QuillEditorBase.prototype.writeValue = function (currentValue) {
            this.content = currentValue;
            var format = getFormat(this.format, this.service.config.format);
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
        };
        QuillEditorBase.prototype.setDisabledState = function (isDisabled) {
            if (isDisabled === void 0) { isDisabled = this.disabled; }
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
        };
        QuillEditorBase.prototype.registerOnChange = function (fn) {
            this.onModelChange = fn;
        };
        QuillEditorBase.prototype.registerOnTouched = function (fn) {
            this.onModelTouched = fn;
        };
        QuillEditorBase.prototype.registerOnValidatorChange = function (fn) {
            this.onValidatorChanged = fn;
        };
        QuillEditorBase.prototype.validate = function () {
            if (!this.quillEditor) {
                return null;
            }
            var err = {};
            var valid = true;
            var text = this.quillEditor.getText();
            // trim text if wanted + handle special case that an empty editor contains a new line
            var textLength = this.trimOnValidation ? text.trim().length : (text.length === 1 && text.trim().length === 0 ? 0 : text.length - 1);
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
        };
        return QuillEditorBase;
    }());
    QuillEditorBase.decorators = [
        { type: i0.Directive }
    ];
    QuillEditorBase.ctorParameters = function () { return [
        { type: i0.ElementRef },
        { type: platformBrowser.DomSanitizer },
        { type: undefined, decorators: [{ type: i0.Inject, args: [common.DOCUMENT,] }] },
        { type: undefined, decorators: [{ type: i0.Inject, args: [i0.PLATFORM_ID,] }] },
        { type: i0.Renderer2 },
        { type: i0.NgZone },
        { type: QuillService }
    ]; };
    QuillEditorBase.propDecorators = {
        format: [{ type: i0.Input }],
        theme: [{ type: i0.Input }],
        modules: [{ type: i0.Input }],
        debug: [{ type: i0.Input }],
        readOnly: [{ type: i0.Input }],
        placeholder: [{ type: i0.Input }],
        maxLength: [{ type: i0.Input }],
        minLength: [{ type: i0.Input }],
        required: [{ type: i0.Input }],
        formats: [{ type: i0.Input }],
        customToolbarPosition: [{ type: i0.Input }],
        sanitize: [{ type: i0.Input }],
        styles: [{ type: i0.Input }],
        strict: [{ type: i0.Input }],
        scrollingContainer: [{ type: i0.Input }],
        bounds: [{ type: i0.Input }],
        customOptions: [{ type: i0.Input }],
        customModules: [{ type: i0.Input }],
        trackChanges: [{ type: i0.Input }],
        preserveWhitespace: [{ type: i0.Input }],
        classes: [{ type: i0.Input }],
        trimOnValidation: [{ type: i0.Input }],
        onEditorCreated: [{ type: i0.Output }],
        onEditorChanged: [{ type: i0.Output }],
        onContentChanged: [{ type: i0.Output }],
        onSelectionChanged: [{ type: i0.Output }],
        onFocus: [{ type: i0.Output }],
        onBlur: [{ type: i0.Output }],
        valueGetter: [{ type: i0.Input }],
        valueSetter: [{ type: i0.Input }]
    };
    var QuillEditorComponent = /** @class */ (function (_super) {
        __extends(QuillEditorComponent, _super);
        function QuillEditorComponent(elementRef, domSanitizer, doc, platformId, renderer, zone, service) {
            return _super.call(this, elementRef, domSanitizer, doc, platformId, renderer, zone, service) || this;
        }
        return QuillEditorComponent;
    }(QuillEditorBase));
    QuillEditorComponent.decorators = [
        { type: i0.Component, args: [{
                    encapsulation: i0.ViewEncapsulation.None,
                    providers: [
                        {
                            multi: true,
                            provide: forms.NG_VALUE_ACCESSOR,
                            // eslint-disable-next-line @typescript-eslint/no-use-before-define
                            useExisting: i0.forwardRef(function () { return QuillEditorComponent; })
                        },
                        {
                            multi: true,
                            provide: forms.NG_VALIDATORS,
                            // eslint-disable-next-line @typescript-eslint/no-use-before-define
                            useExisting: i0.forwardRef(function () { return QuillEditorComponent; })
                        }
                    ],
                    selector: 'quill-editor',
                    template: "\n  <ng-content select=\"[quill-editor-toolbar]\"></ng-content>\n"
                },] }
    ];
    QuillEditorComponent.ctorParameters = function () { return [
        { type: i0.ElementRef, decorators: [{ type: i0.Inject, args: [i0.ElementRef,] }] },
        { type: platformBrowser.DomSanitizer, decorators: [{ type: i0.Inject, args: [platformBrowser.DomSanitizer,] }] },
        { type: undefined, decorators: [{ type: i0.Inject, args: [common.DOCUMENT,] }] },
        { type: undefined, decorators: [{ type: i0.Inject, args: [i0.PLATFORM_ID,] }] },
        { type: i0.Renderer2, decorators: [{ type: i0.Inject, args: [i0.Renderer2,] }] },
        { type: i0.NgZone, decorators: [{ type: i0.Inject, args: [i0.NgZone,] }] },
        { type: QuillService, decorators: [{ type: i0.Inject, args: [QuillService,] }] }
    ]; };

    var QuillViewHTMLComponent = /** @class */ (function () {
        function QuillViewHTMLComponent(sanitizer, service) {
            this.sanitizer = sanitizer;
            this.service = service;
            this.innerHTML = '';
            this.themeClass = 'ql-snow';
            this.content = '';
        }
        QuillViewHTMLComponent.prototype.ngOnChanges = function (changes) {
            if (changes.theme) {
                var theme = changes.theme.currentValue || (this.service.config.theme ? this.service.config.theme : 'snow');
                this.themeClass = "ql-" + theme + " ngx-quill-view-html";
            }
            else if (!this.theme) {
                var theme = this.service.config.theme ? this.service.config.theme : 'snow';
                this.themeClass = "ql-" + theme + " ngx-quill-view-html";
            }
            if (changes.content) {
                this.innerHTML = this.sanitizer.bypassSecurityTrustHtml(changes.content.currentValue);
            }
        };
        return QuillViewHTMLComponent;
    }());
    QuillViewHTMLComponent.decorators = [
        { type: i0.Component, args: [{
                    encapsulation: i0.ViewEncapsulation.None,
                    selector: 'quill-view-html',
                    template: "\n  <div class=\"ql-container\" [ngClass]=\"themeClass\">\n    <div class=\"ql-editor\" [innerHTML]=\"innerHTML\">\n    </div>\n  </div>\n",
                    styles: ["\n.ql-container.ngx-quill-view-html {\n  border: 0;\n}\n"]
                },] }
    ];
    QuillViewHTMLComponent.ctorParameters = function () { return [
        { type: platformBrowser.DomSanitizer, decorators: [{ type: i0.Inject, args: [platformBrowser.DomSanitizer,] }] },
        { type: QuillService }
    ]; };
    QuillViewHTMLComponent.propDecorators = {
        content: [{ type: i0.Input }],
        theme: [{ type: i0.Input }]
    };

    var QuillViewComponent = /** @class */ (function () {
        function QuillViewComponent(elementRef, renderer, zone, service, domSanitizer, platformId) {
            var _this = this;
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
            this.valueSetter = function (quillEditor, value) {
                var format = getFormat(_this.format, _this.service.config.format);
                var content = value;
                if (format === 'text') {
                    quillEditor.setText(content);
                }
                else {
                    if (format === 'html') {
                        if (_this.sanitize) {
                            value = _this.domSanitizer.sanitize(i0.SecurityContext.HTML, value);
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
        QuillViewComponent.prototype.ngOnChanges = function (changes) {
            if (!this.quillEditor) {
                return;
            }
            if (changes.content) {
                this.valueSetter(this.quillEditor, changes.content.currentValue);
            }
        };
        QuillViewComponent.prototype.ngAfterViewInit = function () {
            return __awaiter(this, void 0, void 0, function () {
                var Quill, modules, debug, formats, theme;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (common.isPlatformServer(this.platformId)) {
                                return [2 /*return*/];
                            }
                            return [4 /*yield*/, this.service.getQuill()];
                        case 1:
                            Quill = _a.sent();
                            modules = Object.assign({}, this.modules || this.service.config.modules);
                            modules.toolbar = false;
                            this.customOptions.forEach(function (customOption) {
                                var newCustomOption = Quill.import(customOption.import);
                                newCustomOption.whitelist = customOption.whitelist;
                                Quill.register(newCustomOption, true);
                            });
                            this.customModules.forEach(function (_a) {
                                var implementation = _a.implementation, path = _a.path;
                                Quill.register(path, implementation);
                            });
                            debug = this.debug;
                            if (!debug && debug !== false && this.service.config.debug) {
                                debug = this.service.config.debug;
                            }
                            formats = this.formats;
                            if (!formats && formats === undefined) {
                                formats = this.service.config.formats ?
                                    Object.assign({}, this.service.config.formats) : (this.service.config.formats === null ? null : undefined);
                            }
                            theme = this.theme || (this.service.config.theme ? this.service.config.theme : 'snow');
                            this.elementRef.nativeElement.insertAdjacentHTML('afterbegin', this.preserveWhitespace ? '<pre quill-view-element></pre>' : '<div quill-view-element></div>');
                            this.editorElem = this.elementRef.nativeElement.querySelector('[quill-view-element]');
                            this.zone.runOutsideAngular(function () {
                                _this.quillEditor = new Quill(_this.editorElem, {
                                    debug: debug,
                                    formats: formats,
                                    modules: modules,
                                    readOnly: true,
                                    strict: _this.strict,
                                    theme: theme
                                });
                            });
                            this.renderer.addClass(this.editorElem, 'ngx-quill-view');
                            if (this.content) {
                                this.valueSetter(this.quillEditor, this.content);
                            }
                            return [2 /*return*/];
                    }
                });
            });
        };
        return QuillViewComponent;
    }());
    QuillViewComponent.decorators = [
        { type: i0.Component, args: [{
                    encapsulation: i0.ViewEncapsulation.None,
                    selector: 'quill-view',
                    template: "\n",
                    styles: ["\n.ql-container.ngx-quill-view {\n  border: 0;\n}\n"]
                },] }
    ];
    QuillViewComponent.ctorParameters = function () { return [
        { type: i0.ElementRef },
        { type: i0.Renderer2 },
        { type: i0.NgZone },
        { type: QuillService },
        { type: platformBrowser.DomSanitizer },
        { type: undefined, decorators: [{ type: i0.Inject, args: [i0.PLATFORM_ID,] }] }
    ]; };
    QuillViewComponent.propDecorators = {
        format: [{ type: i0.Input }],
        theme: [{ type: i0.Input }],
        modules: [{ type: i0.Input }],
        debug: [{ type: i0.Input }],
        formats: [{ type: i0.Input }],
        sanitize: [{ type: i0.Input }],
        strict: [{ type: i0.Input }],
        content: [{ type: i0.Input }],
        customModules: [{ type: i0.Input }],
        customOptions: [{ type: i0.Input }],
        preserveWhitespace: [{ type: i0.Input }]
    };

    var QuillModule = /** @class */ (function () {
        function QuillModule() {
        }
        QuillModule.forRoot = function (config) {
            return {
                ngModule: QuillModule,
                providers: [
                    {
                        provide: QUILL_CONFIG_TOKEN,
                        useValue: config
                    }
                ]
            };
        };
        return QuillModule;
    }());
    QuillModule.decorators = [
        { type: i0.NgModule, args: [{
                    declarations: [
                        QuillEditorComponent,
                        QuillViewComponent,
                        QuillViewHTMLComponent
                    ],
                    exports: [QuillEditorComponent, QuillViewComponent, QuillViewHTMLComponent],
                    imports: [common.CommonModule],
                    providers: [QuillService]
                },] }
    ];

    /*
     * Public API Surface of ngx-quill
     */

    /**
     * Generated bundle index. Do not edit.
     */

    exports.QUILL_CONFIG_TOKEN = QUILL_CONFIG_TOKEN;
    exports.QuillEditorBase = QuillEditorBase;
    exports.QuillEditorComponent = QuillEditorComponent;
    exports.QuillModule = QuillModule;
    exports.QuillService = QuillService;
    exports.QuillViewComponent = QuillViewComponent;
    exports.QuillViewHTMLComponent = QuillViewHTMLComponent;
    exports.defaultModules = defaultModules;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=ngx-quill.umd.js.map
