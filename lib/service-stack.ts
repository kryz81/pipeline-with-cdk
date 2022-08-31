import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { HttpApi } from "@aws-cdk/aws-apigatewayv2-alpha";
import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";

export class ServiceStack extends Stack {
  public readonly code: Code;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.code = Code.fromCfnParameters();

    const lambda = new Function(scope, "service-lambda", {
      handler: "src/lambda.handler",
      runtime: Runtime.NODEJS_16_X,
      code: this.code,
      functionName: "ServiceLambda",
    });

    new HttpApi(this, "api", {
      defaultIntegration: new HttpLambdaIntegration("lambda-integr", lambda),
      apiName: "my-service-api",
    });
  }
}
