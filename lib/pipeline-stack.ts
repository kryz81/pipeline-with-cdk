import { SecretValue, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { Artifact, Pipeline } from "aws-cdk-lib/aws-codepipeline";
import {
  CloudFormationCreateUpdateStackAction,
  CodeBuildAction,
  GitHubSourceAction,
} from "aws-cdk-lib/aws-codepipeline-actions";
import {
  BuildSpec,
  LinuxBuildImage,
  PipelineProject,
} from "aws-cdk-lib/aws-codebuild";

export class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const pipeline = new Pipeline(this, "pipeline", {
      pipelineName: "Pipeline",
      crossAccountKeys: false,
      restartExecutionOnUpdate: true,
    });

    const sourceOutput = new Artifact("SourceOutput");
    const sourceOutputCode = new Artifact("SourceOutputCode");

    pipeline.addStage({
      stageName: "Source",
      actions: [
        new GitHubSourceAction({
          owner: "kryz81",
          repo: "pipeline-with-cdk",
          branch: "master",
          actionName: "PipelineSource",
          oauthToken: SecretValue.secretsManager("github-token"),
          output: sourceOutput,
        }),
        new GitHubSourceAction({
          owner: "kryz81",
          repo: "aws-codepipeline-sample-app",
          branch: "main",
          actionName: "PipelineSource-code",
          oauthToken: SecretValue.secretsManager("github-token"),
          output: sourceOutputCode,
        }),
      ],
    });

    const buildOutput = new Artifact("BuildOutput");
    const serviceOutput = new Artifact("ServiceOutput");

    pipeline.addStage({
      stageName: "Build",
      actions: [
        new CodeBuildAction({
          actionName: "CDK_Build",
          input: sourceOutput,
          outputs: [buildOutput],
          project: new PipelineProject(this, "CdkBuildProject", {
            environment: {
              buildImage: LinuxBuildImage.STANDARD_5_0,
            },
            buildSpec: BuildSpec.fromSourceFilename(
              "build-specs/cdk-build-spec.yml"
            ),
          }),
        }),
        new CodeBuildAction({
          actionName: "Service_Build",
          input: sourceOutputCode,
          outputs: [serviceOutput],
          project: new PipelineProject(this, "ServiceBuildProject", {
            environment: {
              buildImage: LinuxBuildImage.STANDARD_5_0,
            },
            buildSpec: BuildSpec.fromSourceFilename(
              "build-specs/service-build-spec.yml"
            ),
          }),
        }),
      ],
    });

    pipeline.addStage({
      stageName: "PipelineUpdate",
      actions: [
        new CloudFormationCreateUpdateStackAction({
          actionName: "pipeline_update",
          stackName: "PipelineStack",
          templatePath: buildOutput.atPath("PipelineStack.template.json"),
          adminPermissions: true,
        }),
      ],
    });
  }
}
