export type Transforms = {
    pipelines: Pipeline[];
};

export type Pipeline = {
    name: string;
    steps: Step[];
};

type ReadJsonStep = {
    action: 'read-json';
    from: string;
};

type WriteJsonStep = {
    action: 'write-json';
    to: string;
};

type UploadHerokuStep = {
    action: 'upload-heroku';
    targets: string[];
};

type SetStep = {
    action: 'set';
    values: Record<string, any>;
};

type KeepKeysStep = {
    action: 'keep-keys';
    keys: string[];
};

export type Step = ReadJsonStep | WriteJsonStep | UploadHerokuStep | SetStep | KeepKeysStep;

export type HerokuAppResponse = {
    id: string;
};
