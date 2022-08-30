import { Construct } from "constructs";
import { CfnBudget } from "aws-cdk-lib/aws-budgets";

interface BudgetProps {
  budgetAmount: number;
  emailAddress: string;
}

export class Budget extends Construct {
  constructor(scope: Construct, id: string, props: BudgetProps) {
    super(scope, id);

    new CfnBudget(this, "budget-construct", {
      budget: {
        budgetName: "my-budget",
        budgetType: "COST",
        timeUnit: "MONTHLY",
        budgetLimit: {
          amount: props.budgetAmount,
          unit: "USD",
        },
      },
      notificationsWithSubscribers: [
        {
          notification: {
            threshold: 5,
            comparisonOperator: "GREATER_THAN",
            notificationType: "ACTUAL",
            thresholdType: "ABSOLUTE_VALUE",
          },
          subscribers: [
            {
              subscriptionType: "EMAIL",
              address: props.emailAddress,
            },
          ],
        },
      ],
    });
  }
}
