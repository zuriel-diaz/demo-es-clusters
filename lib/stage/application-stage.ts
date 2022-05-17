import * as cdk from 'aws-cdk-lib'
import { Stage } from 'aws-cdk-lib'
import { Construct } from 'constructs'

import { environments } from '../../bin/demo-elasticsearch-infrastructure'
import { esSystemTags } from '../../lib/config/elasticsearch'
import { CobaltElasticSearchInfrastructureStack } from '../stacks/demo-elasticsearch-infrastructure-stack'
import { ApplicationStageProps, ESDomain, Target } from '../types'

const esDomains = [ESDomain.PRODUCTS, ESDomain.KEYWORDS_CATEGORIES]

export class ApplicationStage extends Stage {
  constructor(scope: Construct, id: string, props: ApplicationStageProps) {
    super(scope, id, props)

    const { target } = props
    const stacks: cdk.Stack[] = []

    esDomains.forEach((domainType) => {
      const stack = new CobaltElasticSearchInfrastructureStack(
        this,
        `CobaltElasticSearch${domainType}InfrastructureStack`,
        {
          stackName: `CobaltElasticSearch${domainType}InfrastructureStack`,
          esDomainType: domainType,
          env: environments[target],
          target,
        },
      )
      stacks.push(stack)

      cdk.Tags.of(stack).add('System', esSystemTags[domainType])
    })

    stacks.forEach((stack) => {
      cdk.Tags.of(stack).add('Env', target === Target.PROD ? 'Production' : 'PreProduction')
      cdk.Tags.of(stack).add('Product', 'Cobalt')
      cdk.Tags.of(stack).add('Repo', 'https://github.com/Junglescout/cobalt-elasticsearch-infrastructure')
      cdk.Tags.of(stack).add('Retailer', 'Amazon')
      cdk.Tags.of(stack).add('Squad', 'Cobalt')
    })
  }
}
