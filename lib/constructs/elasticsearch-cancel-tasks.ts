import * as path from 'path'
import * as lambdaPython from '@aws-cdk/aws-lambda-python-alpha'
import * as cdk from 'aws-cdk-lib'
import * as es from 'aws-cdk-lib/aws-elasticsearch'
import { Rule, Schedule } from 'aws-cdk-lib/aws-events'
import * as targets from 'aws-cdk-lib/aws-events-targets'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as logs from 'aws-cdk-lib/aws-logs'
import { Construct } from 'constructs'
import { domainConfigMap, CancelTaskConfig } from '../config/elasticsearch'
import { EsCancelTaskProps } from '../types'

export class ElasticSearchCancelTasks extends Construct {
  constructor(scope: Construct, id: string, props: EsCancelTaskProps) {
    super(scope, id)

    const { target, esDomainType, domain } = props
    const { cancelTaskConfig } = domainConfigMap[esDomainType][target]

    if (cancelTaskConfig) {
      this.createTaskCancellationLambda(cancelTaskConfig, domain)
    }
  }

  private createTaskCancellationLambda(cancelTaskConfig: CancelTaskConfig, domain: es.Domain): void {
    const { domainArn } = cancelTaskConfig
    const lambdaProcessTimeoutMinutes = 15
    const lambdaPath = `${path.join(__dirname, '../../lambda')}`

    const taskCancellatonLambda = new lambdaPython.PythonFunction(this, 'TaskCancellationLambda', {
      runtime: lambda.Runtime.PYTHON_3_8,
      logRetention: logs.RetentionDays.ONE_DAY,
      entry: `${lambdaPath}/python`,
      index: './cancel/es_queries_long_cancel.py',
      handler: 'lambda_handler',
      description: `ElasticSearch ${domain.domainName} Task Cancellation function`,
      memorySize: 2048,
      reservedConcurrentExecutions: 10,
      timeout: cdk.Duration.minutes(lambdaProcessTimeoutMinutes),
      environment: {
        ES_HOST: domain.domainEndpoint,
        MAX_TIME_IN_SECONDS: '60',
      },
    })

    this.addSchedulerRules(taskCancellatonLambda)
    this.addLambdaPolicies(taskCancellatonLambda, domainArn)
  }
  private addSchedulerRules(taskCancellatonLambda: lambdaPython.PythonFunction) {
    new Rule(this, 'ScheduleRule', {
      schedule: Schedule.rate(cdk.Duration.minutes(5)),
      targets: [new targets.LambdaFunction(taskCancellatonLambda)],
    })
  }

  private addLambdaPolicies(taskCancellatonLambda: lambdaPython.PythonFunction, role: string): void {
    taskCancellatonLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['es:ESHttpPut', 'es:ESHttpPost', 'es:ESHttpGet', 'es:ESHttpDelete'],
        resources: [role],
      }),
    )
  }
}
