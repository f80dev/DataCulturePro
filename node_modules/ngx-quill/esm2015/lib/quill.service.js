import { __awaiter } from "tslib";
import { Injectable, Inject } from '@angular/core';
import { QUILL_CONFIG_TOKEN } from './quill-editor.interfaces';
import { defaultModules } from './quill-defaults';
import * as i0 from "@angular/core";
import * as i1 from "./quill-editor.interfaces";
export class QuillService {
    constructor(config) {
        this.config = config;
        this.count = 0;
        if (!this.config) {
            this.config = { modules: defaultModules };
        }
    }
    getQuill() {
        this.count++;
        if (!this.Quill && this.count === 1) {
            this.$importPromise = new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const quillImport = yield import('quill');
                this.Quill = (quillImport.default ? quillImport.default : quillImport);
                // Only register custom options and modules once
                (_a = this.config.customOptions) === null || _a === void 0 ? void 0 : _a.forEach((customOption) => {
                    const newCustomOption = this.Quill.import(customOption.import);
                    newCustomOption.whitelist = customOption.whitelist;
                    this.Quill.register(newCustomOption, true, this.config.suppressGlobalRegisterWarning);
                });
                (_b = this.config.customModules) === null || _b === void 0 ? void 0 : _b.forEach(({ implementation, path }) => {
                    this.Quill.register(path, implementation, this.config.suppressGlobalRegisterWarning);
                });
                resolve(this.Quill);
            }));
        }
        return this.$importPromise;
    }
}
QuillService.ɵprov = i0.ɵɵdefineInjectable({ factory: function QuillService_Factory() { return new QuillService(i0.ɵɵinject(i1.QUILL_CONFIG_TOKEN)); }, token: QuillService, providedIn: "root" });
QuillService.decorators = [
    { type: Injectable, args: [{
                providedIn: 'root'
            },] }
];
QuillService.ctorParameters = () => [
    { type: undefined, decorators: [{ type: Inject, args: [QUILL_CONFIG_TOKEN,] }] }
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVpbGwuc2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Byb2plY3RzL25neC1xdWlsbC9zcmMvbGliL3F1aWxsLnNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFFLE1BQU0sZUFBZSxDQUFBO0FBQ2xELE9BQU8sRUFBRSxrQkFBa0IsRUFBZSxNQUFNLDJCQUEyQixDQUFBO0FBQzNFLE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQTs7O0FBS2pELE1BQU0sT0FBTyxZQUFZO0lBS3ZCLFlBQ3FDLE1BQW1CO1FBQW5CLFdBQU0sR0FBTixNQUFNLENBQWE7UUFIaEQsVUFBSyxHQUFHLENBQUMsQ0FBQTtRQUtmLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQ2hCLElBQUksQ0FBQyxNQUFNLEdBQUcsRUFBRSxPQUFPLEVBQUUsY0FBYyxFQUFFLENBQUE7U0FDMUM7SUFDSCxDQUFDO0lBRUQsUUFBUTtRQUNOLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQTtRQUNaLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxLQUFLLEtBQUssQ0FBQyxFQUFFO1lBQ25DLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxPQUFPLENBQUMsQ0FBTyxPQUFPLEVBQUUsRUFBRTs7Z0JBQ2xELE1BQU0sV0FBVyxHQUFHLE1BQU0sTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFBO2dCQUV6QyxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFRLENBQUE7Z0JBRTdFLGdEQUFnRDtnQkFDaEQsTUFBQSxJQUFJLENBQUMsTUFBTSxDQUFDLGFBQWEsMENBQUUsT0FBTyxDQUFDLENBQUMsWUFBWSxFQUFFLEVBQUU7b0JBQ2xELE1BQU0sZUFBZSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQTtvQkFDOUQsZUFBZSxDQUFDLFNBQVMsR0FBRyxZQUFZLENBQUMsU0FBUyxDQUFBO29CQUNsRCxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxlQUFlLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsNkJBQTZCLENBQUMsQ0FBQTtnQkFDdkYsQ0FBQyxFQUFDO2dCQUVGLE1BQUEsSUFBSSxDQUFDLE1BQU0sQ0FBQyxhQUFhLDBDQUFFLE9BQU8sQ0FBQyxDQUFDLEVBQUMsY0FBYyxFQUFFLElBQUksRUFBQyxFQUFFLEVBQUU7b0JBQzVELElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxjQUFjLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyw2QkFBNkIsQ0FBQyxDQUFBO2dCQUN0RixDQUFDLEVBQUM7Z0JBRUYsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQTtZQUNyQixDQUFDLENBQUEsQ0FBQyxDQUFBO1NBQ0g7UUFDRCxPQUFPLElBQUksQ0FBQyxjQUFjLENBQUE7SUFDNUIsQ0FBQzs7OztZQXZDRixVQUFVLFNBQUM7Z0JBQ1YsVUFBVSxFQUFFLE1BQU07YUFDbkI7Ozs0Q0FPSSxNQUFNLFNBQUMsa0JBQWtCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSW5qZWN0YWJsZSwgSW5qZWN0IH0gZnJvbSAnQGFuZ3VsYXIvY29yZSdcbmltcG9ydCB7IFFVSUxMX0NPTkZJR19UT0tFTiwgUXVpbGxDb25maWcgfSBmcm9tICcuL3F1aWxsLWVkaXRvci5pbnRlcmZhY2VzJ1xuaW1wb3J0IHsgZGVmYXVsdE1vZHVsZXMgfSBmcm9tICcuL3F1aWxsLWRlZmF1bHRzJ1xuXG5ASW5qZWN0YWJsZSh7XG4gIHByb3ZpZGVkSW46ICdyb290J1xufSlcbmV4cG9ydCBjbGFzcyBRdWlsbFNlcnZpY2Uge1xuICBwcml2YXRlIFF1aWxsITogYW55XG4gIHByaXZhdGUgJGltcG9ydFByb21pc2UhOiBQcm9taXNlPGFueT5cbiAgcHJpdmF0ZSBjb3VudCA9IDBcblxuICBjb25zdHJ1Y3RvcihcbiAgICBASW5qZWN0KFFVSUxMX0NPTkZJR19UT0tFTikgcHVibGljIGNvbmZpZzogUXVpbGxDb25maWdcbiAgKSB7XG4gICAgaWYgKCF0aGlzLmNvbmZpZykge1xuICAgICAgdGhpcy5jb25maWcgPSB7wqBtb2R1bGVzOiBkZWZhdWx0TW9kdWxlcyB9XG4gICAgfVxuICB9XG5cbiAgZ2V0UXVpbGwoKSB7XG4gICAgdGhpcy5jb3VudCsrXG4gICAgaWYgKCF0aGlzLlF1aWxsICYmIHRoaXMuY291bnQgPT09IDEpIHtcbiAgICAgIHRoaXMuJGltcG9ydFByb21pc2UgPSBuZXcgUHJvbWlzZShhc3luYyAocmVzb2x2ZSkgPT4ge1xuICAgICAgICBjb25zdCBxdWlsbEltcG9ydCA9IGF3YWl0IGltcG9ydCgncXVpbGwnKVxuXG4gICAgICAgIHRoaXMuUXVpbGwgPSAocXVpbGxJbXBvcnQuZGVmYXVsdCA/IHF1aWxsSW1wb3J0LmRlZmF1bHQgOiBxdWlsbEltcG9ydCkgYXMgYW55XG5cbiAgICAgICAgLy8gT25seSByZWdpc3RlciBjdXN0b20gb3B0aW9ucyBhbmQgbW9kdWxlcyBvbmNlXG4gICAgICAgIHRoaXMuY29uZmlnLmN1c3RvbU9wdGlvbnM/LmZvckVhY2goKGN1c3RvbU9wdGlvbikgPT4ge1xuICAgICAgICAgIGNvbnN0IG5ld0N1c3RvbU9wdGlvbiA9IHRoaXMuUXVpbGwuaW1wb3J0KGN1c3RvbU9wdGlvbi5pbXBvcnQpXG4gICAgICAgICAgbmV3Q3VzdG9tT3B0aW9uLndoaXRlbGlzdCA9IGN1c3RvbU9wdGlvbi53aGl0ZWxpc3RcbiAgICAgICAgICB0aGlzLlF1aWxsLnJlZ2lzdGVyKG5ld0N1c3RvbU9wdGlvbiwgdHJ1ZSwgdGhpcy5jb25maWcuc3VwcHJlc3NHbG9iYWxSZWdpc3Rlcldhcm5pbmcpXG4gICAgICAgIH0pXG5cbiAgICAgICAgdGhpcy5jb25maWcuY3VzdG9tTW9kdWxlcz8uZm9yRWFjaCgoe2ltcGxlbWVudGF0aW9uLCBwYXRofSkgPT4ge1xuICAgICAgICAgIHRoaXMuUXVpbGwucmVnaXN0ZXIocGF0aCwgaW1wbGVtZW50YXRpb24sIHRoaXMuY29uZmlnLnN1cHByZXNzR2xvYmFsUmVnaXN0ZXJXYXJuaW5nKVxuICAgICAgICB9KVxuXG4gICAgICAgIHJlc29sdmUodGhpcy5RdWlsbClcbiAgICAgIH0pXG4gICAgfVxuICAgIHJldHVybiB0aGlzLiRpbXBvcnRQcm9taXNlXG4gIH1cbn1cbiJdfQ==