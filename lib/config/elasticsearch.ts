import * as cdk from 'aws-cdk-lib'
import * as es from 'aws-cdk-lib/aws-elasticsearch'
import * as iam from 'aws-cdk-lib/aws-iam'
import { ESDomain, ESSync, Target } from '../types'

export interface CancelTaskConfig {
  esEndpoint: string
  domainArn: string
}

export interface ElasticSearchConfig {
  domainConfig: ElasticSearchDomainConfig
  ipsAllowedPolicy?: string[]
  esSyncProcess?: boolean
  cancelTaskProcess?: boolean
  esAlarms?: boolean
  sourceSnapshotConfig?: ElasticSearchSnapshotConfig
  skipMasterTypeValidation?: boolean
  cancelTaskConfig?: CancelTaskConfig
}

export interface ElasticSearchSnapshotConfig {
  bucketName: string
  indexes: string[]
  esEndpoint: string
  esDomainArn?: string
  region?: string
  roleArn: string
  assumedRoleArn?: string
}

export interface ElasticSearchDomainConfig {
  domainName: string
  zoneAwareness?: es.ZoneAwarenessConfig
  version?: es.ElasticsearchVersion
  capacity?: es.CapacityConfig
  ebs?: es.EbsOptions
  removalPolicy?: cdk.RemovalPolicy
  logging?: es.LoggingOptions
  accessPolicies?: iam.PolicyStatement[]
}

const ipsAllowedPolicy = [
  '3.220.4.0',
  '35.160.32.19',
  '52.37.36.159',
  '35.81.46.51',
  '35.81.148.108',
  '44.234.138.122',
  '52.10.130.111',
  '52.88.34.148',
  '54.200.251.131',
  '35.80.172.221',
  '35.160.220.183',
  '34.223.28.20',
]

export const domainConfigMap: {
  [key in ESDomain]: { [target in Target]: ElasticSearchConfig }
} = {
  [ESDomain.PRODUCTS]: {
    [Target.DEV]: {
      domainConfig: {
        domainName: 'dev-products',
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      },
    },
    [Target.STAGING]: {
      cancelTaskProcess: true,
      esSyncProcess: true,
      domainConfig: {
        domainName: 'staging-products',
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      },
      cancelTaskConfig: {
        esEndpoint: 'https://search-staging-products-ujjux2ws7nleuv3sq7ndri4dv4.us-west-2.es.amazonaws.com',
        domainArn: 'arn:aws:es:us-west-2:407089313336:domain/staging-products/*',
      },
    },
    [Target.PROD]: {
      esAlarms: true,
      esSyncProcess: true,
      cancelTaskProcess: true,
      ipsAllowedPolicy,
      skipMasterTypeValidation: true,
      domainConfig: {
        zoneAwareness: { availabilityZoneCount: 3, enabled: true },
        domainName: 'prod-products',
        capacity: {
          masterNodes: 3,
          masterNodeInstanceType: 'c5.xlarge.elasticsearch',
          dataNodes: 33,
          dataNodeInstanceType: 'i3.2xlarge.elasticsearch',
        },
      },
      sourceSnapshotConfig: {
        indexes: ['js_products_prod'],
        esEndpoint: 'https://search-prod-pipelines-products-i6wzhndkz3jgp4v6fex2nuxmwm.us-west-2.es.amazonaws.com',
        bucketName: `jsp-elasticsearch-snapshot`,
        roleArn: `arn:aws:iam::842308738942:role/jsp-elasticsearch-snapshot-role`,
        assumedRoleArn: `arn:aws:iam::842308738942:role/jsp-elasticsearch-snapshot-assumedrole`,
      },
      cancelTaskConfig: {
        esEndpoint: 'https://search-prod-products-ktt6ethpekgm4oqwso4ktzpdky.us-west-2.es.amazonaws.com',
        domainArn: 'arn:aws:es:us-west-2:752469711606:domain/prod-products/*',
      },
    },
  },

  [ESDomain.KEYWORDS_CATEGORIES]: {
    [Target.DEV]: {
      domainConfig: {
        domainName: 'dev-keywords-categories',
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      },
      // sourceSnapshotConfig: {
      //   indexes: ['js_keywords_prod', 'js_categories_prod'],
      //   esEndpoint: 'https://search-staging-keywords-categories-j5anwj4c72i4stb3rdfifwepgq.us-west-2.es.amazonaws.com',
      //   bucketName: `cobalt-elasticsearch-snapshot-staging`,
      //   roleArn: `arn:aws:iam::407089313336:role/cobalt-elasticsearch-snapshot-role`,
      //   assumedRoleArn: `arn:aws:iam::407089313336:role/cobalt-elasticsearch-snapshot-assumedrole`,
      // },
    },
    [Target.STAGING]: {
      esSyncProcess: true,
      cancelTaskProcess: true,
      domainConfig: {
        domainName: 'staging-keywords-categories',
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      },
      cancelTaskConfig: {
        esEndpoint: 'https://search-staging-keywords-categories-j5anwj4c72i4stb3rdfifwepgq.us-west-2.es.amazonaws.com',
        domainArn: 'arn:aws:es:us-west-2:407089313336:domain/staging-keywords-categories/*',
      },
    },
    [Target.PROD]: {
      esAlarms: true,
      esSyncProcess: true,
      cancelTaskProcess: true,
      ipsAllowedPolicy,
      skipMasterTypeValidation: true,
      domainConfig: {
        zoneAwareness: { availabilityZoneCount: 3 },
        domainName: 'prod-keywords-categories',
        capacity: {
          masterNodes: 3,
          masterNodeInstanceType: 'c5.large.elasticsearch',
          dataNodes: 18,
          dataNodeInstanceType: 'i3.2xlarge.elasticsearch',
        },
      },
      sourceSnapshotConfig: {
        indexes: ['js_keywords_prod', 'js_categories_prod'],
        esEndpoint: 'https://search-pipeline-v2-75tyfgu3wof2nsf7w4eainoare.us-west-2.es.amazonaws.com',
        bucketName: `jsp-elasticsearch-snapshot`,
        roleArn: `arn:aws:iam::842308738942:role/jsp-elasticsearch-snapshot-role`,
        assumedRoleArn: `arn:aws:iam::842308738942:role/jsp-elasticsearch-snapshot-assumedrole`,
      },
      cancelTaskConfig: {
        esEndpoint: 'https://search-prod-keywords-categories-razkqcnmxcchrwen2wjn3yzvua.us-west-2.es.amazonaws.com',
        domainArn: 'arn:aws:es:us-west-2:752469711606:domain/prod-keywords-categories/*',
      },
    },
  },
}

export const esSyncProcessMap: { [key in ESDomain]: ESSync[] } = {
  [ESDomain.PRODUCTS]: [ESSync.PRODUCTS],
  [ESDomain.KEYWORDS_CATEGORIES]: [ESSync.KEYWORDS],
}

export const esSystemTags = {
  [ESDomain.PRODUCTS]: 'ProductSearch',
  [ESDomain.KEYWORDS_CATEGORIES]: 'KeywordSearch',
}
