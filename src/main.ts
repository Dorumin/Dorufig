import got from 'got';
import { unreachable } from 'assertmin';
import { readFile, writeFile } from 'fs/promises';
import { HerokuAppResponse, Pipeline, Transforms } from './types';
import transforms from '../transforms.json';

type MeanwhileArgs<T> = {
    promise: Promise<T> | (() => Promise<T>);
    every: number;
    fn: (index: number) => void;
};

function meanwhile<T>({ promise, every, fn }: MeanwhileArgs<T>): Promise<T> {
    let i = 0;

    fn(i);

    const intervalId = setInterval(() => {
        i++;
        fn(i);
    }, every);

    if (typeof promise === 'function') {
        const prom = promise();

        prom.then(() => clearInterval(intervalId));

        return prom;
    }

    promise.then(() => clearInterval(intervalId));

    return promise;
}

async function getHerokuAppId(appname: string, token: string) {
    const first = await got(`https://api.heroku.com/teams/apps/${appname}`, {
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.heroku+json; version=3'
        }
    }).json<HerokuAppResponse>();

    return first.id;
}

function normalizeHerokuConfig(config: any, existing: any) {
    const o: Record<string, string | null> = {};

    for (const key in existing) {
        // Remove existing keys that aren't in the new config to push
        o[key] = null;
    }

    for (const key in config) {
        const val = config[key];

        if (typeof val == 'object') {
            o[key] = JSON.stringify(val);
        } else {
            o[key] = val;
        }
    }

    o.HEROKU = 'true';

    return o;
}

async function pushToHeroku(id: string, token: string, config: any) {
    const prevConfig = await got(`https://api.heroku.com/apps/${id}/config-vars`, {
        headers: {
            Authorization: 'Bearer ' + token,
            Accept: 'application/vnd.heroku+json; version=3'
        }
    }).json();

    await got.patch(`https://api.heroku.com/apps/${id}/config-vars`, {
        json: normalizeHerokuConfig(config, prevConfig),
        headers: {
            Authorization: 'Bearer ' + token,
            Accept: 'application/vnd.heroku+json; version=3'
        }
    });
}

async function doPipeline(pipeline: Pipeline) {
    console.group(pipeline.name);

    let state: any = undefined;

    for (const step of pipeline.steps) {
        switch (step.action) {
            case 'read-json':
                const file = await readFile(step.from);
                state = JSON.parse(file.toString());
                console.log(`Read JSON ${step.from}`);
                break;
            case 'write-json':
                await writeFile(step.to, JSON.stringify(state, null, 4));
                console.log(`Written to disk ${step.to}`);
                break;
            case 'set':
                if (Array.isArray(step.values)) {
                    let curState = state;
                    for (const [path, value] of step.values) {
                        for (let i = 0; i < path.length; i++) {
                            const key = path[i];

                            if (i === path.length - 1) {
                                curState[key] = value;
                            } else {
                                curState = state[key];
                            }
                        }
                    }
                } else {
                    Object.assign(state, step.values);
                }
                break;
            case 'upload-heroku':
                for (const target of step.targets) {
                    await meanwhile({
                        promise: async () => {
                            const token = state.HEROKU_TOKENS[target];

                            const id = await getHerokuAppId(target, token);

                            await pushToHeroku(id, token, state);
                        },
                        every: 1000,
                        fn: (index) => {
                            const dots = new Array(index % 4 + 1).join('.');

                            process.stdout.write(`\r\x1b[K  Uploading to heroku: ${target}${dots}`);
                        }
                    });

                    process.stdout.write('\n');
                }
                break;
            case 'keep-keys':
                console.log(`Kept only ${step.keys}`);

                for (const key in state) {
                    if (!step.keys.includes(key)) {
                        delete state[key];
                    }
                }

                break;
            case 'read-text':
                state = (await readFile(step.from)).toString();
                console.log(`Read text ${step.from}`);
                break;
            case 'write-text':
                await writeFile(step.to, state, {
                    flag: 'r+'
                });
                console.log(`Written to disk ${step.to}`);
                break;
            default:
                unreachable(step);
        }
    }

    console.groupEnd();
}

async function sync() {
    for (const pipeline of (transforms as Transforms).pipelines) {
        await doPipeline(pipeline);
    }
}

module.exports = sync;

if (require.main === module) {
    sync();
}
