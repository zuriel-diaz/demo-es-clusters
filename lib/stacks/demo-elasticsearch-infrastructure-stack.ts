import * as cdk from 'aws-cdk-lib'
import * as es from 'aws-cdk-lib/aws-elasticsearch'
import * as iam from 'aws-cdk-lib/aws-iam'
import { Construct } from 'constructs'
import { domainConfigMap } from '../config/elasticsearch'
import { ElasticSearchCancelTasks } from '../constructs/elasticsearch-cancel-tasks'
import { EsStackProps } from '../types'

export class CobaltElasticSearchInfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: EsStackProps) {
    super(scope, id, props)

    const { target, esDomainType } = props
    const { domainConfig, ipsAllowedPolicy, cancelTaskConfig, skipMasterTypeValidation } =
      domainConfigMap[esDomainType][target]

    // Due to issue: https://github.com/aws/aws-cdk/issues/11898
    // Needs to change temporarily the master instance type to the same as the node type to avoid validation.
    const masterNodeInstanceType = domainConfig.capacity?.masterNodeInstanceType
    if (skipMasterTypeValidation) {
      domainConfig.capacity = {
        ...domainConfig.capacity,
        masterNodeInstanceType: domainConfig.capacity?.dataNodeInstanceType,
      }
    }

    const domain = new es.Domain(this, 'CobaltESDomain', {
      version: es.ElasticsearchVersion.V6_8,
      ebs: { enabled: false },
      zoneAwareness: { enabled: false },
      logging: {
        appLogEnabled: true,
        slowIndexLogEnabled: true,
        slowSearchLogEnabled: true,
      },
      encryptionAtRest: {
        enabled: true,
      },
      nodeToNodeEncryption: true,
      capacity: {
        masterNodes: 3,
        masterNodeInstanceType: 'i3.large.elasticsearch',
        dataNodes: 3,
        dataNodeInstanceType: 'i3.large.elasticsearch',
      },
      accessPolicies: this.loadPolicies(domainConfig.domainName, ipsAllowedPolicy),
      ...domainConfig,
    })

    // Due to issue: https://github.com/aws/aws-cdk/issues/11898
    // Change the master instance type back to original in the cfn template after the validation gets passed.
    if (skipMasterTypeValidation) {
      const cfnDomain = domain.node.defaultChild as es.CfnDomain
      cfnDomain.elasticsearchClusterConfig = {
        ...cfnDomain.elasticsearchClusterConfig,
        dedicatedMasterType: masterNodeInstanceType,
      }
    }

    if (cancelTaskConfig) {
      new ElasticSearchCancelTasks(this, 'Cancel', {
        domain,
        esDomainType,
        target,
      })
    }
  }

  /**
   * @returns the policies to be attached to the Domain
   */
  private loadPolicies(domainName: string, ipsAllowedPolicy?: string[]): iam.PolicyStatement[] {
    const policies: iam.PolicyStatement[] = [
      new iam.PolicyStatement({
        actions: ['es:*'],
        resources: [`arn:aws:es:${this.region}:${this.account}:domain/${domainName}/*`],
        principals: [new iam.AccountRootPrincipal()],
      }),
    ]

    if (ipsAllowedPolicy?.length) {
      policies.push(
        new iam.PolicyStatement({
          actions: ['es:*'],
          resources: [`arn:aws:es:${this.region}:${this.account}:domain/${domainName}/*`],
          principals: [new iam.AnyPrincipal()],
          conditions: {
            IpAddress: {
              'aws:SourceIp': ipsAllowedPolicy,
            },
          },
        }),
      )
    }

    return policies
  }
}
