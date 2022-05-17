import { Stack, StackProps } from 'aws-cdk-lib'
import { BuildSpec, ComputeType, LinuxBuildImage, Project, Source } from 'aws-cdk-lib/aws-codebuild'
import { CodePipeline, CodePipelineSource, ShellStep, ManualApprovalStep, CodeBuildStep } from 'aws-cdk-lib/pipelines'
import { Construct } from 'constructs'
import { environments } from '../../bin/demo-elasticsearch-infrastructure'
import { owner, repo, webhookFilters, branch, connection, appName } from '../config/pipeline'
import { ApplicationStage } from '../stage/application-stage'
import { Target } from '../types'

export class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    this.createPullRequestBuilds()

    const pipeline = new CodePipeline(this, 'Pipeline', {
      pipelineName: `${appName}-Pipeline`,
      crossAccountKeys: true,
      synth: new ShellStep('Synth', {
        input: CodePipelineSource.connection(`${owner}/${repo}`, branch, {
          connectionArn: connection,
        }),
        commands: ['npm ci', 'npm run build', 'npx cdk synth'],
      }),
      codeBuildDefaults: {
        buildEnvironment: {
          privileged: true,
        },
      },
    })

    const pythonInstallCommands = ['cd lambda/python', 'pip install pipenv', 'pipenv install --dev']

    pipeline.addWave('QA', {
      pre: [
        new CodeBuildStep('PythonLint', {
          installCommands: pythonInstallCommands,
          commands: ['pipenv run python3 manage.py lint'],
        }),
        new CodeBuildStep('PythonTypecheck', {
          installCommands: pythonInstallCommands,
          commands: ['pipenv run python3 manage.py typecheck'],
        }),
        new CodeBuildStep('PythonFormatter', {
          installCommands: pythonInstallCommands,
          commands: ['pipenv run python3 manage.py formatting --check'],
        }),
      ],
    })

    pipeline.addStage(
      new ApplicationStage(this, 'Staging', { env: environments[Target.STAGING], target: Target.STAGING }),
    )

    pipeline.addStage(
      new ApplicationStage(this, 'Production', { env: environments[Target.PROD], target: Target.PROD }),
      {
        pre: [new ManualApprovalStep('Approval')],
      },
    )
  }

  private createPullRequestBuilds() {
    const source = Source.gitHub({
      owner,
      repo,
      webhookFilters,
    })

    new Project(this, 'InfrastructureLint', {
      source,
      environment: {
        buildImage: LinuxBuildImage.STANDARD_5_0,
        computeType: ComputeType.SMALL,
        privileged: true,
      },
      buildSpec: BuildSpec.fromSourceFilename('lib/build-specs/infrastructure-test.yml'),
    })

    new Project(this, 'LambdaLint', {
      source,
      environment: {
        buildImage: LinuxBuildImage.STANDARD_5_0,
        computeType: ComputeType.SMALL,
      },
      buildSpec: BuildSpec.fromSourceFilename('lib/build-specs/lambda-test.yml'),
    })
  }
}
