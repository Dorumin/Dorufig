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

type SetPath = [string[], any];

type SetStep = {
    action: 'set';
    values: Record<string, any> | SetPath[];
};

type KeepKeysStep = {
    action: 'keep-keys';
    keys: string[];
};

type ReadTextStep = {
    action: 'read-text';
    from: string;
};

type WriteTextStep = {
    action: 'write-text';
    to: string;
};

export type Step
    = ReadJsonStep
    | WriteJsonStep
    | UploadHerokuStep
    | SetStep
    | KeepKeysStep
    | ReadTextStep
    | WriteTextStep;

export type HerokuAppResponse = {
    id: string;
};
