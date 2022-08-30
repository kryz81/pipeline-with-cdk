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
    });

    const sourceOutput = new Artifact("SourceOutput");

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
      ],
    });

    const buildOutput = new Artifact("BuildOutput");

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
      ],
    });

    pipeline.addStage({
      stageName: "PipelineUpdate",
      actions: [
        new CloudFormationCreateUpdateStackAction({
          actionName: "pipeline_update",
          stackName: "PipelineStack",
          templatePath: buildOutput.atPath("Pipelinestack.template.json"),
          adminPermissions: true,
        }),
      ],
    });
  }
}
