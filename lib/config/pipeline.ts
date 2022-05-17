import { EventAction, FilterGroup } from 'aws-cdk-lib/aws-codebuild'

export const owner = 'Junglescout'
export const repo = 'cobalt-elasticsearch-infrastructure'
export const branch = 'master'
export const connection =
  'arn:aws:codestar-connections:us-west-2:270462811554:connection/f91fda8a-2429-4024-bd8d-5c90f104628d'
export const appName = 'CobaltElasticsearchInfrastructure'

export const webhookFilters = [
  FilterGroup.inEventOf(
    EventAction.PULL_REQUEST_CREATED,
    EventAction.PULL_REQUEST_UPDATED,
    EventAction.PULL_REQUEST_REOPENED,
  ),
]
