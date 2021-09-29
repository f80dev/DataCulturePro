import { QuillConfig } from './quill-editor.interfaces';
export declare class QuillService {
    config: QuillConfig;
    private Quill;
    private $importPromise;
    private count;
    constructor(config: QuillConfig);
    getQuill(): Promise<any>;
}
