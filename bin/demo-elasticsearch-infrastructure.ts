#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { PipelineStack } from '../lib/stacks/pipeline-stack'
import { Target } from '../lib/types'

const app = new cdk.App()

export const environments = {
  [Target.DEV]: { account: '539233455189', region: 'us-west-2' },
  [Target.STAGING]: { account: '539233455189', region: 'us-west-2' },
  [Target.PROD]: { account: '539233455189', region: 'us-west-2' },
}

export const ciEnvironment = {
  account: '539233455189',
  region: 'us-west-2',
}

const pipelineStack = new PipelineStack(app, 'CobaltESInfrastructurePipelineStack', {
  env: ciEnvironment,
})

cdk.Tags.of(pipelineStack).add('Env', 'Deployment')
cdk.Tags.of(pipelineStack).add('Product', 'Cobalt')
cdk.Tags.of(pipelineStack).add('System', 'SharedSearch')
cdk.Tags.of(pipelineStack).add('Repo', 'https://github.com/Junglescout/cobalt-elasticsearch-infrastructure')
cdk.Tags.of(pipelineStack).add('Retailer', 'Amazon')
cdk.Tags.of(pipelineStack).add('Squad', 'Cobalt')
