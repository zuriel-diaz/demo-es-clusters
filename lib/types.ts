import * as cdk from 'aws-cdk-lib'
import * as es from 'aws-cdk-lib/aws-elasticsearch'
import * as sns from 'aws-cdk-lib/aws-sns'

export enum Target {
  DEV = 'development',
  STAGING = 'staging',
  PROD = 'production',
}

export enum ESDomain {
  PRODUCTS = 'Products',
  KEYWORDS_CATEGORIES = 'KeywordsCategories',
}

export enum ESSync {
  PRODUCTS = 'Products',
  KEYWORDS = 'Keywords',
}

export interface EsStackProps extends cdk.StackProps {
  target: Target
  esDomainType: ESDomain
  alarmTopics?: EsAlarmTopics
}

export interface EsSyncProps extends cdk.StackProps {
  target: Target
  domain: es.Domain
  esSyncType: ESSync
}

export interface EsSnapshotProps extends cdk.StackProps {
  target: Target
  esDomainType: ESDomain
  domain: es.Domain
}

export interface EsCancelTaskProps extends cdk.StackProps {
  target: Target
  esDomainType: ESDomain
  domain: es.Domain
}

export interface EsSnapshotStackProps extends cdk.StackProps {
  target: Target
}

export interface EsAlarmProps extends cdk.StackProps {
  esDomainType: ESDomain
  domain: es.Domain
  alarmTopics: EsAlarmTopics
}

export interface EsAlarmStackProps extends cdk.StackProps {
  target: Target
}

export interface EsAlarmTopics extends cdk.StackProps {
  pagerDutyAlarmTopic: sns.ITopic
  slackAlarmTopic: sns.ITopic
}

export interface ApplicationStageProps extends cdk.StageProps {
  target: Target
}
